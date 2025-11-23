import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [question, setQuestion] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      alert('Please enter your question');
      return;
    }

    setIsLoading(true);
    
    // TODO: Replace with your Laravel backend API endpoint
    // Example: 
    // try {
    //   const response = await fetch('http://localhost:3000/api/free-question', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ question })
    //   });
    //   const data = await response.json();
    // } catch (error) {
    //   console.error('Error:', error);
    // }
    
    // Simulating API call for now
    setTimeout(() => {
      setIsLoading(false);
      setShowResponse(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">✨</span>
              <span className="text-2xl font-bold text-white">Hamro Astro</span>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 text-white hover:text-purple-300 transition"
              >
                Login
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                Register
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Discover Your Cosmic Path
          </h1>
          <p className="text-xl text-purple-200 mb-4">
            Connect with experienced astrologers in real-time
          </p>
          <p className="text-lg text-purple-300">
            🎁 Ask your first question for FREE!
          </p>
        </div>

        {/* Free Question Section */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-purple-500/30 shadow-2xl">
            {!showResponse ? (
              <>
                <h2 className="text-3xl font-bold text-white mb-6 text-center">
                  Ask Your Free Question
                </h2>
                <form onSubmit={handleSubmitQuestion} className="space-y-6">
                  <div>
                    <label className="block text-purple-200 mb-2 text-sm font-medium">
                      What would you like to know about your future?
                    </label>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="e.g., What does my birth chart say about my career path?"
                      className="w-full px-4 py-3 bg-white bg-opacity-20 border border-purple-400/50 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-32"
                      rows="4"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold text-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Getting your answer...
                      </span>
                    ) : (
                      '✨ Get My Free Reading'
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl mb-4">🔮</div>
                  <h3 className="text-2xl font-bold text-white mb-4">Your Cosmic Reading</h3>
                </div>
                
                <div className="bg-purple-900 bg-opacity-40 rounded-lg p-6 border border-purple-400/30">
                  <p className="text-purple-100 mb-2 font-semibold">Your Question:</p>
                  <p className="text-white mb-4">{question}</p>
                  
                  <p className="text-purple-100 mb-2 font-semibold">Answer:</p>
                  <p className="text-white leading-relaxed">
                    Based on the cosmic energies surrounding your query, the stars indicate promising opportunities ahead. Your question reveals a deep curiosity about your path, and the universe is aligning to guide you forward. For a detailed personalized reading and real-time chat with our expert astrologers, please create an account.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-pink-500/20 to-purple-500/20 rounded-lg p-6 border border-purple-400/50">
                  <h4 className="text-xl font-bold text-white mb-3">
                    Want More Personalized Guidance?
                  </h4>
                  <p className="text-purple-200 mb-4">
                    Create an account to chat with professional astrologers in real-time and get unlimited readings!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => navigate('/register')}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
                    >
                      Create Free Account
                    </button>
                    <button
                      onClick={() => navigate('/login')}
                      className="flex-1 py-3 bg-white bg-opacity-20 text-white rounded-lg font-semibold hover:bg-opacity-30 transition border border-purple-400/50"
                    >
                      Already Have Account? Login
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="text-center p-6 bg-white bg-opacity-5 rounded-xl backdrop-blur-sm border border-purple-500/20">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2">Real-Time Chat</h3>
            <p className="text-purple-200">
              Connect instantly with professional astrologers
            </p>
          </div>
          <div className="text-center p-6 bg-white bg-opacity-5 rounded-xl backdrop-blur-sm border border-purple-500/20">
            <div className="text-4xl mb-4">⭐</div>
            <h3 className="text-xl font-bold text-white mb-2">Expert Guidance</h3>
            <p className="text-purple-200">
              Get insights from certified astrology experts
            </p>
          </div>
          <div className="text-center p-6 bg-white bg-opacity-5 rounded-xl backdrop-blur-sm border border-purple-500/20">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Private & Secure</h3>
            <p className="text-purple-200">
              Your conversations are completely confidential
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;