import { supabase } from "./supabase";
import { generateEmbedding } from "./gemini";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface VisionData {
  id?: string;
  north_star: string;
  anti_goals: string[];
  updated_at?: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: number;
  workspace?: string;
}

interface Task {
  id: string;
  name: string;
  project_id: string;
  status: string;
}

interface Memory {
  id: string;
  content: string;
  memory_date: string;
  type: string;
}

interface Insight {
  id: string;
  content: string;
  created_at: string;
}

interface EnergyLog {
  id: string;
  energy_level: string;
  mood_score: number;
  checkin_date: string;
  notes?: string;
}

interface Contact {
  id: string;
  name: string;
  role?: string;
  personal_facts?: string;
  last_interaction_summary?: string;
}

interface ContextData {
  northStar: VisionData | Record<string, never>;
  antiGoals: string[];
  projects: Project[];
  tasks: Task[];
  documents: string[];
  memories: Memory[];
  insights: Insight[];
  energy: EnergyLog[];
  contacts: Contact[];
}

interface ChatHistoryEntry {
  role: "user" | "assistant";
  text: string;
}

interface GeminiHistoryEntry {
  role: "user" | "model";
  parts: { text: string }[];
}

interface ExtractedAlignment {
  score: number;
  reasoning: string;
}

export interface ExtractedData {
  type: "event" | "contact" | "memory" | "none";
  alignment: ExtractedAlignment;
  workspace?: string;
  data: {
    // ─── EVENT → vault_operator_calendar_events ───
    // Columns: event_title (text), start_time (timestamptz), end_time (timestamptz), type (event_type enum)
    event_title?: string;
    start_time?: string;       // ISO 8601 datetime
    end_time?: string;         // ISO 8601 datetime, defaults to start + 1h
    event_type?: string;       // e.g. 'meeting' | 'deadline' | 'call'

    // ─── CONTACT → vault_context_people ───
    // Columns: name (text), role (text), last_interaction_summary (text), personal_facts (vector)
    name?: string;
    role?: string;
    personal_facts_text?: string; // plain text → we generate the vector embedding before saving
    last_interaction_summary?: string;

    // ─── MEMORY → vault_memories ───
    // Columns: content (text), memory_date (timestamptz), type (text), embedding (vector)
    content?: string;
    memory_type?: string;      // one of: situation | decision | insight | relationship
    memory_date?: string;      // ISO 8601, defaults to today

    // ─── Shared ───
    workspace?: string;        // company context or 'General'
  };
}

export interface SendMessageResult {
  reply: string;
  extraction: ExtractedData | null;
}

// ─── Context Fetcher ──────────────────────────────────────────────────────────

