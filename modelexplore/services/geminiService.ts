import { GoogleGenAI } from "@google/genai";
import { ChartType } from "../types";

// Note: Always use named parameter for apiKey and create instance per-request for consistency
// with the latest Gemini API best practices.

const SESSION_PRINT_BLOCK = '\n\n## --- Session Print Block ---\n\nsessionInfo()';

export async function generateRCode(chartType: ChartType, datasetName: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Generate professional R code for a ${chartType} plot using '${datasetName}'. Just the code.`,
      config: {
        systemInstruction: "Expert R developer. Provide code with headers.",
      },
    });
    // Property .text is used directly
    let code = response.text || "# Error generating code";
    if (!code.includes('## --- Session Print Block ---')) {
      code += SESSION_PRINT_BLOCK;
    }
    return code;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `# Error generating R code${SESSION_PRINT_BLOCK}`;
  }
}

export async function modifyRCode(currentCode: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Current R Code Context:\n${currentCode}\n\nUser Question/Task: ${prompt}`,
      config: {
        systemInstruction: "You are an expert R pharmacometrics assistant. Answer the user's question or provide code suggestions based on the context. Do not output just the code; engage in a professional conversation and explain your suggestions. Use Markdown for clarity.",
        temperature: 0.3,
      },
    });
    // Property .text is used directly
    return response.text || "No response received.";
  } catch (error) {
    console.error("AI Assistant Error:", error);
    throw error;
  }
}