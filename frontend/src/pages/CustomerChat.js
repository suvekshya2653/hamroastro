import React, { useEffect, useState, useRef } from "react";
import API from "../api";
import echo from "../echo";
import PaymentModal from "./PaymentModal";
import { IoSend } from "react-icons/io5";
import { FaQuestionCircle, FaComments, FaBars, FaTimes } from "react-icons/fa";

const validateUserData = (storedUser, apiUser) => {
  if (!storedUser || !apiUser) return false;
  if (apiUser.role === 'admin') return false;
  if (storedUser.id !== apiUser.id) return false;
  if (storedUser.email !== apiUser.email) return false;
  return true;
};

export default function CustomerChat() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [paymentRequired, setPaymentRequired] = useState(false);
  const [messageType, setMessageType] = useState("normal"); 
  const [wordCount, setWordCount] = useState(0);
  const [wordLimitError, setWordLimitError] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadUserAndMessages = async () => {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      if (!storedUser) {
        window.location.href = "/login";
        return;
      }

      if (storedUser.role === 'admin') {
        localStorage.removeItem("user");
        alert("Admin users cannot access customer chat.");
        window.location.href = "/login";
        return;
      } 

      setUser(storedUser);

      try {
        const userResponse = await API.get('/user');
        if (validateUserData(storedUser, userResponse.data)) {
          const updatedUser = {
            ...storedUser,
            ...userResponse.data,
            id: storedUser.id,
            email: storedUser.email,
            role: storedUser.role || 'customer',
          };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        await loadMessages(storedUser.id);
      } catch (err) {
        await loadMessages(storedUser.id);
      }
    };

    loadUserAndMessages();
  }, []);

  const loadMessages = async (userId) => {
    try {
      const res = await API.get(`/messages`, {
        params: { user_id: userId }
      });

      const formatted = res.data.map((msg) => {
        const isSentByMe = msg.user_id === userId;
        
        console.log(`MSG: "${msg.text.substring(0, 20)}" | receiver_id=${msg.receiver_id} | isSentByMe=${isSentByMe}`);
        
        return {
          id: msg.id,
          text: msg.text,
          sender: isSentByMe ? "customer" : "admin",
          message_type: msg.message_type || "normal",
          user_id: msg.user_id,
          receiver_id: msg.receiver_id,
          created_at: msg.created_at,
          time: new Date(msg.created_at).toLocaleTimeString(),
        };
      });
      
      setMessages(formatted);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    const channelName = `chat.${user.id}`;
    console.log("🔌 Customer connecting to channel:", channelName);
    
    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log("✅ Customer subscribed successfully!");
    });

    channel.error((error) => {
      console.error("❌ Customer subscription error:", error);
    });

    const handleIncomingMessage = (data) => {
      console.log("📩 Customer received message:", data);
      console.log("📩 From user_id:", data.user_id, "| To receiver_id:", data.receiver_id);
      
      const isForMe = data.receiver_id === user.id;

      if (!isForMe) {
        console.log("⚠️ Message not for me, ignoring");
        return;
      }

      console.log("✅ Message is for me from admin");

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) {
          console.log("⚠️ Message already exists");
          return prev;
        }

        console.log("✅ Adding admin message to chat");
        return [
          ...prev,
          {
            id: data.id,
            text: data.text,
            sender: "admin",
            message_type: data.message_type || "normal",
            user_id: data.user_id,
            receiver_id: data.receiver_id,
            created_at: data.created_at,
            time: new Date(data.created_at).toLocaleTimeString(),
          },
        ];
      });
    };

    channel.listen("MessageSent", handleIncomingMessage);

    return () => {
      console.log("🔌 Customer disconnecting");
      channel.stopListening("MessageSent", handleIncomingMessage);
      echo.leave(channelName);
    };
  }, [user]);

  const sendMessage = async () => {
    if (!message.trim() || !user) return;

    if (messageType === "question") {
      const words = message.trim().split(/\s+/).filter(word => word.length > 0);
      if (words.length > 150) {
        alert("Your question exceeds the 150 word limit.");
        return;
      }
    }

    const text = message.trim();

    try {
      if (messageType === "question") {
        setPendingMessage(text);
        setShowPaymentModal(true);
        return;
      }
      await sendMessageWithPayment(text, null);
    } catch (err) {
      alert("Failed to send message.");
    }
  };

  const sendMessageWithPayment = async (text, transactionId = null) => {
    const tempId = `tmp-${Date.now()}`;
    const currentMessageType = messageType;

    let adminId = 1;
    try {
      const adminRes = await API.get('/admin-info');
      adminId = adminRes.data.admin_id;
      console.log("✅ Got admin ID:", adminId);
    } catch (err) {
      console.error("⚠️ Failed to get admin ID, using fallback:", err);
    }

    const optimistic = {
      id: tempId,
      text,
      sender: "customer",
      message_type: currentMessageType,
      user_id: user.id,
      receiver_id: adminId,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessage("");
    setMessageType("normal");
    setWordCount(0);
    setWordLimitError("");

    try {
      const payload = {
        text,
        receiver_id: adminId,
        message_type: currentMessageType,
      };

      if (transactionId) {
        payload.transaction_id = transactionId;
      }

      const res = await API.post("/messages", payload);
      const real = res.data;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: real.id,
                text: real.text,
                sender: "customer",
                message_type: real.message_type || currentMessageType,
                user_id: real.user_id,
                receiver_id: real.receiver_id,
                created_at: real.created_at,
                time: new Date(real.created_at).toLocaleTimeString(),
              }
            : m
        )
      );

      if (transactionId) {
        setPaymentRequired(false);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(text);
      setMessageType(currentMessageType);
      
      if (err.response?.status === 402 || err.response?.data?.requires_payment) {
        setPendingMessage(text);
        setShowPaymentModal(true);
      } else {
        alert("Failed to send message");
      }
    }
  };

  const handlePaymentSubmit = async (transactionId) => {
    try {
      await sendMessageWithPayment(pendingMessage, transactionId);
      setShowPaymentModal(false);
      setPendingMessage("");
    } catch (err) {
      throw err;
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) {
    return (
      <div className="p-8 text-center text-white">
        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-sm sm:text-base">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0C141D] flex text-white relative">
      {/* Mobile Sidebar Toggle Button */}
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-[#00a884] p-2.5 rounded-lg shadow-lg"
      >
        {showSidebar ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Sidebar Overlay for Mobile */}
      {showSidebar && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* LEFT SIDEBAR - User Info */}
      <div
        className={`
          fixed lg:relative inset-y-0 left-0 z-40
          w-72 sm:w-80 
          bg-[#111B28] border-r border-gray-800 
          p-4 sm:p-6 overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6 lg:block">
          <h2 className="text-xl sm:text-2xl font-bold">Hamro Astro</h2>
          <button
            onClick={() => setShowSidebar(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <FaTimes size={20} />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm">Full Name</h3>
            <p className="text-base sm:text-lg font-semibold truncate">{user.name || "Not provided"}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm">Email</h3>
            <p className="text-sm sm:text-base truncate">{user.email || "Not provided"}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm">Gender</h3>
            <p className="text-sm sm:text-base">{user.gender || "Not provided"}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm">Birth Date</h3>
            <p className="text-sm sm:text-base">{user.dob_nep || "Not provided"}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm">Birth Time</h3>
            <p className="text-sm sm:text-base">{user.birth_time || "Not provided"}</p>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm">Birth Place</h3>
            <p className="text-sm sm:text-base break-words">
              {[user.perm_street, user.perm_city, user.perm_country]
                .filter(Boolean)
                .join(', ') || "Not provided"}
            </p>
          </div>
          <div>
            <h3 className="text-gray-400 text-xs sm:text-sm">Current Address</h3>
            <p className="text-sm sm:text-base break-words">
              {[user.temp_street, user.temp_city, user.temp_country]
                .filter(Boolean)
                .join(', ') || "Not provided"}
            </p>
          </div>
          <div className="mt-4 sm:mt-6 p-2.5 sm:p-3 bg-gray-800 rounded text-xs">
            <p className="text-gray-400 mb-1">Debug:</p>
            <p className="text-green-400">User ID: {user.id}</p>
            <p className="text-green-400">Messages: {messages.length}</p>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE - Chat Area */}
      <div className="flex-1 flex flex-col w-full lg:w-auto">
        {/* Chat Header */}
        <div className="p-3 sm:p-5 border-b border-gray-800 bg-[#111B28] flex-shrink-0">
          <div className="flex items-center gap-3 lg:block">
            <div className="w-10 h-10 lg:hidden"></div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold truncate">Chat with Hamro Astro</h2>
              <p className="text-gray-400 text-xs sm:text-sm truncate">• {user.email}</p>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div
          className="p-3 sm:p-6 space-y-2 sm:space-y-3 overflow-y-auto flex-1"
          style={{
            backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundSize: "cover",
          }}
        >
          {messages.length === 0 ? (
            <div className="flex justify-center items-center h-full px-4">
              <p className="text-gray-400 text-sm sm:text-base text-center">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((m) => {
              const isCustomerMessage = m.sender === "customer";
              
              let messageColor;
              if (isCustomerMessage) {
                messageColor = m.message_type === "question" ? "bg-[#1e3a5f]" : "bg-[#005c4b]";
              } else {
                messageColor = m.message_type === "answer" ? "bg-[#7c3aed]" : "bg-[#202c33]";
              }
              
              return (
                <div
                  key={m.id}
                  className={`flex ${isCustomerMessage ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-lg px-3 sm:px-4 py-2 shadow-md ${messageColor}`}>
                    {isCustomerMessage && m.message_type === "question" && (
                      <div className="text-[10px] sm:text-xs text-yellow-300 mb-1 font-semibold">💰 Question (Paid)</div>
                    )}
                    {!isCustomerMessage && m.message_type === "answer" && (
                      <div className="text-[10px] sm:text-xs text-purple-300 mb-1 font-semibold">⭐ Original Answer</div>
                    )}
                    <p className="break-words text-[13px] sm:text-[14.2px] leading-[18px] sm:leading-[19px] text-white">{m.text}</p>
                    <div className="text-[10px] sm:text-xs text-gray-300 mt-1 opacity-70">{m.time}</div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-[#202c33] border-t border-gray-800 flex-shrink-0">
          {/* Message Type Buttons */}
          <div className="px-3 sm:px-4 pt-2 sm:pt-3 flex gap-1.5 sm:gap-2">
            <button
              onClick={() => {
                setMessageType("normal");
                setWordCount(0);
                setWordLimitError("");
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm ${
                messageType === "normal" ? "bg-[#00a884] text-white" : "bg-[#2a3942] text-gray-400"
              }`}
            >
              <FaComments size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="font-medium hidden sm:inline">Normal Chat</span>
              <span className="font-medium sm:hidden">Normal</span>
            </button>
            <button
              onClick={() => {
                setMessageType("question");
                if (message.trim()) {
                  const words = message.trim().split(/\s+/).filter(word => word.length > 0);
                  setWordCount(words.length);
                  if (words.length > 150) {
                    setWordLimitError("Question exceeds 150 word limit!");
                  }
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm ${
                messageType === "question" ? "bg-[#1e3a5f] text-white" : "bg-[#2a3942] text-gray-400"
              }`}
            >
              <FaQuestionCircle size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="font-medium hidden sm:inline">Ask Question (Rs. 20)</span>
              <span className="font-medium sm:hidden">Question</span>
            </button>
          </div>

          {/* Word Count */}
          {messageType === "question" && (
            <div className="px-3 sm:px-4 pt-1.5 sm:pt-2">
              <div className={`text-xs ${wordCount > 150 ? 'text-red-400' : 'text-gray-400'}`}>
                Word count: {wordCount}/150
                {wordLimitError && <span className="ml-2 text-red-400 font-semibold">⚠️ {wordLimitError}</span>}
              </div>
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <input
              type="text"
              className="flex-1 p-2.5 sm:p-3 rounded-lg bg-[#2a3942] text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              placeholder={messageType === "question" ? "Ask your question..." : "Type your message..."}
              value={message}
              onChange={(e) => {
                const text = e.target.value;
                setMessage(text);
                if (messageType === "question") {
                  const words = text.trim().split(/\s+/).filter(word => word.length > 0);
                  const count = text.trim() === "" ? 0 : words.length;
                  setWordCount(count);
                  setWordLimitError(count > 150 ? "Question exceeds 150 word limit!" : "");
                }
              }}
              onKeyDown={handleKey}
            />
            <button
              onClick={sendMessage}
              disabled={!message.trim() || (messageType === "question" && wordCount > 150)}
              className="bg-[#00a884] hover:bg-[#06cf9c] text-white p-2.5 sm:p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <IoSend size={18} className="sm:w-[22px] sm:h-[22px]" />
            </button>
          </div>
        </div>

        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setMessage(pendingMessage);
          }}
          onPaymentSubmit={handlePaymentSubmit}
          amount={20}
        />
      </div>
    </div>
  );
}