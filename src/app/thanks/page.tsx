'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CardData, SizeType } from '@/types';
import { Check, Download, Home, AlertCircle } from 'lucide-react';

export default function ThanksPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [unlockToken, setUnlockToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [size, setSize] = useState<SizeType>('A5');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError('No session ID provided');
        setLoading(false);
        return;
      }

      try {
        // Verify payment
        const response = await fetch(`/api/pay/verify?session_id=${sessionId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Payment verification failed');
        }

        const { unlockToken: token } = await response.json();
        setUnlockToken(token);

        // Retrieve stored card data
        const storedData = sessionStorage.getItem('pendingCardData');
        if (storedData) {
          const { cardData, size } = JSON.parse(storedData);
          setCardData(cardData);
          setSize(size);
          sessionStorage.removeItem('pendingCardData');
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error instanceof Error ? error.message : 'Payment verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [sessionId]);

  const downloadPDF = async () => {
    if (!unlockToken || !cardData || downloading) return;

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          unlockToken,
          card: cardData,
          size,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Download failed');
      }

      // Create download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `greeting-${cardData.occasion}-${cardData.recipientName}-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Download error:', error);
      setError(error instanceof Error ? error.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Issue</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-4">
            <a
              href="/"
              className="block w-full button-primary"
            >
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </a>
            {sessionId && (
              <button
                onClick={() => window.location.reload()}
                className="block w-full button-secondary"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">Your greeting card is ready for download</p>
        </div>

        {/* Card Preview */}
        {cardData && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <img
                  src={`data:image/png;base64,${cardData.imagePngBase64}`}
                  alt="Your greeting card"
                  className="w-full max-w-xs mx-auto rounded-lg shadow-md"
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Card Details:</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Occasion:</span>
                    <span className="font-medium">{cardData.occasion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recipient:</span>
                    <span className="font-medium">{cardData.recipientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Style:</span>
                    <span className="font-medium capitalize">{cardData.style.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-medium">{size}</span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-md">
                  <h4 className="font-medium text-green-900 mb-1">What's included:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>✓ High-resolution PDF (300 DPI)</li>
                    <li>✓ Print-ready format</li>
                    <li>✓ No watermarks</li>
                    <li>✓ Professional quality</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Button */}
        <div className="text-center space-y-4">
          <button
            onClick={downloadPDF}
            disabled={downloading || !cardData}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-lg shadow-lg hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-3"
          >
            {downloading ? (
              <>
                <div className="h-5 w-5 loading-spinner"></div>
                <span>Preparing download...</span>
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                <span>Download Your PDF</span>
              </>
            )}
          </button>

          <div className="text-sm text-gray-600">
            Your download will start automatically. The file will be saved to your downloads folder.
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-6 border-t border-gray-200 text-center space-y-4">
          <a
            href="/"
            className="inline-flex items-center space-x-2 text-primary hover:text-primary/80"
          >
            <Home className="h-4 w-4" />
            <span>Create Another Card</span>
          </a>
          
          <div className="text-xs text-gray-500">
            <p>Need help? Contact us at support@greetingsmith.com</p>
            <p className="mt-1">Transaction ID: {sessionId?.slice(-8)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}