const fetchContext = async (query: string): Promise<ContextData> => {
  const empty: ContextData = {
    northStar: {},
    antiGoals: [],
    projects: [],
    tasks: [],
    documents: [],
    memories: [],
    insights: [],
    energy: [],
    contacts: [],
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const results = await Promise.all([
      supabase
        .from("vault_vision")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("vault_operator_projects")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("vault_operator_tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "pending"),
      supabase
        .from("vault_insights")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("vault_founder_energy")
        .select("*")
        .eq("user_id", user.id)
        .order("checkin_date", { ascending: false })
        .limit(3),
      supabase
        .from("vault_context_people")
        .select("*")
        .eq("user_id", user.id)
        .limit(5),
    ]);

    const [
      { data: visionData },
      { data: projects },
      { data: tasks },
      { data: insights },
      { data: energy },
      { data: contacts },
    ] = results;

    let memories: Memory[] = [];
    let documents: string[] = [];

    try {
      const embedding = await generateEmbedding(query);

      const [memResults, docResults, recentMemories] = await Promise.all([
        supabase.rpc("match_memories", {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5,
        }),
        supabase.rpc("match_documents", {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 5,
        }),
        supabase
          .from("vault_memories")
          .select("*")
          .eq("user_id", user.id)
          .order("memory_date", { ascending: false })
          .limit(5),
      ]);

      if (memResults.data || recentMemories.data) {
        memories = [...(memResults.data ?? []), ...(recentMemories.data ?? [])].filter(
          (v, i, a) => a.findIndex((t) => t.id === v.id) === i
        );
      }

      if (docResults.data) {
        documents = (docResults.data as { content: string }[]).map((d) => d.content);
      }
    } catch (e) {
      console.warn("Async retrieval failed:", e);
    }

    return {
      northStar: visionData ?? {},
      antiGoals: visionData ? (visionData.anti_goals ?? []) : [],
      projects: projects ?? [],
      tasks: tasks ?? [],
      documents,
      memories,
      insights: insights ?? [],
      energy: energy ?? [],
      contacts: contacts ?? [],
    };
  } catch (error) {
    console.error("Error fetching context:", error);
    return empty;
  }
};

// ─── Smart Router: Extract only (no DB write) ────────────────────────────────

const extractContextData = async (message: string, aiResponse: string): Promise<ExtractedData | null> => {
  try {
    const routerSystemInstruction = `You are a professional Strategic Data Router for KAWA, a personal AI orchestrator.
Your job: analyze the USER message and the AI response, then extract any NEW structured data to save.

DATABASE SCHEMA — EXACT columns per table (match these exactly, no extras):

1. CALENDAR EVENT → vault_operator_calendar_events:
   Columns: event_title (text, REQUIRED), start_time (ISO 8601, REQUIRED), end_time (ISO 8601, optional), event_type ('meeting'|'call'|'deadline'|'task', optional)
   WHEN: user mentions a meeting, call, appointment, or specific date+activity
   JSON fields to populate: event_title, start_time, end_time, event_type

2. CONTACT → vault_context_people:
   Columns: name (text, REQUIRED), role (text, optional), last_interaction_summary (text, optional), personal_facts_text (for embedding, optional)
   NOTE: personal_facts is stored as a vector in the DB — provide the raw text in personal_facts_text and the system will generate the embedding.
   WHEN: user mentions a person by name or shares info about someone
   JSON fields to populate: name, role, personal_facts_text, last_interaction_summary

3. MEMORY → vault_memories:
   Columns: content (text, REQUIRED), memory_type ('situation'|'decision'|'insight'|'relationship'), memory_date (ISO 8601, optional)
   NOTE: embedding is auto-generated from content by the system.
   WHEN: user shares context, a decision, situation, or anything worth remembering
   JSON fields to populate: content, memory_type, memory_date

SHARED: workspace (optional, company name or 'General')

RULES:
- Only extract NEW, EXPLICIT information.
- Prefer EVENT > CONTACT > MEMORY if multiple types detected.
- If nothing new and actionable: type = "none"
- CRITICAL DATE/TIME: All times user mentions are LOCAL. Include UTC offset. E.g. if user says 3pm and offset is -05:00, use 2026-03-11T15:00:00-05:00

ALIGNMENT: score 1-2 = conflicts with vision, 3 = neutral, 4-5 = aligned.

RESPOND WITH VALID JSON ONLY (no markdown, no extra text):
{
  "type": "event" | "contact" | "memory" | "none",
  "workspace": "company name or null",
  "alignment": { "score": 1-5, "reasoning": "brief explanation" },
  "data": { /* fields for the detected type only */ }
}`;

    // Build timezone-aware context so AI parses "3pm" as LOCAL time
    const _tzMin = -new Date().getTimezoneOffset();
    const _tzSign = _tzMin >= 0 ? '+' : '-';
    const _tzH = String(Math.floor(Math.abs(_tzMin) / 60)).padStart(2, '0');
    const _tzM = String(Math.abs(_tzMin) % 60).padStart(2, '0');
    const _tzLabel = `${_tzSign}${_tzH}:${_tzM}`;
    const _localDate = new Date().toISOString().slice(0, 10);
    const _localStr = new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'medium' });
    const _userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const prompt = `USER LOCAL TIME: ${_localStr} (timezone: ${_userTz}, UTC offset: ${_tzLabel})\n\nUser said: ${message}\nKAWA replied: ${aiResponse}\n\nExtract structured data. CRITICAL: all times the user mentioned are in ${_userTz} LOCAL time. You MUST include the UTC offset in start_time/end_time. Example if user says "3pm today": ${_localDate}T15:00:00${_tzLabel}`;

    const { data, error } = await supabase.functions.invoke("gemini-chat", {
      body: { message: prompt, systemInstruction: routerSystemInstruction, model: "gemini-2.5-flash" },
    });
    if (error) throw error;

    const text = (data as { text: string }).text;
    const startIdx = text.indexOf('{');
    const endIdx = text.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) return null;

    const extracted = JSON.parse(text.substring(startIdx, endIdx + 1)) as ExtractedData;
    if (extracted.type === "none") return null;

    // Promote workspace from data to top level
    if (!extracted.workspace && extracted.data?.workspace) {
      extracted.workspace = extracted.data.workspace;
    }

    return extracted;
  } catch (e) {
    console.error("Smart Router extraction error:", e);
    return null;
  }
};

