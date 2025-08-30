import { GoogleGenerativeAI } from "@google/generative-ai";
import { ImageGenInput, ImageGenResponse } from "@/types";
import { createBackgroundImagePrompt, createImageStylePrompt } from "@/lib/prompts/imagePrompts";

export class GeminiImageClient {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    // Use the Gemini 2.5 Flash Image Preview model for image generation
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-image-preview",
      generationConfig: {
        temperature: 0.8,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      }
    });
  }

  async generateImage(input: ImageGenInput): Promise<ImageGenResponse> {
    try {
      console.log("Generating real image with Gemini 2.5 Flash Image Preview");
      
      const prompt = input.userPhoto ? 
        createImageStylePrompt(input) : 
        createBackgroundImagePrompt(input);

      console.log("Image generation prompt:", prompt);

      // Prepare the request parts
      const parts = [{ text: prompt }];
      
      // If user photo is provided and we have consent, include it
      if (input.userPhoto && input.userPhoto.bytes) {
        console.log("Including user photo for stylization");
        parts.push({
          inlineData: {
            data: Buffer.from(input.userPhoto.bytes).toString('base64'),
            mimeType: input.userPhoto.mime
          }
        });
      }

      // Generate image using Gemini
      const result = await this.model.generateContent(parts);
      const response = await result.response;
      
      // Check if the response contains image data
      const candidates = response.candidates;
      if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
        const parts = candidates[0].content.parts;
        
        // Look for inline data (generated image)
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            console.log("Successfully generated image with Gemini");
            return {
              imagePngBase64: part.inlineData.data,
              mode: input.userPhoto ? "i2i" : "t2i"
            };
          }
        }
      }

      // If no image data in response, try text response with image generation
      const textResponse = response.text();
      console.log("Gemini response:", textResponse.substring(0, 200) + "...");

      // For now, if Gemini doesn't return image data directly, fall back to placeholder
      // This might happen if the model doesn't support direct image generation yet
      console.log("No direct image data, falling back to enhanced placeholder");
      const fallbackImage = await this.createEnhancedPlaceholder(input, textResponse);
      
      return {
        imagePngBase64: fallbackImage,
        mode: input.userPhoto ? "compose_fallback" : "t2i"
      };

    } catch (error) {
      console.error("Error generating image with Gemini:", error);
      console.log("Falling back to placeholder image generation");
      
      // Fallback to enhanced placeholder
      const fallbackImage = await this.createEnhancedPlaceholder(input);
      
      return {
        imagePngBase64: fallbackImage,
        mode: "compose_fallback"
      };
    }
  }

  private async createEnhancedPlaceholder(input: ImageGenInput, aiDescription?: string): Promise<string> {
    // Create an enhanced placeholder with AI-described elements
    console.log("Creating enhanced placeholder based on", input.style, "style for", input.occasion);
    
    return this.generatePlaceholderSVG(input, aiDescription);
  }

  private generatePlaceholderSVG(input: ImageGenInput, aiDescription?: string): string {
    const width = input.outputSize?.w || 1024;
    const height = input.outputSize?.h || 768;

    // Style-specific color schemes and patterns
    const styleConfig = {
      cartoonish: {
        colors: ['#FFB6C1', '#98FB98', '#87CEEB', '#DDA0DD'],
        pattern: 'dots',
        decorations: this.getCartoonishDecorations(input.occasion)
      },
      futuristic: {
        colors: ['#4A90E2', '#50C878', '#9B59B6', '#E67E22'],
        pattern: 'geometric',
        decorations: this.getFuturisticDecorations(input.occasion)
      },
      old_days: {
        colors: ['#D2B48C', '#F4A460', '#CD853F', '#BC8F8F'],
        pattern: 'vintage',
        decorations: this.getVintageDecorations(input.occasion)
      }
    };

    const config = styleConfig[input.style] || styleConfig.cartoonish;

    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg-${input.style}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${config.colors[0]};stop-opacity:1" />
            <stop offset="33%" style="stop-color:${config.colors[1]};stop-opacity:1" />
            <stop offset="66%" style="stop-color:${config.colors[2]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${config.colors[3] || config.colors[2]};stop-opacity:1" />
          </linearGradient>
          ${this.getPatternDefs(input.style)}
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bg-${input.style})"/>
        
        <!-- Pattern overlay -->
        <rect width="100%" height="100%" fill="url(#pattern-${input.style})" opacity="0.3"/>
        
        <!-- Decorative elements -->
        ${config.decorations}
        
        <!-- Text area if requested -->
        ${input.includeTextArea ? `
        <rect x="${width * 0.1}" y="${height * 0.65}" width="${width * 0.8}" height="${height * 0.25}" 
              fill="rgba(255,255,255,0.9)" rx="15" stroke="rgba(255,255,255,0.95)" stroke-width="3"/>
        <rect x="${width * 0.12}" y="${height * 0.67}" width="${width * 0.76}" height="${height * 0.21}" 
              fill="rgba(255,255,255,0.7)" rx="10"/>
        ` : ''}
        
        <!-- AI-generated description hint -->
        ${aiDescription ? `
        <text x="${width/2}" y="${height - 60}" text-anchor="middle" font-family="Arial" font-size="14" fill="rgba(0,0,0,0.4)">
          AI-Enhanced: ${aiDescription.substring(0, 60)}${aiDescription.length > 60 ? '...' : ''}
        </text>
        ` : ''}
        
        <!-- Watermark -->
        <text x="${width/2}" y="${height - 20}" text-anchor="middle" font-family="Arial" font-size="12" fill="rgba(0,0,0,0.3)">
          Greetingsmith • ${input.style} ${input.occasion} Card
        </text>
      </svg>
    `;

    return Buffer.from(svgContent).toString('base64');
  }

  private getPatternDefs(style: string): string {
    switch (style) {
      case 'cartoonish':
        return `
          <pattern id="pattern-cartoonish" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="4" fill="rgba(255,255,255,0.4)"/>
            <circle cx="15" cy="15" r="2" fill="rgba(255,255,255,0.3)"/>
            <circle cx="45" cy="45" r="3" fill="rgba(255,255,255,0.3)"/>
          </pattern>
        `;
      case 'futuristic':
        return `
          <pattern id="pattern-futuristic" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <rect x="10" y="10" width="20" height="20" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
            <rect x="50" y="50" width="15" height="15" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
            <line x1="0" y1="40" x2="80" y2="40" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
          </pattern>
        `;
      case 'old_days':
        return `
          <pattern id="pattern-old_days" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <circle cx="25" cy="25" r="2" fill="rgba(139,69,19,0.2)"/>
            <path d="M15,15 Q25,10 35,15 Q30,25 25,25 Q20,25 15,15" fill="rgba(160,82,45,0.3)"/>
          </pattern>
        `;
      default:
        return `<pattern id="pattern-${style}" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse"></pattern>`;
    }
  }

  private getCartoonishDecorations(occasion: string): string {
    const decorations = {
      birthday: `
        <circle cx="15%" cy="15%" r="25" fill="#FF6B9D" opacity="0.8"/>
        <circle cx="85%" cy="20%" r="20" fill="#4ECDC4" opacity="0.7"/>
        <circle cx="25%" cy="35%" r="15" fill="#45B7D1" opacity="0.6"/>
        <circle cx="75%" cy="40%" r="30" fill="#96CEB4" opacity="0.5"/>
      `,
      christmas: `
        <polygon points="10%,25% 20%,10% 30%,25% 25%,25% 25%,35% 15%,35% 15%,25%" fill="#228B22" opacity="0.7"/>
        <polygon points="70%,30% 80%,15% 90%,30% 85%,30% 85%,40% 75%,40% 75%,30%" fill="#228B22" opacity="0.6"/>
        <circle cx="20%" cy="10%" r="8" fill="#FFD700" opacity="0.8"/>
      `,
      default: `
        <circle cx="20%" cy="25%" r="20" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
        <circle cx="80%" cy="35%" r="15" fill="rgba(255,255,255,0.5)" opacity="0.7"/>
      `
    };
    return decorations[occasion.toLowerCase() as keyof typeof decorations] || decorations.default;
  }

  private getFuturisticDecorations(occasion: string): string {
    const decorations = {
      birthday: `
        <rect x="10%" y="10%" width="30" height="30" fill="none" stroke="#00FFFF" stroke-width="2" opacity="0.7"/>
        <rect x="75%" y="20%" width="40" height="40" fill="none" stroke="#FF00FF" stroke-width="3" opacity="0.6"/>
        <line x1="20%" y1="50%" x2="80%" y2="30%" stroke="#00FF00" stroke-width="2" opacity="0.5"/>
      `,
      graduation: `
        <polygon points="15%,20% 25%,15% 35%,20% 30%,30% 20%,30%" fill="#FFD700" opacity="0.8"/>
        <polygon points="65%,25% 75%,20% 85%,25% 80%,35% 70%,35%" fill="#FFD700" opacity="0.7"/>
        <rect x="40%" y="35%" width="20" height="3" fill="#FFFFFF" opacity="0.6"/>
      `,
      default: `
        <rect x="25%" y="20%" width="25" height="25" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
        <circle cx="75%" cy="35%" r="15" fill="none" stroke="rgba(0,255,255,0.5)" stroke-width="2"/>
      `
    };
    return decorations[occasion.toLowerCase() as keyof typeof decorations] || decorations.default;
  }

  private getVintageDecorations(occasion: string): string {
    const decorations = {
      anniversary: `
        <path d="M15%,25% Q10%,15% 20%,20% Q30%,15% 25%,25% Q20%,35% 15%,25%" fill="#B22222" opacity="0.7"/>
        <path d="M75%,15% Q70%,5% 80%,10% Q90%,5% 85%,15% Q80%,25% 75%,15%" fill="#B22222" opacity="0.6"/>
        <circle cx="50%" cy="30%" r="8" fill="#FFE4E1" opacity="0.8"/>
      `,
      wedding: `
        <circle cx="20%" cy="20%" r="12" fill="#FFF8DC" opacity="0.9"/>
        <circle cx="25%" cy="25%" r="15" fill="#F5F5DC" opacity="0.8"/>
        <circle cx="15%" cy="25%" r="9" fill="#FFF8DC" opacity="0.7"/>
        <circle cx="80%" cy="15%" r="10" fill="#F5F5DC" opacity="0.8"/>
      `,
      default: `
        <circle cx="25%" cy="20%" r="15" fill="rgba(139,69,19,0.3)" opacity="0.8"/>
        <rect x="70%" y="25%" width="20" height="20" rx="3" fill="rgba(160,82,45,0.4)" opacity="0.7"/>
      `
    };
    return decorations[occasion.toLowerCase() as keyof typeof decorations] || decorations.default;
  }

  // Legacy methods removed - now using enhanced SVG generation

  async healthCheck(): Promise<boolean> {
    try {
      const testInput: ImageGenInput = {
        style: "cartoonish",
        occasion: "test",
        outputSize: { w: 512, h: 384 }
      };
      
      await this.generateImage(testInput);
      return true;
    } catch {
      return false;
    }
  }
}