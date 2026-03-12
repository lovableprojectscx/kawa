import { supabase } from "./supabase";

export const generateText = async (prompt: string, systemInstruction?: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("gemini-chat", {
    body: { message: prompt, systemInstruction, model: "gemini-2.5-flash" },
  });
  
  if (error) {
    console.error("Gemini API Error details:", error);
    throw new Error(error.message || "Failed to generate text");
  }
  
  return data.text;
};

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const { data, error } = await supabase.functions.invoke("gemini-embed", {
    body: { text },
  });
  
  if (error) {
    console.error("Embed API Error details:", error);
    throw new Error(error.message || "Failed to generate embedding");
  }
  
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
