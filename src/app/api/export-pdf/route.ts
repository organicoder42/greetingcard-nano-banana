import { NextRequest, NextResponse } from "next/server";
import { verifyUnlockToken } from "@/lib/auth/unlockToken";
import { buildPdfBuffer } from "@/lib/pdf/buildPdf";
import { PdfExportRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { unlockToken, card, size = 'A5' }: PdfExportRequest = body;

    // Validate required fields
    if (!unlockToken) {
      return NextResponse.json(
        { error: 'Missing unlock token' },
        { status: 401 }
      );
    }

    if (!card) {
      return NextResponse.json(
        { error: 'Missing card data' },
        { status: 400 }
      );
    }

    // Verify unlock token
    try {
      const tokenPayload = verifyUnlockToken(unlockToken);
      
      // Additional verification - ensure it's for the right product
      if (tokenPayload.product !== 'greetingsmith_unlock') {
        return NextResponse.json(
          { error: 'Invalid token product' },
          { status: 403 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Invalid or expired token',
          details: error instanceof Error ? error.message : 'Token verification failed'
        },
        { status: 401 }
      );
    }

    // Validate card data
    if (!card.headline || !card.line || !card.occasion || !card.recipientName) {
      return NextResponse.json(
        { error: 'Incomplete card data' },
        { status: 400 }
      );
    }

    // Validate size
    if (!['A4', 'A5'].includes(size)) {
      return NextResponse.json(
        { error: 'Invalid size. Must be A4 or A5' },
        { status: 400 }
      );
    }

    // Content moderation on final card content
    const inappropriateWords = ['hate', 'violence', 'death', 'kill', 'harm'];
    const contentToCheck = `${card.headline} ${card.line} ${card.occasion}`.toLowerCase();
    
    if (inappropriateWords.some(word => contentToCheck.includes(word))) {
      return NextResponse.json(
        { error: 'Card content contains inappropriate language' },
        { status: 400 }
      );
    }

    // Generate PDF
    const pdfBuffer = await buildPdfBuffer(card, size);

    // Create filename
    const safeOccasion = card.occasion.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const safeName = card.recipientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `greeting-${safeOccasion}-${safeName}-${timestamp}.pdf`;

    // Return PDF as downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Error in export-pdf API:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export PDF',
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