// ─── Confirm and Save (called after user approves) ────────────────────────────

export const confirmAndSave = async (extracted: ExtractedData): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const ws = extracted.workspace && extracted.workspace !== "General" ? extracted.workspace : null;
    const d = extracted.data;

    // ─── EVENT → vault_operator_calendar_events ───────────────────────────────
    // Real columns: event_title, start_time, end_time, type, user_id, created_at
    // NOTE: NO description column in this table!
    if (extracted.type === "event" && d.event_title) {
      const title = ws ? `[${ws}] ${d.event_title}` : d.event_title;
      const startTime = d.start_time || new Date().toISOString();
      const endTime = d.end_time || new Date(new Date(startTime).getTime() + 3600000).toISOString();
      const { error } = await supabase.from("vault_operator_calendar_events").insert({
        user_id: user.id,
        event_title: title,
        start_time: startTime,
        end_time: endTime,
        type: d.event_type || "meeting",   // event_type enum: meeting | call | deadline | task
      });
      if (error) throw error;
      toast.success(`📅 Evento guardado: ${d.event_title}`);
      return true;
    }

    // ─── CONTACT → vault_context_people ─────────────────────────────────────
    // Real columns: name, role, last_interaction_summary, personal_facts (VECTOR), user_id
    // personal_facts is a VECTOR column — we must generate an embedding from the text!
    if (extracted.type === "contact" && d.name) {
      // Build the text we want to embed as personal_facts
      const factsText = [
        ws ? `[Empresa: ${ws}]` : null,
        d.personal_facts_text,
        d.last_interaction_summary,
      ].filter(Boolean).join(" ");

      // Generate vector embedding (required by the column type)
      const factsVector = factsText ? await generateEmbedding(factsText) : null;

      const { error } = await supabase.from("vault_context_people").insert({
        user_id: user.id,
        name: d.name,
        role: d.role || null,
        last_interaction_summary: d.last_interaction_summary || null,
        personal_facts: factsVector,       // VECTOR column — must be an embedding, not plain text
      });
      if (error) throw error;
      toast.success(`👤 Contacto guardado: ${d.name}`);
      return true;
    }

    // ─── MEMORY → vault_memories ─────────────────────────────────────────────
    // Real columns: content, memory_date, type, embedding (VECTOR), user_id
    if (extracted.type === "memory" && d.content) {
      const enriched = ws ? `[Empresa: ${ws}] ${d.content}` : d.content;
      const embedding = await generateEmbedding(enriched);   // VECTOR column
      const { error } = await supabase.from("vault_memories").insert({
        user_id: user.id,
        content: enriched,
        memory_date: d.memory_date || new Date().toISOString(),
        type: d.memory_type || "situation",  // column is 'type', not 'category'
        embedding,
      });
      if (error) throw error;
      toast.success("🧠 Memoria guardada en el Cerebro");
      return true;
    }

    return false;
  } catch (e) {
    console.error("confirmAndSave error:", e);
    toast.error("Error al guardar en la base de datos");
    return false;
  }
};


// ─── System Prompt Builder ────────────────────────────────────────────────────

