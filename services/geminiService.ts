import { GoogleGenAI } from "@google/genai";
import { RagContext } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert Data Engineer and RAG System specialized in configuring Routing Metadata. 
Your goal is to generate a JSON configuration file that strictly matches a provided Template structure.

You will be provided with:
1. **Schema Definitions**: Explains what each field means.
2. **Meeting Transcript**: Contains the business logic, rules, and constraints (e.g., "In case X, use constraint Y").
3. **Target Template**: The exact JSON structure you must output.
4. **User Use Case**: The specific scenario we are configuring for.

**Process:**
1. Analyze the User Use Case.
2. Search the Meeting Transcript for rules relevant to this use case.
3. Map these rules to the fields defined in the Schema.
4. Fill out the Target Template with the correct values.

**Output Rules:**
- Return ONLY valid JSON.
- Strictly adhere to the keys in the Target Template.
- Do not add conversational text outside the JSON.
`;

export const generateRoutingJson = async (
  context: RagContext,
  userUseCase: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Construct a prompt that effectively acts as the RAG retrieval mechanism
  // by placing all context into the prompt (Long Context Window strategy).
  const prompt = `
=== CONTEXT: SCHEMA DEFINITIONS (RoutingMetadata 3) ===
${context.schema || "No schema provided."}

=== CONTEXT: BUSINESS LOGIC TRANSCRIPT (Chestha_ Phani...) ===
${context.transcript || "No transcript provided."}

=== CONTEXT: TARGET TEMPLATE (RoutingMetadata 4) ===
${context.template || "{}"}

=== USER USE CASE ===
${userUseCase}

=== INSTRUCTIONS ===
Based on the Transcript rules and Schema definitions, generate the JSON for the above Use Case using the Target Template structure.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2, // Low temperature for deterministic, rule-following output
      },
    });

    return response.text || "{}";
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};