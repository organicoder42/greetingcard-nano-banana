import { ModelClient } from "@/types";
import { GeminiTextClient } from "./textClient";
import { GeminiImageClient } from "./imageClient";
import { MockModelClient } from "./mockClient";

class CombinedModelClient implements ModelClient {
  constructor(
    private textClient: any,
    private imageClient: any
  ) {}

  async generateText(input: any) {
    return this.textClient.generateText(input);
  }

  async generateImage(input: any) {
    return this.imageClient.generateImage(input);
  }
}

export function createModelClient(): ModelClient {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  
  // Use real client if API key is provided, otherwise use mock
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('Using mock model client (no API key provided)');
    return new MockModelClient();
  }

  try {
    console.log('Using real Gemini model client with API key');
    const textClient = new GeminiTextClient(apiKey);
    const imageClient = new GeminiImageClient(apiKey);
    return new CombinedModelClient(textClient, imageClient);
  } catch (error) {
    console.warn('Failed to initialize Gemini clients, falling back to mock:', error);
    return new MockModelClient();
  }
}

export { MockModelClient } from "./mockClient";
export { GeminiTextClient } from "./textClient";
export { GeminiImageClient } from "./imageClient";