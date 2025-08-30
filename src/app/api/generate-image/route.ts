import { NextRequest, NextResponse } from "next/server";
import { ImageGenInput, ImageGenResponse } from "@/types";
import { createModelClient } from "@/lib/models";

const MAX_FILE_SIZE = Number(process.env.MAX_UPLOAD_MB || 10) * 1024 * 1024; // Convert MB to bytes

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    // Parse meta information
    const metaString = formData.get('meta') as string;
    if (!metaString) {
      return NextResponse.json(
        { error: 'Missing meta information' },
        { status: 400 }
      );
    }

    const meta = JSON.parse(metaString);
    const photo = formData.get('photo') as File | null;

    // Validate input
    const input: ImageGenInput = {
      style: meta.style || 'cartoonish',
      occasion: meta.occasion || '',
      preferredPalette: meta.preferredPalette || undefined,
      includeTextArea: meta.includeTextArea !== false, // Default true
      outputSize: meta.outputSize || { w: 1024, h: 768 },
      userPhoto: null
    };

    // Basic validation
    if (!input.occasion) {
      return NextResponse.json(
        { error: 'Missing required field: occasion' },
        { status: 400 }
      );
    }

    if (!['cartoonish', 'futuristic', 'old_days'].includes(input.style)) {
      return NextResponse.json(
        { error: 'Invalid style. Must be: cartoonish, futuristic, or old_days' },
        { status: 400 }
      );
    }

    // Handle user photo if provided
    if (photo) {
      // Check file size
      if (photo.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size too large. Maximum ${process.env.MAX_UPLOAD_MB || 10}MB allowed` },
          { status: 400 }
        );
      }

      // Check file type
      if (!photo.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Invalid file type. Please upload an image.' },
          { status: 400 }
        );
      }

      // Validate image types
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(photo.type)) {
        return NextResponse.json(
          { error: 'Unsupported image type. Please use JPEG, PNG, or WebP.' },
          { status: 400 }
        );
      }

      // Convert to buffer for processing
      const bytes = await photo.arrayBuffer();
      input.userPhoto = {
        bytes: Buffer.from(bytes),
        mime: photo.type
      };
    }

    // Content moderation - basic filter
    const inappropriateWords = ['nude', 'violence', 'hate', 'weapon'];
    const textToCheck = input.occasion.toLowerCase();
    
    if (inappropriateWords.some(word => textToCheck.includes(word))) {
      return NextResponse.json(
        { error: 'Content contains inappropriate language' },
        { status: 400 }
      );
    }

    // Generate image using model client
    const modelClient = createModelClient();
    const response: ImageGenResponse = await modelClient.generateImage(input);

    // Validate response
    if (!response.imagePngBase64) {
      throw new Error('No image generated');
    }

    // Validate base64 format
    if (!response.imagePngBase64.match(/^[A-Za-z0-9+/]*={0,2}$/)) {
      throw new Error('Invalid base64 image format');
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in generate-image API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate image',
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