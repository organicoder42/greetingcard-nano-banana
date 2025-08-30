import { TextGenInput, TextGenResponse, ImageGenInput, ImageGenResponse, ModelClient } from "@/types";

export class MockModelClient implements ModelClient {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async generateText(input: TextGenInput): Promise<TextGenResponse> {
    // Simulate API delay
    await this.delay(1000 + Math.random() * 2000);

    const mockResponses = {
      birthday: {
        headline: `Happy Birthday, ${input.recipientName}!`,
        line: "May your day be filled with happiness and your year with joy!"
      },
      graduation: {
        headline: `Congratulations, ${input.recipientName}!`,
        line: "Your hard work has paid off. Here's to your bright future ahead!"
      },
      anniversary: {
        headline: `Happy Anniversary, ${input.recipientName}!`,
        line: "Celebrating another year of love, laughter, and beautiful memories."
      },
      wedding: {
        headline: `Congratulations, ${input.recipientName}!`,
        line: "Wishing you a lifetime of love, happiness, and wonderful adventures together."
      },
      "get well": {
        headline: `Get Well Soon, ${input.recipientName}!`,
        line: "Sending you healing thoughts and warm wishes for a speedy recovery."
      }
    };

    const occasionKey = input.occasion.toLowerCase() as keyof typeof mockResponses;
    const response = mockResponses[occasionKey] || {
      headline: `Happy ${input.occasion}, ${input.recipientName}!`,
      line: "Wishing you joy and celebration on this special occasion."
    };

    // Apply style variations
    if (input.style === "cartoonish") {
      response.line = response.line.replace("joy", "lots of fun and giggles");
    } else if (input.style === "futuristic") {
      response.line = response.line.replace("joy", "stellar moments");
    } else if (input.style === "old_days") {
      response.line = response.line.replace("joy", "cherished moments");
    }

    return {
      candidates: [response]
    };
  }

  async generateImage(input: ImageGenInput): Promise<ImageGenResponse> {
    // Simulate API delay
    await this.delay(2000 + Math.random() * 3000);

    // Generate a mock base64 image based on style and occasion
    const mockImage = this.createMockImage(input);

    return {
      imagePngBase64: mockImage,
      mode: input.userPhoto ? "compose_fallback" : "t2i"
    };
  }

  private createMockImage(input: ImageGenInput): string {
    const width = input.outputSize?.w || 1024;
    const height = input.outputSize?.h || 768;

    // Style-based color schemes
    const colorSchemes = {
      cartoonish: {
        primary: '#FFB6C1',
        secondary: '#98FB98',
        accent: '#87CEEB'
      },
      futuristic: {
        primary: '#4A90E2', 
        secondary: '#50C878',
        accent: '#9B59B6'
      },
      old_days: {
        primary: '#D2B48C',
        secondary: '#F4A460', 
        accent: '#CD853F'
      }
    };

    const colors = colorSchemes[input.style] || colorSchemes.cartoonish;

    // Create SVG mock image
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${colors.secondary};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${colors.accent};stop-opacity:1" />
          </linearGradient>
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="3" fill="rgba(255,255,255,0.3)"/>
          </pattern>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bg)"/>
        
        <!-- Pattern overlay -->
        <rect width="100%" height="100%" fill="url(#dots)" opacity="0.4"/>
        
        <!-- Occasion-specific decorations -->
        ${this.getOccasionDecorations(input.occasion, width, height, input.style)}
        
        <!-- Text area if requested -->
        ${input.includeTextArea ? `
        <rect x="${width * 0.1}" y="${height * 0.6}" width="${width * 0.8}" height="${height * 0.3}" 
              fill="rgba(255,255,255,0.85)" rx="10" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
        ` : ''}
        
        <!-- Watermark for development -->
        <text x="${width/2}" y="${height-20}" text-anchor="middle" font-family="Arial" font-size="12" fill="rgba(0,0,0,0.3)">
          Mock ${input.style} ${input.occasion} Card
        </text>
      </svg>
    `;

    const base64 = Buffer.from(svgContent).toString('base64');
    return base64;
  }

  private getOccasionDecorations(occasion: string, width: number, height: number, style: string): string {
    const decorations: { [key: string]: string } = {
      birthday: `
        <circle cx="${width * 0.2}" cy="${height * 0.2}" r="15" fill="#FF6B6B" opacity="0.8"/>
        <circle cx="${width * 0.8}" cy="${height * 0.3}" r="12" fill="#4ECDC4" opacity="0.8"/>
        <circle cx="${width * 0.3}" cy="${height * 0.4}" r="10" fill="#45B7D1" opacity="0.8"/>
        <circle cx="${width * 0.7}" cy="${height * 0.1}" r="18" fill="#96CEB4" opacity="0.8"/>
      `,
      graduation: `
        <polygon points="${width * 0.2},${height * 0.2} ${width * 0.3},${height * 0.15} ${width * 0.25},${height * 0.35}" 
                 fill="#FFD700" opacity="0.7"/>
        <polygon points="${width * 0.7},${height * 0.3} ${width * 0.8},${height * 0.25} ${width * 0.75},${height * 0.45}" 
                 fill="#FFD700" opacity="0.7"/>
      `,
      anniversary: `
        <path d="M ${width * 0.2} ${height * 0.25} Q ${width * 0.15} ${height * 0.15} ${width * 0.25} ${height * 0.2} 
                 Q ${width * 0.35} ${height * 0.15} ${width * 0.3} ${height * 0.25} Q ${width * 0.25} ${height * 0.35} ${width * 0.2} ${height * 0.25}" 
              fill="#FF69B4" opacity="0.7"/>
        <path d="M ${width * 0.7} ${height * 0.15} Q ${width * 0.65} ${height * 0.05} ${width * 0.75} ${height * 0.1} 
                 Q ${width * 0.85} ${height * 0.05} ${width * 0.8} ${height * 0.15} Q ${width * 0.75} ${height * 0.25} ${width * 0.7} ${height * 0.15}" 
              fill="#FF69B4" opacity="0.7"/>
      `,
      wedding: `
        <circle cx="${width * 0.25}" cy="${height * 0.2}" r="8" fill="#FFE4E1" opacity="0.9"/>
        <circle cx="${width * 0.3}" cy="${height * 0.25}" r="10" fill="#FFF0F5" opacity="0.9"/>
        <circle cx="${width * 0.2}" cy="${height * 0.25}" r="6" fill="#FFE4E1" opacity="0.9"/>
        <circle cx="${width * 0.75}" cy="${height * 0.15}" r="8" fill="#FFE4E1" opacity="0.9"/>
        <circle cx="${width * 0.8}" cy="${height * 0.2}" r="10" fill="#FFF0F5" opacity="0.9"/>
      `,
      default: `
        <circle cx="${width * 0.3}" cy="${height * 0.2}" r="10" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
        <circle cx="${width * 0.7}" cy="${height * 0.3}" r="8" fill="rgba(255,255,255,0.6)" opacity="0.8"/>
      `
    };

    return decorations[occasion.toLowerCase()] || decorations.default;
  }

  async healthCheck(): Promise<boolean> {
    await this.delay(100);
    return true;
  }
}