import { TextGenInput } from "@/types";

export function createTextSystemPrompt(
  language: string = "en",
  maxChars: number = 220
): string {
  return `You are a concise greeting-card copywriter.
Write in ${language}, upbeat and human, without clichés.
Output JSON with keys: headline, line.

Constraints:
- total length under ${maxChars} characters
- include recipient's name exactly once in headline or line
- match tone specified by user
- match visual style cue (affects word choice subtly)
- avoid sensitive topics, no personal data beyond input
- be warm and celebratory for the occasion`;
}

export function createTextUserPrompt(input: TextGenInput): string {
  const styleMap = {
    cartoonish: "playful and whimsical",
    futuristic: "modern and optimistic", 
    old_days: "vintage and nostalgic"
  };
  
  const styleCue = styleMap[input.style] || "warm";
  
  return `Occasion: ${input.occasion}
Recipient: ${input.recipientName}
Tone: ${input.tone || "warm"}
Style cue: ${styleCue}
Extra context: ${input.extraContext || ""}

Generate a greeting card message with headline and line that fits this occasion and style.`;
}

export function getStyleToneBias(style: string): string {
  switch (style) {
    case "cartoonish":
      return "Use playful, lively verbs, light rhyme allowed";
    case "futuristic":
      return "Use optimistic, sleek, concise language with minimal adjectives";
    case "old_days":
      return "Use warm, nostalgic, gentle metaphors, no archaic spelling";
    default:
      return "Use warm, friendly language";
  }
}