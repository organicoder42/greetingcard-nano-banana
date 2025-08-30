import { ImageGenInput } from "@/types";

export function createBackgroundImagePrompt(input: ImageGenInput): string {
  const styleDescriptions = {
    cartoonish: "soft outlines, pastel palette, playful shapes",
    futuristic: "clean gradients, holographic hints, geometric motifs, subtle glow",
    old_days: "paper texture, sepia/duotone palette, classic ornaments, film grain lite"
  };

  const occasionMotifs = {
    birthday: "balloons, confetti, cake elements",
    graduation: "laurel wreaths, stars, academic elements",
    anniversary: "hearts, flowers, romantic elements",
    wedding: "flowers, elegant patterns, celebration elements",
    "get well": "healing colors, gentle patterns, uplifting elements",
    default: "celebratory motifs appropriate for the occasion"
  };

  const style = styleDescriptions[input.style] || styleDescriptions.cartoonish;
  const occasion = input.occasion.toLowerCase();
  const motifs = occasionMotifs[occasion as keyof typeof occasionMotifs] || occasionMotifs.default;

  return `Create a single-page greeting card COVER background for ${input.occasion}.
Style: ${input.style} - ${style}.

Design requirements:
- Clear focal area reserved for text overlay (avoid busy patterns in text area)
- Subtle motifs for occasion: ${motifs}
- Cohesive palette, printable values, avoid neon clipping
- Clean edges at safe margins for PDF trim (3mm bleed if possible)
- ${input.includeTextArea ? 'Reserve clear space in center-lower area for text overlay' : 'Full coverage design'}
- High resolution suitable for print (300 DPI equivalent)

Output: Clean, professional greeting card background with no text or watermarks.`;
}

export function createImageStylePrompt(input: ImageGenInput): string {
  const basePrompt = createBackgroundImagePrompt(input);
  
  if (input.userPhoto) {
    return `${basePrompt}

Additionally, if possible, stylize the provided portrait photo to match the ${input.style} style:
- Preserve facial likeness and skin tones
- Apply ${input.style}-consistent effects
- Integrate naturally with the background design
- Gentle background separation (soft vignette or halo)`;
  }

  return basePrompt;
}

export function createComposePrompt(style: string, occasion: string): string {
  return `Create a stylish frame and border elements for a ${style} greeting card for ${occasion}.
The frame should complement a user photo and match the ${style} aesthetic.
Include decorative elements but leave the center clear for photo placement.
High resolution, print-ready quality.`;
}