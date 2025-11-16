import { VercelRequest, VercelResponse } from "@vercel/node";
import {
  ContentListUnion,
  GenerateContentConfig,
  GoogleGenAI,
} from "@google/genai";

export interface AnalysePitchResponse {
  pitchAnalysis: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  const { pitchContext, pitchDeck, transcript } = req.body;

  if (!pitchContext) {
    return res.status(400).send("Missing pitchContext parameter");
  }
  if (!pitchDeck) {
    return res.status(400).send("Missing pitchDeck parameter");
  }
  if (!transcript) {
    return res.status(400).send("Missing transcript parameter");
  }

  const pitchAnalysis = await geminiGenerateContent({
    contents: [
      { text: `User Pitch Context: ${pitchContext}` },
      {
        inlineData: {
          mimeType: "application/pdf",
          data: pitchDeck,
        },
      },
      { text: `Interview transcript: ${transcript}` },
    ],
    config: {
      systemInstruction: [
        {
          text: `You are an astute venture capital investor. Your task is to analyze the provided pitch deck, company context, and interview transcript.

Based on all three sources, determine:
* Investment Decision: A clear "Invest," "Pass," or "Further Review Needed" decision.
* Investment Thesis: A concise rationale for your decision, synthesizing strengths and weaknesses from all materials.
* Astute Feedback: Actionable feedback points for the founder, referencing specific examples from the provided documents.

Focus specifically on the interview, with less of a focus on the pitch deck. Your analysis should aim to be more on the person and the interview, rather than the pitch deck.

Keep your analysis concise, no more than a few paragraphs.

Give your response as a copy-pasteable markdown block.`,
        },
      ],
    },
  });

  const response: AnalysePitchResponse = {
    pitchAnalysis: unwrapMarkdownCodeBlocks(pitchAnalysis.text || ""),
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

function unwrapMarkdownCodeBlocks(text: string): string {
  const lines = text.split("\n");
  if (lines.length < 3) {
    return lines.join("\n");
  }

  return lines.slice(1, -1).join("\n");
}
