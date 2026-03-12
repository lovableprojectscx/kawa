import { supabase } from "./supabase";

export const generateText = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${projectUrl}/functions/v1/gemini-chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ message: prompt, systemInstruction, model: "gemini-2.5-flash" }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Error:", response.status, errorText);
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.text;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  const projectUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${projectUrl}/functions/v1/gemini-embed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Embed API Error:", response.status, errorText);
    throw new Error(`Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.embedding;
};

export const classifyInput = async (input: string): Promise<string> => {
  const prompt = `
    Clasifica el siguiente input del usuario en una de estas categorías:
    - 'TASK': Si el usuario quiere hacer algo, planear algo o tiene una tarea.
    - 'QUERY': Si el usuario está preguntando por información de sus bóvedas (personas, proyectos, energía).
    - 'FEELING': Si el usuario expresa cómo se siente o es un check-in emocional.
    - 'AUTO': Si no es ninguna de las anteriores.

    Output solo la categoría:
    Input: "${input}"
  `;
  return generateText(prompt);
};
