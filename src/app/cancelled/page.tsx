'use client';

import { Home, ArrowLeft, CreditCard } from 'lucide-react';

export default function CancelledPage() {
  const handleRetryPayment = () => {
    // Navigate back to the main app
    // In a real app, you might want to restore the previous state
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Icon */}
        <div className="h-16 w-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="h-8 w-8 text-yellow-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Cancelled</h1>
        
        {/* Description */}
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. Don&apos;t worry - your card design is still saved and you can complete your purchase anytime.
        </p>

        {/* What happened */}
        <div className="bg-yellow-50 p-4 rounded-md mb-6 text-left">
          <h3 className="font-medium text-yellow-900 mb-2">What happened?</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• You cancelled the payment process</li>
            <li>• No charges were made to your card</li>
            <li>• Your card design is still available</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <button
            onClick={handleRetryPayment}
            className="w-full bg-primary text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2 inline" />
            Complete My Purchase
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="block w-full bg-gray-100 text-gray-700 font-medium py-3 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
          >
            <Home className="h-4 w-4 mr-2 inline" />
            Start Over
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Secure payments powered by Stripe</p>
            <p>Questions? Contact support@greetingsmith.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}