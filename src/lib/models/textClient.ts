import { GoogleGenerativeAI } from "@google/generative-ai";
import { TextGenInput, TextGenResponse } from "@/types";
import { createTextSystemPrompt, createTextUserPrompt } from "@/lib/prompts/textPrompts";

export class GeminiTextClient {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
  }

  async generateText(input: TextGenInput): Promise<TextGenResponse> {
    try {
      const systemPrompt = createTextSystemPrompt(
        input.language || "en", 
        input.maxChars || 220
      );
      const userPrompt = createTextUserPrompt(input);

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      // Clean up response text (remove markdown markers, extra whitespace)
      let cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Try to parse JSON response
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(cleanText);
      } catch {
        // Try to extract JSON from within the response
        const jsonMatch = cleanText.match(/\{[^}]*"headline"[^}]*\}/);
        if (jsonMatch) {
          try {
            jsonResponse = JSON.parse(jsonMatch[0]);
          } catch {
            // Still failed, use fallback
            jsonResponse = null;
          }
        }
        
        if (!jsonResponse) {
          // Fallback: extract content manually if JSON parsing fails
          const lines = cleanText.split('\n').filter(line => line.trim() && !line.includes('{') && !line.includes('}'));
          jsonResponse = {
            headline: lines[0] || `Happy ${input.occasion}, ${input.recipientName}!`,
            line: lines[1] || `Wishing you joy and celebration on your special day.`
          };
        }
      }

      // Validate response structure
      if (!jsonResponse.headline || !jsonResponse.line) {
        throw new Error("Invalid response structure");
      }

      return {
        candidates: [{
          headline: jsonResponse.headline,
          line: jsonResponse.line
        }]
      };

    } catch (error) {
      console.error("Error generating text:", error);
      
      // Fallback response
      return {
        candidates: [{
          headline: `Happy ${input.occasion}, ${input.recipientName}!`,
          line: `Wishing you joy, happiness, and wonderful memories on your special day.`
        }]
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testInput: TextGenInput = {
        occasion: "test",
        recipientName: "Test",
        style: "cartoonish",
        tone: "warm"
      };
      
      await this.generateText(testInput);
      return true;
    } catch {
      return false;
    }
  }
}