const buildSystemPrompt = (context: ContextData, mode: 'interviewer' | 'consultant' = 'consultant'): string => {
  const { northStar, antiGoals, projects, tasks, documents, memories, insights, energy, contacts } = context;

  const projectsByWorkspace = projects.reduce((acc, p) => {
    const ws = p.workspace || "Principal";
    if (!acc[ws]) acc[ws] = [];
    acc[ws].push(p);
    return acc;
  }, {} as Record<string, typeof projects>);

  const projectSummary = projects.length > 0
    ? Object.entries(projectsByWorkspace)
      .map(([ws, ps]) => `🏢 **EMPRESA / WORKSPACE: ${ws}**\n${ps.map(p => `  - Proyecto: ${p.name} (Estado: ${p.status}, Prioridad: ${p.priority})`).join("\n")}`)
      .join("\n\n")
    : "No active projects.";

  const taskSummary =
    tasks.length > 0
      ? tasks
        .slice(0, 10)
        .map((t) => `- [ ] ${t.name} (Project ID: ${t.project_id})`)
        .join("\n")
      : "No pending tasks.";

  const memoryContext =
    memories.length > 0
      ? memories
        .map((m) => `- [${new Date(m.memory_date).toLocaleDateString()}]: ${m.content}`)
        .join("\n")
      : "No persistent memories.";

  const docContext =
    documents.length > 0
      ? documents.map((doc, i) => `[Doc ${i + 1}]: ${doc}`).join("\n\n")
      : "No relevant documents found.";

  const insightsContext =
    insights.length > 0
      ? insights.map((i) => `- ${i.content}`).join("\n")
      : "No saved insights.";

  const energyContext =
    energy.length > 0
      ? energy
        .map(
          (e) =>
            `- [${new Date(e.checkin_date).toLocaleDateString()}]: Energy level: ${e.energy_level} (high/medium/low), Mood score: ${e.mood_score}/5${e.notes ? `, Notes: "${e.notes}"` : ""}`
        )
        .join("\n")
      : "No recent energy logs.";

  const contactsContext =
    contacts.length > 0
      ? contacts.map((c) => `- ${c.name}: ${c.last_interaction_summary ?? "No facts documented."}`).join("\n")
      : "No relevant contacts.";

  const ns = northStar as VisionData;
  const northStarText =
    ns.north_star && ns.north_star !== "Define tu Estrella del Norte..."
      ? ns.north_star
      : "Not defined yet";

  const modeInstructions = mode === 'interviewer'
    ? `
ROLE: You are KAWA in "INTERVIEWER / RESEARCHER" mode.
PRIMARY GOAL: Ask great follow-up questions to extract information. Do not give long advice yet. Probe into the user's situation and gather missing details. Keep responses short and inquisitive.
STYLE: Curious, empathetic, patient. Use this time to let the Smart Router (your memory system) capture everything the user says before giving a final verdict.
`
    : `
ROLE: You are KAWA in "CONSULTANT / ORCHESTRATOR" mode.
PRIMARY GOAL: Be highly productive. Give direct, actionable advice and structure. Solve bottlenecks today. Act as an Executive Partner.
STYLE: Executive, decisive, structured. Focus on output and next steps. Limit clarifying questions unless absolutely necessary.
`;

  return `
You are KAWA, an advanced AI Orchestrator for personal management.
Your goal is to help the user align their Daily Actions (Operator) with their Long-term Vision (Strategy).

CRITICAL RULE ABOUT DATA SAVING:
- A SEPARATE SMART ROUTER runs in the background to extract and store data (events, contacts, memories).
- YOU must NEVER say things like "Agendado", "Lo guardé", "Añadido al calendario", "Contacto guardado", or any phrase implying data was saved.
- Instead, if the user mentions an event/person/decision, simply acknowledge it naturally: "Entendido", "Perfecto, lo tengo en cuenta", or just proceed with your response.
- The user has a confirmation card that lets them approve/discard any data before it's saved. Letting them know it will be stored is the system's job, not yours.


${modeInstructions}

HISTORY & DAILY SITUATIONS (Journal Memory):
Everything the user tells you about their life, situation, or decisions is stored here by date. Use this to track progress and evaluate context.
---
${memoryContext}
---

STRATEGIC WISDOM & SAVED INSIGHTS (Insights):
The user has MANUALLY SAVED these responses. Prioritize this advice.
---
${insightsContext}
---

CURRENT STRATEGIC CONTEXT (VAULTS):
---
VAULT 1: STRATEGY (Vision)
High Goal (North Star): ${northStarText}
Boundaries (Anti-Goals):
${antiGoals.length > 0 ? antiGoals.map((g) => `- ${g}`).join("\n") : "None defined yet"}

VAULT 2: PROJECTS (Operator)
Active Projects:
${projectSummary}

Pending Tasks:
${taskSummary}
---

VAULT 3: FOUNDER (Energy & Mental Health)
Recent state:
${energyContext}

VAULT 4: CONTEXT (CRM & Relationships)
Key People:
${contactsContext}
---

RELEVANT KNOWLEDGE (RAG):
${docContext}

INSTRUCTIONS:
1. ACT AS AN EXECUTIVE PARTNER: Execute first. Give direct, useful answers. Don't just analyze — HELP.
2. WHAT GETS SAVED AUTOMATICALLY: The system captures 3 things in the background: (a) EVENTS with a date/time → calendar, (b) CONTACTS mentioned by name → contact list, (c) GENERAL MEMORIES/context → memory vault. You DO HAVE the ability to save these automatically because the system intercepts them. DO NOT tell the user you cannot schedule meetings, save contacts, or save memories. Instead, positively confirm it by saying "Agendado.", "Contacto guardado.", or "Guardado en tu historial." PROJECTS cannot be created via chat — if the user wants to create a project, tell them: "Agrégalo en la sección Proyectos."
3. NO UNNECESSARY QUESTIONS: Only ask if strictly required to answer the user's request.
4. USE THE JOURNAL: Link current conversation to past memories when relevant.
5. ALIGNMENT FILTER: Only flag a North Star conflict if it is clear and significant.
6. PROACTIVE CORRECTION: If a user action clearly violates an Anti-Goal, mention it once briefly — then help anyway.
7. WELL-BEING: Adjust suggestions if energy logs show low energy.
8. FORMATTING & WORKSPACES: Use bold, clean lists, and structure. WHEN LISTING PROJECTS, ALWAYS GROUP THEM BY "EMPRESA/WORKSPACE" AS SHOWN IN THE CONTEXT. Do not just list the projects without mentioning their company.
`;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const chatService = {
  sendMessage: async (message: string, history: ChatHistoryEntry[] = [], mode: 'interviewer' | 'consultant' = 'consultant'): Promise<SendMessageResult> => {
    try {
      const context = await fetchContext(message);
      const systemPrompt = buildSystemPrompt(context, mode);

      const mappedHistory: GeminiHistoryEntry[] = history.map((h) => ({
        role: h.role === "assistant" ? "model" : "user",
        parts: [{ text: h.text }],
      }));

      const firstUserIndex = mappedHistory.findIndex((h) => h.role === "user");
      const cleanHistory = firstUserIndex !== -1 ? mappedHistory.slice(firstUserIndex) : [];

      const { data, error } = await supabase.functions.invoke("gemini-chat", {
        body: {
          message,
          systemInstruction: systemPrompt,
          history: cleanHistory,
          model: "gemini-2.5-flash",
        },
      });

      if (error) throw error;

      const textResponse = (data as { text: string }).text;

      // Run Smart Router extraction (no auto-save — returns data for user confirmation)
      const extraction = await extractContextData(message, textResponse);

      return { reply: textResponse, extraction };
    } catch (error) {
      console.error("Chat Error:", error);
      return { reply: `Error: ${(error as Error).message ?? "Unknown error connecting to Gemini"}`, extraction: null };
    }
  },

  // ─── Chat Sessions & History ────────────────────────────────────────────────

  getSessions: async (userId: string) => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("Error fetching sessions:", error);
      return [];
    }
    return data;
  },

  createSession: async (userId: string, title: string = "Nueva conversación") => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert([{ user_id: userId, title }])
      .select()
      .single();
    if (error) {
      console.error("Error creating session:", error);
      return null;
    }
    return data;
  },

  deleteSession: async (sessionId: string) => {
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", sessionId);
    if (error) {
      console.error("Error deleting session:", error);
      return false;
    }
    return true;
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    const { error } = await supabase
      .from("chat_sessions")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", sessionId);
    if (error) console.error("Error updating session title:", error);
  },

  getSessionMessages: async (sessionId: string) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
    return data;
  },

  saveMessage: async (sessionId: string, role: string, content: string) => {
    const { error } = await supabase
      .from("chat_messages")
      .insert([{ session_id: sessionId, role, content }]);
    if (error) console.error("Error saving message:", error);

    // Update session timestamp
    await supabase
      .from("chat_sessions")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", sessionId);
  },
};
