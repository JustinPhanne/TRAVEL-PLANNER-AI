import { GoogleGenAI } from "@google/genai";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("Add GEMINI_API_KEY to your .env file");
}

export const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Flash tier everywhere per the build plan — fast, cheap, and covered by
// Google AI Studio's free tier. Override via .env if this model name has
// since been retired/renamed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";
