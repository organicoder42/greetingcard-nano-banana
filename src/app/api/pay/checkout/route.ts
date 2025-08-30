import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_CONFIG } from "@/lib/payments/stripe";
import { PaymentCheckoutRequest, PaymentCheckoutResponse } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variant = "single_card" }: PaymentCheckoutRequest = body;

    // Validate variant
    if (variant !== "single_card") {
      return NextResponse.json(
        { error: 'Invalid variant. Currently only "single_card" is supported.' },
        { status: 400 }
      );
    }

    // Check if Stripe is properly configured
    if (!process.env.STRIPE_SECRET_KEY || STRIPE_CONFIG.PRICE_ID_CARD === 'price_placeholder') {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: STRIPE_CONFIG.PRICE_ID_CARD,
          quantity: 1,
        },
      ],
      success_url: STRIPE_CONFIG.SUCCESS_URL,
      cancel_url: STRIPE_CONFIG.CANCEL_URL,
      allow_promotion_codes: true,
      automatic_tax: {
        enabled: true,
      },
      metadata: {
        product: 'greetingsmith_unlock',
        variant,
        timestamp: new Date().toISOString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    if (!session.url) {
      throw new Error('Failed to create checkout session URL');
    }

    const response: PaymentCheckoutResponse = {
      checkoutUrl: session.url,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error creating checkout session:', error);
    
    if (error instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        { 
          error: 'Payment system error',
          details: error.message 
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
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