import { GoogleGenAI, Type } from "@google/genai";
import { GenerationRequest, GenerationResult } from '../types';

const GEMINI_API_KEY_STORAGE = 'GEMINI_API_KEY';

const getApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    const key = localStorage.getItem(GEMINI_API_KEY_STORAGE);
    return key ? key.trim() : null;
  } catch (e) {
    console.warn("Failed to retrieve API key from localStorage");
    return null;
  }
};

const SYSTEM_INSTRUCTION = `
You are a professional software engineer assistant designed to format daily standups.
Your goal is to take raw, messy notes or voice transcripts and convert them into a clean, professional standup.

### Consistency Guard Rules:
1. **Contradiction Detection**: Compare the current raw input with the "Previous Standup Context" provided.
2. **Zombie Task Detection**: If a task was marked as "Completed" or "Done" in the previous standup but appears again in today's "Working on today" section without context, flag it.
3. **Refinement Suggestion**: Instead of just repeating a completed task, suggest a more logical continuation.
4. **Tone**: Stay professional and engineering-focused.
5. **Jira Integration**: If "Active Jira Tickets" are provided, incorporate them into the "What I am working on today" section if they are relevant to the raw notes, or if the notes are sparse, assume these are the focus. Use the format "[KEY] Title".

### Formatting Rules:
- **Format**:
  <Date (e.g., 15/10/2024 Thursday)>
  **What I did the last working day:**
  - [Task 1]
  **Blockers:**
  - [Blocker details or "None"]
  **What I am working on today:**
  - [Task 1]

### Response Format:
You must return a JSON object with:
1. "standupText": The full formatted markdown standup.
2. "consistencyNotes": An array of short strings explaining any contradictions or suggestions.
`;

const REFINE_INSTRUCTION = `
You are a professional editor. You will receive an existing standup draft and a user's instruction for modification.
Update the standup draft according to the instruction while maintaining the exact markdown structure and professional tone.
Do not lose existing information unless explicitly asked to remove it.
Return the result in the same JSON format as before.
`;

export const generateStandup = async (request: GenerationRequest): Promise<GenerationResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please add your API key in settings.");
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    let prompt = `Current Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n`;
    
    if (request.selectedTickets && request.selectedTickets.length > 0) {
      prompt += `\nSelected Active Jira Tickets (Include these in "Working on today" or "Last working day" based on context):\n`;
      prompt += JSON.stringify(request.selectedTickets.map(t => ({ key: t.ticketKey, title: t.title, status: t.status }))) + `\n`;
    }

    prompt += `\nRaw Notes:\n"""\n${request.rawInput}\n"""\n`;

    if (request.previousContext) {
      prompt += `\nPrevious Standup Context:\n"""\n${request.previousContext}\n"""`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            standupText: { type: Type.STRING },
            consistencyNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['standupText', 'consistencyNotes']
        },
        temperature: 0.2,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      standupText: result.standupText || "",
      consistencyNotes: result.consistencyNotes || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate standup.");
  }
};

export const refineStandup = async (currentText: string, instruction: string): Promise<GenerationResult> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key is not configured. Please add your API key in settings.");
  }
  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = `Current Draft:\n"""\n${currentText}\n"""\n\nUser Instruction: "${instruction}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: REFINE_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            standupText: { type: Type.STRING },
            consistencyNotes: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['standupText', 'consistencyNotes']
        },
        temperature: 0.3,
      },
    });

    const result = JSON.parse(response.text || "{}");
    return {
      standupText: result.standupText || currentText,
      consistencyNotes: result.consistencyNotes || []
    };
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    throw new Error("Failed to update standup.");
  }
};
