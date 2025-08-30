import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { signUnlockToken } from "@/lib/auth/unlockToken";
import { PaymentVerifyResponse } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: 'missing_session_id' },
        { status: 400 }
      );
    }

    // Validate session ID format (Stripe session IDs start with cs_)
    if (!sessionId.startsWith('cs_')) {
      return NextResponse.json(
        { ok: false, error: 'invalid_session_id_format' },
        { status: 400 }
      );
    }

    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { ok: false, error: 'payment_system_not_configured' },
        { status: 503 }
      );
    }

    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError) {
      console.error('Stripe error retrieving session:', stripeError);
      
      if (stripeError instanceof stripe.errors.StripeError) {
        if (stripeError.code === 'resource_missing') {
          return NextResponse.json(
            { ok: false, error: 'session_not_found' },
            { status: 404 }
          );
        }
      }
      
      return NextResponse.json(
        { ok: false, error: 'stripe_error' },
        { status: 500 }
      );
    }

    // Check payment status
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { ok: false, error: 'not_paid' },
        { status: 402 }
      );
    }

    // Verify this is our product
    if (session.metadata?.product !== 'greetingsmith_unlock') {
      return NextResponse.json(
        { ok: false, error: 'invalid_product' },
        { status: 400 }
      );
    }

    // Check if session is too old (security measure)
    const sessionCreated = new Date(session.created * 1000);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - sessionCreated.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 24) {
      return NextResponse.json(
        { ok: false, error: 'session_expired' },
        { status: 410 }
      );
    }

    // Generate unlock token
    const unlockToken = signUnlockToken({
      sid: session.id,
      product: 'greetingsmith_unlock',
    });

    const response: PaymentVerifyResponse = {
      ok: true,
      unlockToken,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error verifying payment:', error);
    
    return NextResponse.json(
      { 
        ok: false,
        error: 'verification_failed',
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}