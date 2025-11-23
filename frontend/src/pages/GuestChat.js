// frontend/src/pages/GuestChat.jsx

import React, { useState, useEffect, useRef } from 'react';

const GuestChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isAstrologerOnline, setIsAstrologerOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch messages from backend
  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/messages/my-conversation', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      _id: Date.now() // Temporary ID
    };

    // Add message to UI immediately
    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3000/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: inputMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Update message with real ID from server
        setMessages(prev => 
          prev.map(msg => 
            msg._id === newMessage._id ? data.message : msg
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d1418]">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0d1418]">
      {/* Header */}
      <div className="bg-[#1c2731] border-b border-[#2a3942] px-5 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img 
              src="/hamroastro-logo.png" 
              alt="HamroAstro" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<span class="text-white text-xl font-bold">HA</span>';
              }}
            />
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <h3 className="text-white font-semibold text-lg">HamroAstro</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isAstrologerOnline ? 'bg-green-500' : 'bg-gray-500'}`}></span>
              <p className="text-sm text-gray-400">
                {isAstrologerOnline ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-[#0d1418] bg-opacity-50" 
           style={{
             backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255, 255, 255, 0.02) 10px, rgba(255, 255, 255, 0.02) 20px)`
           }}>
        
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="text-6xl mb-4">🔮</div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Welcome to HamroAstro!
            </h2>
            <p className="text-gray-400 text-base max-w-md">
              Ask your first question and get personalized astrological guidance from our expert astrologers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div 
                key={msg._id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                {/* Astrologer Message */}
                {msg.sender === 'astrologer' && (
                  <div className="flex gap-2 max-w-[75%] md:max-w-[65%]">
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex-shrink-0 overflow-hidden">
                      <img 
                        src="/hamroastro-logo.png" 
                        alt="HamroAstro" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span class="text-white text-xs font-bold flex items-center justify-center h-full">HA</span>';
                        }}
                      />
                    </div>
                    
                    {/* Message Content */}
                    <div className="flex flex-col">
                      <div className="bg-[#1c2731] text-gray-100 rounded-lg rounded-tl-none px-4 py-2.5 shadow-md">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 px-1">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                )}

                {/* User Message */}
                {msg.sender === 'user' && (
                  <div className="flex flex-col items-end max-w-[75%] md:max-w-[65%]">
                    <div className="bg-[#005c4b] text-white rounded-lg rounded-tr-none px-4 py-2.5 shadow-md">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.text}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 px-1">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[#1c2731] border-t border-[#2a3942] px-4 py-3">
        <div className="flex items-center gap-3">
          <input 
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 bg-[#2a3942] text-gray-100 rounded-full px-5 py-3 text-sm outline-none focus:bg-[#323d47] transition-colors placeholder-gray-500"
          />
          
          <button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg hover:shadow-purple-500/50"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M2 21L23 12L2 3V10L17 12L2 14V21Z" 
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestChat;