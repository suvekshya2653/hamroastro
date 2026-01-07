import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import echo from "../echo";
import { FaSearch, FaPaperPlane, FaEllipsisV, FaArrowLeft, FaCheckDouble } from "react-icons/fa";


export default function Messages() {
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messageType, setMessageType] = useState("normal");
  const [chatUsers, setChatUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRashi, setSelectedRashi] = useState("");
  const selectedUserRef = useRef(null);

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
    console.log("🔍 Admin ID:", user.id);
    console.log("🔍 Admin Role:", user.role);
  }, [navigate]);


useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("token");
    
    console.log("=== ADMIN AUTH DEBUG ===");
    console.log("👤 User object:", user);
    console.log("🔑 Has role field?", user?.role);
    console.log("📋 Role from localStorage:", role);
    console.log("🎫 Token exists?", !!token);
    console.log("🎫 Token (first 20 chars):", token?.substring(0, 20));
    console.log("========================");
    
    if (!user || role !== "admin") {
      navigate("/login");
      return;
    }
    
    setCurrentUser(user);
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







// ✅ Admin Real-time Listener
useEffect(() => {
  // Wait for currentUser to be loaded
  if (!currentUser?.id) {
    console.log("⏳ Waiting for currentUser to load...");
    return;
  }

  console.log("=== ADMIN ECHO LISTENER SETUP ===");
  console.log("👤 Current User:", currentUser);
  console.log("🆔 Admin ID:", currentUser.id);
  console.log("📛 Admin Name:", currentUser.name);
  console.log("🔑 Admin Role:", currentUser.role);
  
  const adminId = currentUser.id;
  const channelName = `chat.${adminId}`;
  
  console.log("🔌 Subscribing to channel:", channelName);
  console.log("==================================");
  
  const channel = echo.private(channelName);

  // Listen for subscription success
  channel.subscribed(() => {
    console.log("✅✅✅ ADMIN SUCCESSFULLY SUBSCRIBED ✅✅✅");
    console.log("📡 Listening on channel:", channelName);
    console.log("👂 Ready to receive customer messages!");
  });

  // Listen for subscription errors
  channel.error((error) => {
    console.error("❌❌❌ ADMIN SUBSCRIPTION ERROR ❌❌❌");
    console.error("Channel:", channelName);
    console.error("Error:", error);
  });

  // Message handler
  const handleIncomingMessage = (data) => {
    console.log("🔔🔔🔔 NEW MESSAGE EVENT RECEIVED 🔔🔔🔔");
    console.log("📩 Full Data:", data);
    console.log("📩 Message ID:", data.id);
    console.log("📩 Text:", data.text);
    console.log("📩 From user_id:", data.user_id);
    console.log("📩 To receiver_id:", data.receiver_id);
    console.log("📩 Message Type:", data.message_type);
    console.log("👤 Current Admin ID:", adminId);
    console.log("👥 Selected User ID:", selectedUser?.id);
    
    // Verify this message is for the admin
    if (data.receiver_id !== adminId) {
      console.log("⚠️ Message NOT for this admin, ignoring");
      console.log(`   Expected receiver_id: ${adminId}, Got: ${data.receiver_id}`);
      return;
    }

    console.log("✅ Message IS for admin!");
    console.log("📨 From customer ID:", data.user_id);

    // If viewing this customer's chat, add message to display

if (selectedUserRef.current?.id === data.user_id) {
      console.log("✅ Customer chat window is OPEN");
      
      setMessages((prevMessages) => {
        // Check for duplicate
        const isDuplicate = prevMessages.some((m) => m.id === data.id);
        
        if (isDuplicate) {
          console.log("⚠️ Message already exists, skipping");
          return prevMessages;
        }

        console.log("✅✅✅ ADDING MESSAGE TO CHAT DISPLAY ✅✅✅");
        
        const newMessage = {
          id: data.id,
          text: data.text,
          user_id: data.user_id,
          receiver_id: data.receiver_id,
          message_type: data.message_type || 'normal',
          is_paid: data.is_paid,
          payment_status: data.payment_status,
          created_at: data.created_at,
          sender_name: data.sender_name,
        };
        
        console.log("📝 New message object:", newMessage);
        return [...prevMessages, newMessage];
      });
    } else {
      console.log("ℹ️ Message from different customer (chat not open)");
      console.log(`   Expected user_id: ${selectedUser?.id}, Got: ${data.user_id}`);
    }

    // Update sidebar chat list
    console.log("📋 Updating sidebar chat list...");
    setChatUsers((prevUsers) => {
      const updatedUsers = prevUsers.map((user) => {
        if (user.id === data.user_id) {
          console.log(`✅ Updating sidebar for: ${user.name}`);
          return {
            ...user,
            last_message: {
              id: data.id,
              text: data.text,
              user_id: data.user_id,
              receiver_id: data.receiver_id,
              created_at: data.created_at,
            },
            unread_count: selectedUserRef.current?.id === user.id ? 0 : (user.unread_count || 0) + 1,
          };
        }
        return user;
      });

      // Sort by latest message
      const sorted = updatedUsers.sort((a, b) => {
        const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
        const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
        return dateB - dateA;
      });

      console.log("✅ Sidebar updated and sorted");
      return sorted;
    });

    console.log("🔔 Message handling complete!");
  };

  // Start listening
  console.log("👂 Starting to listen for 'MessageSent' events...");
  channel.listen("MessageSent", handleIncomingMessage);

  // Cleanup function
  return () => {
    console.log("🔌 CLEANUP: Unsubscribing from:", channelName);
    channel.stopListening("MessageSent", handleIncomingMessage);
    echo.leave(channelName);
  };
}, [currentUser]); // Dependencies: re-run when these change

  // ✅ FIXED: Fetch messages for selected user
  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      console.log("📜 Fetching messages for customer ID:", userId);
      console.log("📜 Current admin ID:", currentUser?.id);
      
      const response = await API.get(`/messages`, {
        params: {
          user_id: userId
        }
      });
      
      console.log("📜 Loaded", response.data.length, "messages for user", userId);
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
    console.log("👤 Selected customer:", user.name, "ID:", user.id);
    setSelectedUser(user);
    selectedUserRef.current = user; 
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
    
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      user_id: currentUser.id,
      receiver_id: selectedUser.id,
      created_at: new Date().toISOString(),
      sender_name: currentUser.name,
      message_type: messageType, 
    };

    console.log("📤 Admin sending message to customer:", messageText);
    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");
    setMessageType("normal"); 

    try {
      const response = await API.post("/messages", {
        text: messageText,
        receiver_id: selectedUser.id,
        message_type: messageType, 
      });

      const sentMessage = response.data;
      console.log("✅ Admin message sent successfully!");

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );

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
      console.error("❌ Error sending admin message:", error);
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
    <div className="flex h-screen bg-[#111b21] overflow-hidden">
      {/* LEFT SIDEBAR - Customer List */}
      <div className={`
         ${selectedUser ? 'hidden md:flex' : 'flex'} 
          w-full md:w-[350px] lg:w-[400px]
          border-r border-[#2a3942] 
          flex-col bg-[#111b21]
          transition-all duration-300
      `}>
        {/* Admin Header */}
        <div className="bg-[#202c33] p-4 flex items-center justify-between flex-shrink-0">
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
        <div className="p-3 bg-[#111b21] flex-shrink-0">
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
                    <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                      {formatTime(user.last_message?.created_at)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-400 truncate flex-1">
                      {user.last_message?.text || "No messages yet"}
                    </p>

                    {user.unread_count > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
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
      <div className="flex-1 flex flex-col bg-[#0b141a] min-w-0">
        {selectedUser ? (
          <>
            {/* Customer Details Header */}
            <div className="bg-[#202c33] border-b border-[#2a3942]">
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

              <div className="bg-[#1c2730] px-4 py-3">
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
                    <span className="text-gray-400 block mb-1">स्थायी ठेगाना:</span>
                    <span className="text-gray-200">
                      {[selectedUser.perm_street, selectedUser.perm_city, selectedUser.perm_country]
                        .filter(Boolean)
                        .join(', ') || "N/A"}
                    </span>
                  </div>
                </div>
                
                <div className="text-xs">
                  <span className="text-gray-400 block mb-1">अस्थायी ठेगाना:</span>
                  <span className="text-gray-200">
                    {[selectedUser.temp_street, selectedUser.temp_city, selectedUser.temp_country]
                      .filter(Boolean)
                      .join(', ') || "N/A"}
                  </span>
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
  // ✅ CORRECT: Check if message was sent BY the current admin user
 const isAdminMessage = msg.receiver_id === selectedUser?.id;
  
  console.log(`[Display] Message ID: ${msg.id} | user_id: ${msg.user_id} | currentUser.id: ${currentUser?.id} | isAdmin: ${isAdminMessage} | text: "${msg.text.substring(0, 30)}"`);
  
  let messageColor;

  if (isAdminMessage) {
    // Admin sent this message
    if (msg.message_type === "answer") {
      messageColor = "bg-[#005c4b]"; // ✅ Changed from purple to green
    } else {
      messageColor = "bg-[#005c4b]";
    }
  } else {
    // Customer sent this message
    if (msg.message_type === "question") {
      messageColor = "bg-[#1e3a5f]";
    } else {
      messageColor = "bg-[#202c33]";
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
        {isAdminMessage && msg.message_type === "answer" && (
          <div className="text-xs text-purple-300 mb-1 font-semibold">
            ⭐ Original Answer
          </div>
        )}
        
        {!isAdminMessage && msg.message_type === "question" && (
          <div className="text-xs text-yellow-300 mb-1 font-semibold">
            💰 Paid Question
          </div>
        )}
        
        <p className="break-words text-[14.2px] leading-[19px]">{msg.text}</p>

        {!isAdminMessage && msg.is_paid && msg.payment_status && (
          <div className="flex items-center gap-1 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded ${
              msg.payment_status === 'paid' ? 'bg-blue-600' : 'bg-orange-600'
            }`}>
              {msg.payment_status === 'paid' ? '💳 Paid' : '⏳ Pending'}
            </span>
          </div>
        )}

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

            {/* Message Type Toggle + Input Box */}
            <div className="bg-[#202c33]">
              <div className="flex border-b border-[#2a3942] p-2 gap-2">
                <button
                  onClick={() => setMessageType("normal")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    messageType === "normal"
                      ? "bg-[#00a884] text-white"
                      : "bg-[#2a3942] text-gray-400 hover:bg-[#374952]"
                  }`}
                >
                  💬 Normal Conversation
                </button>
                <button
                  onClick={() => setMessageType("answer")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                    messageType === "answer"
                      ? "bg-[#8b5cf6] text-white"
                      : "bg-[#2a3942] text-gray-400 hover:bg-[#374952]"
                  }`}
                >
                  ⭐ Original Answer
                </button>
              </div>

              <div className="p-3 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={messageType === "answer" ? "Type your answer..." : "Type a message to customer..."}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className={`flex-1 rounded-lg px-4 py-3 focus:outline-none placeholder-gray-500 text-white ${
                    messageType === "answer" 
                      ? "bg-[#4c1d95] border-2 border-[#8b5cf6]" 
                      : "bg-[#2a3942]"
                  }`}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className={`rounded-full p-3 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    messageType === "answer"
                      ? "bg-[#8b5cf6] hover:bg-[#7c3aed]"
                      : "bg-[#00a884] hover:bg-[#06cf9c]"
                  } text-white`}
                >
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </>
        ) : (
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