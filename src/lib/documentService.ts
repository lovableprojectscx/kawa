import { supabase } from "@/lib/supabase";
import { generateEmbedding } from "@/lib/gemini";
import * as pdfjsLib from "pdfjs-dist";

// Helper to extract text from PDF
// Note: In production, better to use a server-side parser or Edge Function.
// For this MVP, we use client-side parsing.
// You need to set the worker source for pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const documentService = {

    // 1. Upload File to Storage
    uploadFile: async (file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('kawa-docs')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('kawa-docs')
                .getPublicUrl(filePath);

            return { path: filePath, url: publicUrl };
        } catch (error) {
            console.error("Error uploading file:", error);
            throw error;
        }
    },

    // 2. Extract Text (PDF or Text)
    extractText: async (file: File): Promise<string> => {
        if (file.type === "text/plain") {
            return await file.text();
        }

        if (file.type === "application/pdf") {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = "";

                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map((item: any) => item.str).join(" ");
                    fullText += pageText + "\n";
                }
                return fullText;
            } catch (error) {
                console.error("PDF Parsing Error:", error);
                throw new Error("Could not parse PDF. Make sure it is a valid text-based PDF.");
            }
        }

        throw new Error("Unsupported file type");
    },

    // 3. Chunk Text (Simple Strategy)
    chunkText: (text: string, chunkSize: number = 1000, overlap: number = 100) => {
        const chunks: string[] = [];
        let start = 0;

        while (start < text.length) {
            const end = start + chunkSize;
            let actualEnd = end;

            // Try to break at a period before the cut point, staying in the latter half of the chunk
            if (actualEnd < text.length) {
                const lastPeriod = text.lastIndexOf('.', actualEnd);
                if (lastPeriod !== -1 && lastPeriod > start + Math.floor(chunkSize / 2)) {
                    actualEnd = lastPeriod + 1;
                }
            }

            chunks.push(text.substring(start, actualEnd).trim());
            start += chunkSize - overlap;
        }

        return chunks;
    },

    // 4. Process & Save Document (Main Flow)
    processDocument: async (file: File, manualText?: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            let textContent = "";
            let metadata = { filename: "manual_entry.txt", type: "text" };

            if (file) {
                // Upload logic could go here if we want to store the raw file
                // const { path } = await documentService.uploadFile(file);
                textContent = await documentService.extractText(file);
                metadata = { filename: file.name, type: file.type };
            } else if (manualText) {
                textContent = manualText;
            }

            if (!textContent) throw new Error("No text content found");

            // Chunking
            const chunks = documentService.chunkText(textContent);

            // Embed & Save
            for (const chunk of chunks) {
                if (chunk.length < 50) continue; // Skip tiny chunks

                const embedding = await generateEmbedding(chunk);

                const { error } = await supabase
                    .from('vault_documents')
                    .insert({
                        user_id: user.id,
                        content: chunk,
                        metadata: metadata,
                        embedding: embedding
                    });

                if (error) throw error;
            }

            return { success: true, chunks: chunks.length };

        } catch (error) {
            console.error("Processing Error:", error);
            throw error;
        }
    }
};
