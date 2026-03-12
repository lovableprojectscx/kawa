import { supabase } from "./supabase";
import { generateEmbedding } from "./gemini";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CompanyData {
  id: string;
  name: string;
  vision: string;
  mision: string;
  anti_goals: string[];
}

interface Project {
  id: string;
  name: string;
  status: string;
  priority: number;
  company_id?: string;
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
  companies: CompanyData[];
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
  type: "event" | "contact" | "memory" | "project" | "task" | "none";
  alignment: ExtractedAlignment;
  workspace?: string;
  data: {
    event_title?: string;
    start_time?: string;
    end_time?: string;
    event_type?: string;
    name?: string;
    role?: string;
    personal_facts_text?: string;
    last_interaction_summary?: string;
    content?: string;
    memory_type?: string;
    memory_date?: string;
    project_name?: string;
    project_description?: string;
    project_deadline?: string;
    project_priority?: string;
    task_name?: string;
    task_project_id?: string;
    workspace?: string;
  };
}

export interface SendMessageResult {
  reply: string;
  extraction: ExtractedData | null;
}

// ─── Context Fetcher ──────────────────────────────────────────────────────────

const fetchContext = async (query: string): Promise<ContextData> => {
  const empty: ContextData = {
    companies: [],
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
      supabase.from("vault_companies").select("*").eq("user_id", user.id).order("name"),
      supabase.from("vault_operator_projects").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("vault_operator_tasks").select("*").eq("user_id", user.id).eq("status", "pending"),
      supabase.from("vault_insights").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
      supabase.from("vault_founder_energy").select("*").eq("user_id", user.id).order("checkin_date", { ascending: false }).limit(3),
      supabase.from("vault_context_people").select("*").eq("user_id", user.id).limit(5),
    ]);

    const [{ data: companiesData }, { data: projects }, { data: tasks }, { data: insights }, { data: energy }, { data: contacts }] = results;

    let memories: Memory[] = [];
    let documents: string[] = [];

    try {
      const embedding = await generateEmbedding(query);
      const [memResults, docResults, recentMemories] = await Promise.all([
        supabase.rpc("match_memories", { query_embedding: embedding, match_threshold: 0.5, match_count: 5 }),
        supabase.rpc("match_documents", { query_embedding: embedding, match_threshold: 0.5, match_count: 5 }),
        supabase.from("vault_memories").select("*").eq("user_id", user.id).order("memory_date", { ascending: false }).limit(5),
      ]);

      if (memResults.data || recentMemories.data) {
        memories = [...(memResults.data ?? []), ...(recentMemories.data ?? [])].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);
      }
      if (docResults.data) {
        documents = (docResults.data as { content: string }[]).map((d) => d.content);
      }
    } catch (e) {
      console.warn("Async retrieval failed:", e);
    }

    return {
      companies: companiesData ?? [],
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

const extractContextData = async (message: string, aiResponse: string, companies: CompanyData[]): Promise<ExtractedData | null> => {
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
- FORMATTING: Clean up data professionally. Strip conversational filler words (e.g. from "su número es 91823" output "Celular: 91823" or just "91823"). Name and Role should be precise titles.
- CRITICAL DATE/TIME: All times user mentions are LOCAL. Include UTC offset. E.g. if user says 3pm and offset is -05:00, use 2026-03-11T15:00:00-05:00

ALIGNMENT: score 1-2 = conflicts with vision, 3 = neutral, 4-5 = aligned.

RESPOND WITH VALID JSON ONLY (no markdown, no extra text):
{
  "type": "event" | "contact" | "memory" | "project" | "task" | "none",
  "workspace": "company name or null",
  "alignment": { "score": 1, "reasoning": "brief explanation" },
  "data": { /* fields for the detected type only */ }
}`;

    const _tzMin = -new Date().getTimezoneOffset();
    const _tzSign = _tzMin >= 0 ? '+' : '-';
    const _tzH = String(Math.floor(Math.abs(_tzMin) / 60)).padStart(2, '0');
    const _tzM = String(Math.abs(_tzMin) % 60).padStart(2, '0');
    const _tzLabel = `${_tzSign}${_tzH}:${_tzM}`;
    const _localDate = new Date().toISOString().slice(0, 10);
    const _localStr = new Date().toLocaleString('es-ES', { dateStyle: 'full', timeStyle: 'medium' });
    const _userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const prompt = `USER LOCAL TIME: ${_localStr} (timezone: ${_userTz}, UTC offset: ${_tzLabel})\n\nUser said: ${message}\nKAWA replied: ${aiResponse}\n\nExtract structured data. CRITICAL: all times the user mentioned are in ${_userTz} LOCAL time. You MUST include the UTC offset in start_time/end_time. Example if user says "3pm today": ${_localDate}T15:00:00${_tzLabel}`;

    const { data: invokeResult, error: invokeErr } = await supabase.functions.invoke("gemini-chat", {
      body: { message: prompt, systemInstruction: routerSystemInstruction, model: "gemini-2.5-flash" },
    });

    if (invokeErr) throw new Error(invokeErr.message || "Failed to extract context");

    const textResult = invokeResult.text;
    const startIdx = textResult.indexOf('{');
    const endIdx = textResult.lastIndexOf('}');
    if (startIdx === -1 || endIdx === -1) return null;

    const extracted = JSON.parse(textResult.substring(startIdx, endIdx + 1)) as ExtractedData;
    if (extracted.type === "none") return null;

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

export const confirmAndSave = async (extracted: ExtractedData, message: string, companies: CompanyData[]): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const ws = extracted.workspace && extracted.workspace !== "General" ? extracted.workspace : null;
    const d = extracted.data;

    if (extracted.type === "event" && d.event_title) {
      const title = ws ? `[${ws}] ${d.event_title}` : d.event_title;
      const startTime = d.start_time || new Date().toISOString();
      const endTime = d.end_time || new Date(new Date(startTime).getTime() + 3600000).toISOString();
      const { error } = await supabase.from("vault_operator_calendar_events").insert({
        user_id: user.id,
        event_title: title,
        start_time: startTime,
        end_time: endTime,
        type: d.event_type || "meeting",
      });
      if (error) throw error;
      toast.success(`📅 Evento guardado: ${d.event_title}`);
      return true;
    }

    if (extracted.type === "contact" && d.name) {
      const factsText = [ws ? `[Empresa: ${ws}]` : null, d.personal_facts_text, d.last_interaction_summary].filter(Boolean).join(" ");
      const { error } = await supabase.from("vault_context_people").insert({
        user_id: user.id,
        name: d.name,
        role: d.role || null,
        last_interaction_summary: factsText || null, // Combines facts and interaction into the valid text column
      });
      if (error) throw error;
      toast.success(`👤 Contacto guardado: ${d.name}`);
      return true;
    }

    if (extracted.type === "memory" && d.content) {
      const enriched = ws ? `[Empresa: ${ws}] ${d.content}` : d.content;
      const { error } = await supabase.from("vault_memories").insert({
        user_id: user.id,
        content: enriched,
        memory_date: d.memory_date || new Date().toISOString(),
        type: d.memory_type || "situation"
      });
      if (error) throw error;
      toast.success("🧠 Memoria guardada en el Cerebro");
      return true;
    }

    if (extracted.type === "project" && d.project_name) {
      // Intentar encontrar el ID de la empresa por el nombre de workspace extraído
      let finalCompanyId = null;
      if (ws) {
        const matchingCompany = companies.find((c: CompanyData) => c.name.toLowerCase() === ws.toLowerCase());
        if (matchingCompany) finalCompanyId = matchingCompany.id;
      }

      const { error } = await supabase.from("vault_operator_projects").insert({
        user_id: user.id,
        name: d.project_name,
        description: d.project_description || null,
        status: 'active',
        priority: d.project_priority || 'medium',
        deadline: d.project_deadline || null,
        workspace: ws || 'General',
        company_id: finalCompanyId
      });
      if (error) throw error;
      toast.success(`💼 Proyecto creado: ${d.project_name}`);
      return true;
    }

    if (extracted.type === "task" && d.task_name) {
      // Find the project ID if the AI suggested a name or we just use the first active project as fallback
      let resolvedProjectId = d.task_project_id;
      
      const { error } = await supabase.from("vault_operator_tasks").insert({
        user_id: user.id,
        name: d.task_name,
        project_id: resolvedProjectId || null,
        status: 'pending'
      });
      if (error) throw error;
      toast.success(`✅ Tarea añadida: ${d.task_name}`);
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
  const { companies, projects, tasks, documents, memories, insights, energy, contacts } = context;

  const companyMap = new Map<string, string>();
  companies.forEach(c => companyMap.set(c.id, c.name));

  const projectsByWorkspace = projects.reduce((acc, p) => {
    const ws = p.company_id ? (companyMap.get(p.company_id) || "General") : "Personal";
    if (!acc[ws]) acc[ws] = [];
    acc[ws].push(p);
    return acc;
  }, {} as Record<string, typeof projects>);

  const projectSummary = projects.length > 0
    ? Object.entries(projectsByWorkspace)
      .map(([ws, ps]) => `🏢 **EMPRESA / WORKSPACE: ${ws}**\n${ps.map(p => `  - Proyecto: ${p.name} (Estado: ${p.status}, Prioridad: ${p.priority})`).join("\n")}`)
      .join("\n\n")
    : "No active projects.";

  const taskSummary = tasks.length > 0 ? tasks.slice(0, 10).map((t) => `- [ ] ${t.name} (Project ID: ${t.project_id})`).join("\n") : "No pending tasks.";
  const memoryContext = memories.length > 0 ? memories.map((m) => `- [${new Date(m.memory_date).toLocaleDateString()}]: ${m.content}`).join("\n") : "No persistent memories.";
  const docContext = documents.length > 0 ? documents.map((doc, i) => `[Doc ${i + 1}]: ${doc}`).join("\n\n") : "No relevant documents found.";
  const insightsContext = insights.length > 0 ? insights.map((i) => `- ${i.content}`).join("\n") : "No saved insights.";
  const energyContext = energy.length > 0 ? energy.map((e) => `- [${new Date(e.checkin_date).toLocaleDateString()}]: Energy level: ${e.energy_level} (high/medium/low), Mood score: ${e.mood_score}/5${e.notes ? `, Notes: "${e.notes}"` : ""}`).join("\n") : "No recent energy logs.";
  const contactsContext = contacts.length > 0 ? contacts.map((c) => `- ${c.name}: ${c.last_interaction_summary ?? "No facts documented."}`).join("\n") : "No relevant contacts.";

  const companiesSummary = companies.length > 0
    ? companies.map(c => `🏢 Empresa: ${c.name}\nVisión: ${c.vision || "No definida"}\nMisión: ${c.mision || "No definida"}\nLímites (Anti-goals): ${(c.anti_goals || []).join(", ") || "Ninguno"}`).join("\n\n")
    : "Sin empresas definidas.";

  const modeInstructions = mode === 'interviewer'
    ? `MODO EXPLORADOR (INTERVIEWER): Eres un Coach Estratégico de Élite. Tu objetivo NO es dar consejos inmediatos, sino hacer preguntas profundas, reveladoras y socráticas. Escucha activamente para descubrir las verdaderas metas, bloqueos y la psicología del emprendedor. Haz que reflexionen.`
    : `MODO CONSULTOR (CONSULTANT): Eres el Asesor Estratégico y Confidente Diario del emprendedor. Tu objetivo es dar consejos directos, altamente accionables, prácticos y muy motivadores. Ayuda al usuario a ejecutar su visión hoy mismo. Sé propositivo y resolutivo.`;

  return `
You are KAWA, an elite AI Orchestrator and Strategic Advisor for entrepreneurs.
Your goal is to help the user align their Daily Actions (Operator) with their Long-term Vision (Strategy).
You must be extremely professional, uplifting, and act as their trusted daily counselor.

${modeInstructions}

DAILY SITUATIONS:
${memoryContext}

SAVED INSIGHTS:
${insightsContext}

STRATEGIC CONTEXT / EMPRESAS:
${companiesSummary}

Projects: ${projectSummary}
Tasks: ${taskSummary}
Contacts: ${contactsContext}
Knowledge: ${docContext}
Energy: ${energyContext}

INSTRUCTIONS:
1. ACT AS AN EXECUTIVE PARTNER: Be positive, professional, and encouraging. Your goal is to make the user feel supported.
2. NO UNNECESSARY QUESTIONS: Be concise and respect their time.
3. ALIGNMENT FILTER: Only flag a North Star conflict if it is clear and significant. Always frame it constructively.
4. SECURITY CRITICAL: You possess internal knowledge of how data is mapped to the database. UNDER NO CIRCUMSTANCES should you ever mention database table names, column names, "JSON fields", or internal system mechanics to the user. Hide the complexity and act like a human advisor.
5. POST-FORMAL THINKING — CRITICAL: Do NOT anchor your response only to what was said last in the conversation. Treat the chat history as ONE data point. Cross-reference what the user says with ALL the context above (companies, memories, projects, contacts, energy). Look for hidden connections, contradictions, or blind spots the user may not see themselves. Your responses should reflect the FULL picture, not just the last message.
6. HOLISTIC CONTEXT: If a user asks about a task but their energy is low and their strategic vision points elsewhere, acknowledge this. Synthesize across all dimensions. Think like a strategic advisor who has been following this entrepreneur for months, not a chatbot reacting to a single message.
7. NON-LINEAR REASONING: Be willing to reframe questions, offer a different angle, or gently challenge assumptions if the classified context suggests the user is not seeing the whole picture. This is what earns trust over time.
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

      const { data: invokeData, error: invokeError } = await supabase.functions.invoke("gemini-chat", {
        body: {
          message,
          systemInstruction: systemPrompt,
          history: cleanHistory,
          model: "gemini-2.5-flash",
        },
      });

      if (invokeError) throw new Error(invokeError.message || "Failed to send message");

      const textReply = invokeData.text;
      const extraction = await extractContextData(message, textReply, context.companies);

      return { reply: textReply, extraction };
    } catch (error) {
      console.error("Chat Error:", error);
      return { reply: `Error: ${(error as Error).message ?? "Unknown error connecting to Gemini"}`, extraction: null };
    }
  },

  getSessions: async (userId: string) => {
    const { data, error } = await supabase.from("chat_sessions").select("*").eq("user_id", userId).order("updated_at", { ascending: false });
    return error ? [] : data;
  },

  createSession: async (userId: string, title: string = "Nueva conversación") => {
    const { data, error } = await supabase.from("chat_sessions").insert([{ user_id: userId, title }]).select().single();
    return error ? null : data;
  },

  deleteSession: async (sessionId: string) => {
    const { error } = await supabase.from("chat_sessions").delete().eq("id", sessionId);
    return !error;
  },

  updateSessionTitle: async (sessionId: string, title: string) => {
    await supabase.from("chat_sessions").update({ title, updated_at: new Date().toISOString() }).eq("id", sessionId);
  },

  getSessionMessages: async (sessionId: string) => {
    const { data, error } = await supabase.from("chat_messages").select("*").eq("session_id", sessionId).order("created_at", { ascending: true });
    return error ? [] : data;
  },

  saveMessage: async (sessionId: string, role: string, content: string) => {
    await supabase.from("chat_messages").insert([{ session_id: sessionId, role, content }]);
    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);
  },
};
