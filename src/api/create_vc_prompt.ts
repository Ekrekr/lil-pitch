import {
  GoogleGenAI,
  type ContentListUnion,
  type GenerateContentConfig,
} from "@google/genai";
import { VercelRequest, VercelResponse } from "@vercel/node";

export interface CreateVCPromptResponse {
  prompt: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).send("Method Not Allowed");
  }

  const pitchContext = req.query.pitchContext as string;
  if (!pitchContext) {
    return res.status(400).send("Missing pitchContext parameter");
  }

  const pitchDeck = req.query.pitchDeck as string;
  if (!pitchDeck) {
    return res.status(400).send("Missing pitchDeck parameter");
  }

  const systemPrompt = await geminiGenerateContent({
    contents: [
      { text: `User Pitch Context: ${pitchContext}` },
      { text: `User Pitch Deck: ${pitchDeck}` },
    ],
    config: {
      systemInstruction: [
        {
          text: `You are an expert System Prompt Engineer. Your sole task is to generate a new, concise system prompt for a voice agent based on the persona and context provided by the user.

The system prompt you generate MUST strictly enforce the following rules for the agent:
* Persona: The agent must act as a potential investor in the user's startup, conducting a mock interview to evaluate the business idea.
* Conciseness: The agent's responses must be sharp and brief, avoiding unnecessary elaboration.

Interview Flow: The agent's interaction flow is fixed:
a. Ask the candidate exactly 5 questions.
b. After the 5th question, ask the candidate: "Do you have any questions for me?"
c. Answer a maximum of 3 questions from the candidate.
d. Politely conclude the interview after answering their questions (or if they have none).

Your output must be only the new system prompt.`,
        },
      ],
    },
  });

  const response: CreateVCPromptResponse = {
    prompt: systemPrompt.text || "",
  };
  return res.status(200).json(response);
}

const GEMINI_RETRY_LIMIT = 3;

const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function geminiGenerateContent({
  model = "gemini-2.5-flash",
  contents,
  config,
}: {
  model?: string;
  contents: ContentListUnion;
  config?: GenerateContentConfig;
}) {
  // Loop for the initial attempt and then 'maxRetries' more times
  for (let attempt = 1; attempt <= GEMINI_RETRY_LIMIT; attempt++) {
    try {
      console.log(
        `Attempt ${attempt}/${GEMINI_RETRY_LIMIT} to generate content...`
      );

      const response = await gemini.models.generateContent({
        contents,
        config,
        model,
      });

      // If the call succeeds, return the result immediately
      return response;
    } catch (error) {
      console.error(
        `Gemini attempt ${attempt} failed with error: ${
          (error as Error).message
        }`
      );

      // If this was the last allowed attempt, throw the error.
      if (attempt >= GEMINI_RETRY_LIMIT) {
        console.error(`All ${GEMINI_RETRY_LIMIT} attempts failed.`);
        throw error;
      }

      // Wait for a short duration before the next retry (e.g., exponential backoff).
      const delayMs = 1000 * Math.pow(2, attempt);
      console.info(`Waiting for ${delayMs / 1000}s before next retry...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("Unexpected error in geminiGenerateContent");
}
