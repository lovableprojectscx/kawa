import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MessagePart {
  text: string;
}

interface HistoryEntry {
  role: "user" | "model";
  parts: MessagePart[];
}

interface ChatRequest {
  message: string;
  model?: string;
  systemInstruction?: string;
  history?: HistoryEntry[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GOOGLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "GOOGLE_API_KEY secret not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ChatRequest = await req.json();
    const { message, model = "gemini-2.5-flash", systemInstruction, history = [] } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message field is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contents: HistoryEntry[] = [
      ...history,
      { role: "user", parts: [{ text: message }] },
    ];

    const requestBody: Record<string, unknown> = { contents };

    if (systemInstruction) {
      requestBody.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(JSON.stringify({ error: `Gemini API error: ${errBody}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
