import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

if (!apiKey) {
  console.warn("NEXT_PUBLIC_GEMINI_API_KEY is not set. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || "" });

export interface ResearchResult {
  answer: string;
  sources: { title: string; url: string }[];
}

export interface ResearchHistoryEntry {
  query: string;
  answer: string;
}

export async function performResearch(query: string, history: ResearchHistoryEntry[] = []): Promise<ResearchResult> {
  if (!apiKey) {
    throw new Error("API Key missing");
  }

  try {
    const contents: any[] = [];
    
    // Add history
    history.forEach(entry => {
      contents.push({
        role: "user",
        parts: [{ text: entry.query }]
      });
      contents.push({
        role: "model",
        parts: [{ text: entry.answer }]
      });
    });

    // Add current query
    contents.push({
      role: "user",
      parts: [{ text: `Realize uma pesquisa acadêmica rigorosa e detalhada sobre: ${query}. 
      
      REQUISITOS OBRIGATÓRIOS:
      1. Use citações no corpo do texto seguindo estritamente as normas APA (7ª edição).
      2. Ao final, forneça uma seção de "Referências" completa, também em formato APA 7.
      3. O tom deve ser formal, acadêmico e adequado para um TCC ou monografia.
      4. Estruture o conteúdo com títulos e subtítulos claros em Markdown.
      5. Mantenha a continuidade com as pesquisas anteriores desta sessão, se houver.` }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "Você é um assistente de pesquisa acadêmica de elite, especializado em normas ABNT e APA 7. Sua tarefa é fornecer informações precisas, atualizadas e bem estruturadas para estudantes de graduação e pós-graduação (TCC, monografias, artigos). Use a Pesquisa Google para encontrar os dados mais recentes e confiáveis (artigos científicos, repositórios acadêmicos, sites governamentais). Sempre cite suas fontes no formato APA 7. Responda em Português do Brasil.",
      }
    });

    const text = response.text || "Não foi possível gerar uma resposta.";
    
    // Extract sources from grounding metadata if available
    // Note: The SDK structure for grounding metadata might vary, 
    // but we can try to extract it from the response candidates.
    const sources: { title: string; url: string }[] = [];
    
    const candidate = response.candidates?.[0];
    if (candidate?.groundingMetadata?.searchEntryPoint?.renderedContent) {
      // This is one way to show the search entry point
    }

    // Attempt to extract sources from grounding chunks if they exist
    if (candidate?.groundingMetadata?.groundingChunks) {
      candidate.groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.title && chunk.web?.uri) {
          sources.push({
            title: chunk.web.title,
            url: chunk.web.uri
          });
        }
      });
    }

    // Also check for searchEntryPoint which is common for Google Search tool
    if (candidate?.groundingMetadata?.searchEntryPoint?.renderedContent) {
      // We can't easily parse the HTML renderedContent here, 
      // but the groundingChunks usually contain the actual links.
    }

    return {
      answer: text,
      sources: sources.filter((v, i, a) => a.findIndex(t => t.url === v.url) === i) // Unique sources
    };
  } catch (error) {
    console.error("Error in performResearch:", error);
    throw error;
  }
}
