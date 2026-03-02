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
  priority: string;
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
  created_at: string;
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

interface ExtractedData {
  type: "event" | "contact" | "memory" | "none";
  alignment: ExtractedAlignment;
  data: Record<string, string>;
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

// ─── Background Extractor ─────────────────────────────────────────────────────

const extractAndRouteContext = async (message: string, aiResponse: string): Promise<void> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const routerSystemInstruction = `You are a professional Strategic Data Router. Analyze the conversation and extract structured information while evaluating alignment with the user's VISION (North Star and Anti-Goals).

EXTRACT ONLY IF NEW AND EXPLICIT:
1. EVENT: Meetings, tasks with a date/time.
2. CONTACT: Names of people, their roles, or important facts.
3. MEMORY: General situations, decisions, or daily habits.

EVALUATE ALIGNMENT:
Compare the user's action/request with their Vision context.
- alignment_score: 1 (Conflicts with Vision/Anti-Goals) to 5 (Perfectly Aligned).
- alignment_reasoning: Concise explanation of why it aligns or conflicts.

RESPONSE FORMAT (JSON ONLY):
{
  "type": "event" | "contact" | "memory" | "none",
  "alignment": {
    "score": number,
    "reasoning": "string"
  },
  "data": {}
}`;

    const prompt = `CURRENT TIME: ${new Date().toISOString()}\nConversation:\nUser: ${message}\nAI: ${aiResponse}\n\nRoute and extract data:`;

    const { data, error } = await supabase.functions.invoke("gemini-chat", {
      body: {
        message: prompt,
        systemInstruction: routerSystemInstruction,
        model: "gemini-2.5-flash",
      },
    });

    if (error) throw error;

    const textResponse = (data as { text: string }).text;

    // Improved JSON cleaning: find the first { and last } to isolate the JSON object
    const startIdx = textResponse.indexOf('{');
    const endIdx = textResponse.lastIndexOf('}');

    if (startIdx === -1 || endIdx === -1) {
      console.warn("Smart Router: No JSON found in response", textResponse);
      return;
    }

    const cleanJson = textResponse.substring(startIdx, endIdx + 1);
    let extracted: ExtractedData;

    try {
      extracted = JSON.parse(cleanJson) as ExtractedData;
    } catch (e) {
      console.error("Smart Router: Failed to parse JSON", e, cleanJson);
      return;
    }

    if (extracted.type === "none" && extracted.alignment?.score >= 3) return;

    const { type, data: extractedData, alignment } = extracted;

    if (alignment?.score < 3) {
      console.warn("STRATEGIC CONFLICT DETECTED:", alignment.reasoning);
      const { error } = await supabase.from("vault_memories").insert({
        user_id: user.id,
        content: `ALERTA DE ALINEACIÓN: ${alignment.reasoning}`,
        memory_date: new Date().toISOString(),
        type: "decision",
        embedding: await generateEmbedding(alignment.reasoning),
      });
      if (!error) toast.warning("Alerta de Alineación guardada", { description: alignment.reasoning });
    }

    if (type === "event" && extractedData.event_title) {
      const { error } = await supabase.from("vault_operator_calendar_events").insert({
        user_id: user.id,
        event_title: extractedData.event_title,
        start_time: extractedData.start_time || new Date().toISOString(),
        end_time: new Date(
          new Date(extractedData.start_time || Date.now()).getTime() + 3600000
        ).toISOString(),
        type: extractedData.type || "meeting",
      });
      if (!error) toast.success(`Evento guardado: ${extractedData.event_title}`);
      else console.error("Error saving event:", error);
    } else if (type === "contact" && extractedData.name) {
      const embedding = await generateEmbedding(extractedData.personal_facts || extractedData.name);
      const { error } = await supabase.from("vault_context_people").insert({
        user_id: user.id,
        name: extractedData.name,
        role: extractedData.role || "Contact",
        personal_facts: embedding,
        last_interaction_summary: `Added via chat: ${extractedData.personal_facts ?? ""}`,
      });
      if (!error) toast.success(`Contacto guardado: ${extractedData.name}`);
      else console.error("Error saving contact:", error);
    } else if (type === "memory" && extractedData.content) {
      const embedding = await generateEmbedding(extractedData.content);
      const { error } = await supabase.from("vault_memories").insert({
        user_id: user.id,
        content: extractedData.content,
        memory_date: new Date().toISOString(),
        type: extractedData.category || "situation",
        embedding,
      });
      if (!error) toast.success("Memoria guardada automáticamente");
      else console.error("Error saving memory:", error);
    }
  } catch (e) {
    console.error("Smart Router Error:", e);
  }
};

// ─── System Prompt Builder ────────────────────────────────────────────────────

const buildSystemPrompt = (context: ContextData): string => {
  const { northStar, antiGoals, projects, tasks, documents, memories, insights, energy, contacts } = context;

  const projectSummary =
    projects.length > 0
      ? projects.map((p) => `- ${p.name} (${p.status}, Priority: ${p.priority})`).join("\n")
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
            `- [${new Date(e.created_at).toLocaleDateString()}]: Energy ${e.energy_level}/5, Mood ${e.mood_score}/5`
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

  return `
You are KAWA, an advanced AI Orchestrator for personal management.
Your goal is to help the user align their Daily Actions (Operator) with their Long-term Vision (Strategy).

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
2. AUTOMATIC CAPTURE: You are connected to all 4 Bóvedas. If the user mentions a meeting, a contact, or a new fact, ASSUME IT IS BEING SAVED AUTOMATICALLY. You may briefly confirm (e.g., "Agendado." or "Guardado.") but never interrupt the flow with confirmations that break focus.
3. NO UNNECESSARY QUESTIONS: NEVER ask questions just to fill the vault. Only ask a question if the user's request literally cannot be completed without that information. Extract context passively from what the user shares naturally.
4. USE THE JOURNAL: Link new events to previous 'SITUATIONS' in the memory to maintain continuity.
5. ALIGNMENT FILTER: Only flag a North Star conflict if it is clear and significant. Do not editorialize on every message.
6. PROACTIVE CORRECTION: If a user action clearly violates an Anti-Goal, mention it once, briefly — then help anyway.
7. WELL-BEING: Adjust workload suggestions if Vault 3 shows low energy.
8. FORMATTING: Use bold, clean lists, and structure.
`;
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const chatService = {
  sendMessage: async (message: string, history: ChatHistoryEntry[] = []): Promise<string> => {
    try {
      const context = await fetchContext(message);
      const systemPrompt = buildSystemPrompt(context);

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

      // Fire-and-forget background routing
      extractAndRouteContext(message, textResponse);

      return textResponse;
    } catch (error) {
      console.error("Chat Error:", error);
      return `Error: ${(error as Error).message ?? "Unknown error connecting to Gemini"}`;
    }
  },
};
