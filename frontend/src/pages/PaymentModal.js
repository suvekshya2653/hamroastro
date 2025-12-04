import React, { useState } from 'react';
import { IoClose } from 'react-icons/io5';

export default function PaymentModal({ isOpen, onClose, onPaymentSubmit, amount = 20 }) {
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!transactionId.trim()) {
      setError('कृपया Transaction ID हाल्नुहोस्');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onPaymentSubmit(transactionId.trim());
      setTransactionId('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Payment verification failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1e2a35] rounded-xl max-w-xs w-full p-4 relative shadow-2xl border border-[#2a3942]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - Now with icon and background */}
        <button 
          onClick={onClose}
          className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 shadow-lg transition-all z-10"
          aria-label="Close"
        >
          <IoClose size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-3">
          <h2 className="text-lg font-bold text-white mb-0.5">💳 Payment</h2>
          <p className="text-gray-400 text-[10px]">भुक्तानी गर्नुहोस्</p>
        </div>

        {/* Amount */}
        <div className="bg-[#0b141a] rounded-lg p-2 mb-3 text-center">
          <p className="text-gray-400 text-[10px]">भुक्तानी रकम:</p>
          <p className="text-xl font-bold text-[#00a884]">NPR {amount}.00</p>
        </div>

        {/* QR Code Section */}
        <div className="bg-[#0b141a] rounded-lg p-3 mb-3">
          <h3 className="text-white text-center mb-2 font-medium text-xs">
            📱 Fonepay QR Code
          </h3>
          
          {/* QR Code - Smaller */}
          <div className="bg-white rounded-lg p-2 flex items-center justify-center mx-auto w-32">
            <div className="text-center w-full">
              <div className="w-28 h-28 bg-gray-200 flex items-center justify-center rounded-lg">
                <img 
                  src="/qr.jpg" 
                  alt="Fonepay QR"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="text-gray-500 text-[9px] text-center p-1">
                        <p class="font-bold mb-0.5">QR CODE</p>
                        <p>Place QR at</p>
                        <p>public/fonepay-qr.png</p>
                      </div>
                    `;
                  }}
                />
              </div>
              <p className="text-gray-600 text-[10px] font-medium mt-1">Hamro Astro</p>
            </div>
          </div>
        </div>

        {/* Instructions - Compact */}
        <div className="bg-[#0b141a] rounded-lg p-2 mb-3">
          <h4 className="text-white font-medium mb-1.5 text-[10px]">कसरी भुक्तानी गर्ने:</h4>
          <ol className="text-gray-300 text-[10px] space-y-1">
            <li>1. Fonepay app खोल्नुहोस्</li>
            <li>2. QR स्क्यान गर्नुहोस्</li>
            <li>3. NPR {amount} भुक्तानी गर्नुहोस्</li>
            <li>4. Transaction ID राख्नुहोस्</li>
          </ol>
        </div>

        {/* Transaction ID Input - Compact */}
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label className="block text-gray-300 text-[10px] font-medium mb-1">
              Transaction ID:
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter Transaction ID"
              className="w-full bg-[#0b141a] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-[#2a3942]"
              disabled={loading}
            />
          </div>

          {/* Error Message - Compact */}
          {error && (
            <div className="mb-2 p-2 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
              <p className="text-red-400 text-[10px]">{error}</p>
            </div>
          )}

          {/* Submit Button - Compact */}
          <button
            type="submit"
            disabled={loading || !transactionId.trim()}
            className="w-full bg-[#00a884] hover:bg-[#06cf9c] text-white font-medium py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {loading ? 'Verifying...' : 'Verify & Send'}
          </button>
        </form>

        {/* Info Note - Smaller */}
        <p className="text-gray-400 text-[9px] text-center mt-2">
          भुक्तानी पछि message पठाइनेछ
        </p>
      </div>
    </div>
  );
}