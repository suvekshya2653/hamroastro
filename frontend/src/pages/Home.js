import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-900">
      {/* Navigation */}
      <nav className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Hamro Astro" className="w-12 h-12" />
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
        </div>

        {/* Let's Chat Button */}
        <div className="flex justify-center mt-10">
          <button
            onClick={() => navigate('/login')}
            className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl text-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition shadow-lg"
          >
            💬 Let’s Chat
          </button>
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
