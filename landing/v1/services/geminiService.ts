import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Note: In a real environment, handle the missing key gracefully.
const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzePkData = async (dataPointSummary: string): Promise<string> => {
  if (!apiKey) {
    return "API Key missing. Please provide a valid API_KEY in the environment to generate insights.";
  }

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Act as a senior Pharmacometrician. 
      Analyze the following summary of a PK/PD simulation dataset:
      "${dataPointSummary}"
      
      Provide a concise, 2-sentence executive summary highlighting the Cmax, Tmax implications, and potential safety concerns for a clinical trial.
      Do not use markdown formatting. Keep it professional and direct.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate analysis at this time. Please check your network or API quota.";
  }
};