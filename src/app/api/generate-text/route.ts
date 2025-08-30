import { NextRequest, NextResponse } from "next/server";
import { TextGenInput, TextGenResponse } from "@/types";
import { createModelClient } from "@/lib/models";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate input
    const input: TextGenInput = {
      occasion: body.occasion || '',
      recipientName: body.recipientName || '',
      style: body.style || 'cartoonish',
      tone: body.tone || 'warm',
      extraContext: body.extraContext || '',
      language: body.language || 'en',
      maxChars: body.maxChars || 220
    };

    // Basic validation
    if (!input.occasion || !input.recipientName) {
      return NextResponse.json(
        { error: 'Missing required fields: occasion, recipientName' },
        { status: 400 }
      );
    }

    if (!['cartoonish', 'futuristic', 'old_days'].includes(input.style)) {
      return NextResponse.json(
        { error: 'Invalid style. Must be: cartoonish, futuristic, or old_days' },
        { status: 400 }
      );
    }

    // Content moderation - basic filter
    const inappropriateWords = ['hate', 'violence', 'death', 'kill', 'harm'];
    const textToCheck = `${input.occasion} ${input.recipientName} ${input.extraContext}`.toLowerCase();
    
    if (inappropriateWords.some(word => textToCheck.includes(word))) {
      return NextResponse.json(
        { error: 'Content contains inappropriate language' },
        { status: 400 }
      );
    }

    // Generate text using model client
    const modelClient = createModelClient();
    const response: TextGenResponse = await modelClient.generateText(input);

    // Validate response
    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('No text generated');
    }

    // Additional validation on generated content
    const candidate = response.candidates[0];
    if (!candidate.headline || !candidate.line) {
      throw new Error('Generated text missing headline or line');
    }

    // Check character limits
    const totalLength = candidate.headline.length + candidate.line.length;
    if (totalLength > (input.maxChars || 220)) {
      // Trim if too long
      const maxHeadlineLength = Math.floor((input.maxChars || 220) * 0.4);
      const maxLineLength = (input.maxChars || 220) - maxHeadlineLength;
      
      candidate.headline = candidate.headline.length > maxHeadlineLength 
        ? candidate.headline.substring(0, maxHeadlineLength - 3) + '...'
        : candidate.headline;
        
      candidate.line = candidate.line.length > maxLineLength 
        ? candidate.line.substring(0, maxLineLength - 3) + '...'
        : candidate.line;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in generate-text API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate text',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle CORS for development
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}