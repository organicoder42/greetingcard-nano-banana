'use client';

import { useState } from 'react';
import { CardData, SizeType } from '@/types';
import { cn } from '@/lib/utils';
import { CreditCard, Download, Loader2 } from 'lucide-react';

interface PayButtonProps {
  cardData: CardData;
  size: SizeType;
  disabled?: boolean;
  className?: string;
}

export default function PayButton({ 
  cardData, 
  size, 
  disabled = false, 
  className 
}: PayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    if (disabled || loading) return;

    setLoading(true);
    setError(null);

    try {
      // Create checkout session
      const checkoutResponse = await fetch('/api/pay/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variant: 'single_card'
        }),
      });

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || 'Payment setup failed');
      }

      const { checkoutUrl } = await checkoutResponse.json();
      
      // Store card data in session storage for after payment
      sessionStorage.setItem('pendingCardData', JSON.stringify({ cardData, size }));
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;

    } catch (error) {
      console.error('Payment error:', error);
      setError(error instanceof Error ? error.message : 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
      
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={cn(
          'w-full flex items-center justify-center space-x-3 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
          className
        )}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Setting up payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Unlock & Download PDF</span>
            <span className="bg-white/20 px-2 py-1 rounded text-sm">
              DKK 25
            </span>
          </>
        )}
      </button>
      
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Download className="h-4 w-4" />
          <span>High-resolution PDF • Print-ready • No watermark</span>
        </div>
        
        <div className="text-xs text-gray-500">
          Size: {size} • Secure payment via Stripe • Instant download
        </div>
        
        <div className="text-xs text-gray-400">
          Prices include VAT where applicable
        </div>
      </div>
    </div>
  );
}