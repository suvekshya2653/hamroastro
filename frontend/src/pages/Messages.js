import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import echo from "../echo";
import { FaSearch, FaPaperPlane, FaEllipsisV, FaArrowLeft, FaCheckDouble } from "react-icons/fa";

export default function Messages() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRashi, setSelectedRashi] = useState("");

  const rashiList = [
    "Mesh (मेष)", "Vrishabh (वृषभ)", "Mithun (मिथुन)", "Karka (कर्क)",
    "Simha (सिंह)", "Kanya (कन्या)", "Tula (तुला)", "Vrishchik (वृश्चिक)",
    "Dhanu (धनु)", "Makar (मकर)", "Kumbh (कुम्भ)", "Meen (मीन)"
  ];
  
  // Get current admin user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = localStorage.getItem("role");
    
    if (!user || role !== "admin") {
      navigate("/login");
      return;
    }
    
    setCurrentUser(user);
    console.log("👤 Admin logged in:", user);
  }, [navigate]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch all customers
  useEffect(() => {
    if (!currentUser) return;

    const fetchChatUsers = async () => {
      try {
        const res = await API.get("/chat-users");
        const users = res.data || [];
        
        console.log("📋 Loaded", users.length, "customers");
        
        const sortedUsers = users.sort((a, b) => {
          const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return dateB - dateA;
        });
        
        setChatUsers(sortedUsers);
      } catch (err) {
        console.error("❌ Error loading customers:", err);
        if (err.response?.status === 401) {
          localStorage.clear();
          navigate("/login");
        }
      }
    };

    fetchChatUsers();
  }, [currentUser, navigate]);

  // Real-time listener for incoming messages
  useEffect(() => {
    if (!currentUser) return;

    const channelName = `chat.${currentUser.id}`;
    console.log("🔌 Admin connecting to channel:", channelName);
    
    const channel = echo.private(channelName);

    channel.subscribed(() => {
      console.log("✅ Admin subscribed to real-time channel!");
    });

    channel.error((error) => {
      console.error("❌ Admin subscription error:", error);
    });

    const handleIncomingMessage = (data) => {
      console.log("📩 Admin received message:", data);

      // Check if message is for admin
      const isForMe = data.receiver_id === currentUser.id;
      
      if (!isForMe) {
        console.log("⚠️ Message not for admin");
        return;
      }

      // Add to chat if this customer is currently selected
      if (selectedUser && data.user_id === selectedUser.id) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === data.id);
          if (exists) {
            console.log("⚠️ Message already exists in chat");
            return prev;
          }
          
          console.log("✅ Adding customer message to chat view");
          return [...prev, data];
        });
      }

      // Update chat list with new message
      setChatUsers((prevUsers) => {
        const updated = prevUsers.map((user) => {
          if (user.id === data.user_id) {
            return {
              ...user,
              last_message: data,
              unread_count: selectedUser?.id === user.id ? 0 : (user.unread_count || 0) + 1,
            };
          }
          return user;
        });
        
        // Sort by latest message
        return updated.sort((a, b) => {
          const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return dateB - dateA;
        });
      });
    };

    channel.listen("MessageSent", handleIncomingMessage);

    return () => {
      console.log("🔌 Admin disconnecting from real-time");
      channel.stopListening("MessageSent", handleIncomingMessage);
      echo.leave(channelName);
    };
  }, [currentUser, selectedUser]);

  // Fetch messages for selected user
  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      console.log("📜 Fetching messages for user ID:", userId);
      const response = await API.get(`/messages?receiver_id=${userId}`);
      console.log("📜 Loaded", response.data.length, "messages");
      setMessages(response.data || []);
      
      // Mark messages as read
      setChatUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, unread_count: 0 } : user
        )
      );
    } catch (error) {
      console.error("❌ Error fetching messages:", error);
      alert("Failed to load messages. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  // Select a user to chat with
  const handleSelectUser = (user) => {
    console.log("👤 Selected customer:", user.name);
    setSelectedUser(user);
    setSelectedRashi("");
    fetchMessages(user.id);
  };

  // Send message to customer
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !currentUser) {
      console.log("⚠️ Cannot send: missing data");
      return;
    }

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    
    // Optimistic update - show message immediately
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      user_id: currentUser.id,
      receiver_id: selectedUser.id,
      created_at: new Date().toISOString(),
      sender_name: currentUser.name,
    };

    console.log("📤 Sending message:", messageText);
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const response = await API.post("/messages", {
        text: messageText,
        receiver_id: selectedUser.id,
      });

      const sentMessage = response.data;
      console.log("✅ Message sent successfully!");

      // Replace temporary message with real one from server
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );

      // Update chat list
      setChatUsers((prevUsers) => {
        const updated = prevUsers.map((user) => {
          if (user.id === selectedUser.id) {
            return { ...user, last_message: sentMessage };
          }
          return user;
        });
        
        return updated.sort((a, b) => {
          const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return dateB - dateA;
        });
      });
    } catch (error) {
      console.error("❌ Error sending message:", error);
      console.error("Error details:", error.response?.data);
      
      // Remove failed message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText);
      
      alert("Failed to send message. Please try again.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredUsers = chatUsers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    }
  };

  return (
    <div className="flex h-screen bg-[#111b21]">
      {/* LEFT SIDEBAR - Customer List */}
      <div className="w-full md:w-[400px] border-r border-[#2a3942] flex flex-col bg-[#111b21]">
        {/* Admin Header */}
        <div className="bg-[#202c33] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold">
                {currentUser.name?.[0]?.toUpperCase() || "A"}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-white text-lg">Admin Panel</h3>
              <p className="text-xs text-gray-400">Hamro Astro</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-500">Online</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#111b21]">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-lg bg-[#202c33] text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Customer List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No customers found</p>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#202c33] transition ${
                  selectedUser?.id === user.id ? "bg-[#2a3942]" : ""
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user.name[0].toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h4 className="font-medium text-white truncate">{user.name}</h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTime(user.last_message?.created_at)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400 truncate flex-1">
                      {user.last_message?.text || "No messages yet"}
                    </p>

                    {user.unread_count > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-2">
                        {user.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT SIDE - Chat Area */}
      <div className="flex-1 flex flex-col bg-[#0b141a]">
        {selectedUser ? (
          <>
            {/* Customer Details Header */}
            <div className="bg-[#202c33] border-b border-[#2a3942]">
              {/* Top Bar - Name and Avatar */}
              <div className="p-3 flex items-center gap-3 border-b border-[#2a3942]">
                <FaArrowLeft
                  className="text-white md:hidden cursor-pointer"
                  onClick={() => setSelectedUser(null)}
                />
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-gray-400">{selectedUser.email || "Customer"}</p>
                </div>
                <FaEllipsisV className="text-gray-400 cursor-pointer hover:text-white" />
              </div>

              {/* Rashi Selector Row */}
              <div className="px-4 py-2 border-b border-[#2a3942] flex items-center gap-2">
                <label className="text-gray-400 text-sm font-medium">Rashi:</label>
                <select
                  value={selectedRashi}
                  onChange={(e) => setSelectedRashi(e.target.value)}
                  className="bg-[#2a3942] text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-[#3d4a54]"
                >
                  <option value="">Select Rashi</option>
                  {rashiList.map((rashi, idx) => (
                    <option key={idx} value={rashi}>{rashi}</option>
                  ))}
                </select>
              </div>

              {/* Customer Information Section */}
              <div className="bg-[#1c2730] px-4 py-3">
                {/* Main Info Grid */}
                <div className="grid grid-cols-4 gap-4 mb-3 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1">लिङ्ग:</span>
                    <span className="text-gray-200">{selectedUser.gender || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">जन्म मिति:</span>
                    <span className="text-gray-200">{selectedUser.dob_nep || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">जन्म समय:</span>
                    <span className="text-gray-200">{selectedUser.birth_time || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">जन्म स्थान:</span>
                    <span className="text-gray-200">{selectedUser.birth_place || "N/A"}</span>
                  </div>
                </div>

                {/* Address Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block mb-1">स्थायी ठेगाना:</span>
                    <span className="text-gray-200">{selectedUser.perm_address || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-1">अस्थायी ठेगाना:</span>
                    <span className="text-gray-200">{selectedUser.temp_address || "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Display Area */}
            <div
              className="flex-1 overflow-y-auto p-4 space-y-2"
              style={{
                backgroundImage: "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
                backgroundSize: "cover",
              }}
            >
              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-gray-400">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isAdminMessage = msg.user_id === currentUser?.id;
                  
                  // Determine message background color based on payment status
                  let messageColor = "bg-[#202c33]"; // Default
                  
                  if (isAdminMessage) {
                    messageColor = "bg-[#005c4b]"; // Admin = Green
                  } else {
                    // Customer messages
                    if (msg.is_paid && msg.payment_status === 'paid') {
                      messageColor = "bg-[#1e3a5f]"; // Paid = Blue
                    } else if (msg.is_paid && msg.payment_status === 'pending') {
                      messageColor = "bg-[#4a3520]"; // Pending = Orange
                    } else {
                      messageColor = "bg-[#202c33]"; // Free = Gray
                    }
                  }
                  
                  return (
                    <div
                      key={msg.id || `msg-${index}`}
                      className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[65%] rounded-md px-3 py-2 shadow-sm ${messageColor} text-white relative`}
                        style={{
                          borderRadius: isAdminMessage ? "8px 8px 0px 8px" : "8px 8px 8px 0px"
                        }}
                      >
                        <p className="break-words text-[14.2px] leading-[19px]">{msg.text}</p>

                        {/* Payment Badge (for customer paid messages) */}
                        {!isAdminMessage && msg.is_paid && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className={`text-[10px] px-2 py-0.5 rounded ${
                              msg.payment_status === 'paid' ? 'bg-blue-600' : 'bg-orange-600'
                            }`}>
                              {msg.payment_status === 'paid' ? '💳 Paid' : '⏳ Pending'}
                            </span>
                          </div>
                        )}

                        {/* Time and Read Receipt */}
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[11px] text-gray-300 opacity-70">
                            {formatTime(msg.created_at)}
                          </span>
                          {isAdminMessage && (
                            <FaCheckDouble className="text-[11px] text-blue-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <div className="bg-[#202c33] p-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message to customer..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none placeholder-gray-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-full p-3 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane />
              </button>
            </div>
          </>
        ) : (
          /* No Customer Selected View */
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-7xl mb-4">💬</div>
            <h2 className="text-2xl font-light mb-2">Hamro Astro Admin</h2>
            <p className="text-center max-w-md">
              Select a customer to view and respond to their messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}