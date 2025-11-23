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

  // 12 Rashis list
  const rashiList = [
    "Mesh (मेष)",
    "Vrishabh (वृषभ)",
    "Mithun (मिथुन)",
    "Karka (कर्क)",
    "Simha (सिंह)",
    "Kanya (कन्या)",
    "Tula (तुला)",
    "Vrishchik (वृश्चिक)",
    "Dhanu (धनु)",
    "Makar (मकर)",
    "Kumbh (कुम्भ)",
    "Meen (मीन)"
  ];

  // Get current logged-in user
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/login");
    } else {
      setCurrentUser(user);
      console.log("Current User ID:", user.id);
    }
  }, [navigate]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --------------------------
  // FETCH CHAT USERS
  // --------------------------
  useEffect(() => {
    const fetchChatUsers = async () => {
      try {
        const res = await API.get("/chat-users");
        // Filter out the current user from the chat list
        const otherUsers = (res.data || []).filter(
          (user) => user.id !== currentUser?.id
        );
        
        // Sort users by last message time (newest first)
        const sortedUsers = otherUsers.sort((a, b) => {
          const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return dateB - dateA; // Descending order (newest first)
        });
        
        console.log("Chat users loaded (excluding self):", sortedUsers.length);
        setChatUsers(sortedUsers);
      } catch (err) {
        console.error("Error loading chat users:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
        }
      }
    };

    if (currentUser) {
      fetchChatUsers();
    }
  }, [navigate, currentUser]);

  
  
  useEffect(() => {
    if (!currentUser) return;

    console.log("Setting up Echo listener");
    const channel = echo.channel("chat");
    let isSubscribed = true; // Flag to prevent state updates after unmount

    const handleMessage = (e) => {
      if (!isSubscribed) return; // Ignore if component unmounted
      
      console.log("🔥 Real-time message received:", e);

      const messageData = e.message || e;
      
      // Only add message if it involves the current user
      const involvesCurrentUser = 
        messageData.user_id === currentUser.id || 
        messageData.receiver_id === currentUser.id;

      if (!involvesCurrentUser) {
        console.log("Message not for current user, ignoring");
        return;
      }

      // Check if this is a message WE just sent (skip it to avoid duplicates)
      const isSentByMe = messageData.user_id === currentUser.id;
      if (isSentByMe) {
        console.log("Message sent by current user via broadcast, skipping (already added optimistically)");
        return;
      }

      // Only update for messages received FROM others
      setMessages((prev) => {
        // Check if message already exists (prevent duplicates)
        const exists = prev.some((m) => m.id === messageData.id);
        if (exists) {
          console.log("Message already exists, skipping:", messageData.id);
          return prev;
        }
        
        console.log("Adding new real-time message:", messageData.id);
        return [...prev, messageData];
      });

      // Update chat list to show new message preview and move to top
      setChatUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => {
          // Update the user who sent this message
          if (user.id === messageData.user_id) {
            return {
              ...user,
              last_message: messageData,
            };
          }
          return user;
        });
        
        // Sort to bring the updated conversation to the top
        const sortedUsers = updatedUsers.sort((a, b) => {
          const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return dateB - dateA;
        });
        
        console.log("Chat list updated with new message");
        return sortedUsers;
      });
    };

    channel.listen(".MessageSent", handleMessage);

    return () => {
      console.log("Cleaning up Echo listener");
      isSubscribed = false;
      channel.stopListening(".MessageSent", handleMessage);
      echo.leave("chat");
    };
  }, [currentUser]);

  // --------------------------
  // FETCH MESSAGES FOR SELECTED USER
  // --------------------------
  const fetchMessages = async (userId) => {
    setLoading(true);
    try {
      const response = await API.get(`/messages?receiver_id=${userId}`);
      console.log("Fetched messages:", response.data);
      setMessages(response.data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // SELECT USER AND LOAD CHAT
  // --------------------------
  const handleSelectUser = (user) => {
    setSelectedUser(user);
    fetchMessages(user.id);
  };

  // --------------------------
  // SEND MESSAGE
  // --------------------------
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser) return;

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`; // Temporary ID for optimistic update
    
    // Optimistic update - add message immediately with temp ID
    const optimisticMessage = {
      id: tempId,
      text: messageText,
      user_id: currentUser.id,
      receiver_id: selectedUser.id,
      created_at: new Date().toISOString(),
      sender_name: currentUser.name,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage(""); // Clear input immediately

    try {
      const payload = {
        text: messageText,
        receiver_id: selectedUser.id,
      };

      const response = await API.post("/messages", payload);
      const sentMessage = response.data;
      console.log("Sent message:", sentMessage);

      // Replace temporary message with real one from server
      setMessages((prev) => 
        prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );

      // Update chat list to move this conversation to top
      setChatUsers((prevUsers) => {
        const updatedUsers = prevUsers.map((user) => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              last_message: sentMessage,
            };
          }
          return user;
        });
        
        // Sort to bring updated conversation to top
        return updatedUsers.sort((a, b) => {
          const dateA = a.last_message?.created_at ? new Date(a.last_message.created_at) : new Date(0);
          const dateB = b.last_message?.created_at ? new Date(b.last_message.created_at) : new Date(0);
          return dateB - dateA;
        });
      });
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error and restore input
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(messageText);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // --------------------------
  // FILTER USERS BY SEARCH
  // --------------------------
  const filteredUsers = chatUsers.filter((user) =>
    user.name.toLowerCase().includes(search.toLowerCase())
  );

  // --------------------------
  // FORMAT TIME
  // --------------------------
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="flex h-screen bg-[#111b21]">
      {/* Left Sidebar - Chat List */}
      <div className="w-full md:w-[400px] border-r border-[#2a3942] flex flex-col bg-[#111b21]">
        {/* Header */}
        <div className="bg-[#202c33] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentUser && (
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-semibold">
                {currentUser.name?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <h3 className="font-semibold text-white text-lg">Chats</h3>
          </div>
          <FaEllipsisV className="text-gray-400 cursor-pointer hover:text-white" />
        </div>

        {/* Search Bar */}
        <div className="p-3 bg-[#111b21]">
          <div className="relative">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-2 rounded-lg bg-[#202c33] text-white placeholder-gray-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500 mt-10">No users found</p>
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
                    <h4 className="font-medium text-white truncate">
                      {user.name}
                    </h4>
                    <span className="text-xs text-gray-500 ml-2">
                      {formatTime(user.last_message?.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 truncate">
                    {user.last_message?.text || "No messages yet"}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Side - Chat Window */}
      <div className="flex-1 flex flex-col bg-[#0b141a]">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#202c33] border-b border-[#2a3942]">
              {/* NEW: User Info Row - TOP */}
              <div className="bg-[#1c2730] px-4 py-3 border-b border-[#2a3942] flex items-start justify-between gap-6">
                {/* LEFT: Rashi Select */}
                <div className="flex items-center gap-2">
                  <label className="text-gray-400 text-sm font-medium">Rashi:</label>
                  <select
                    value={selectedRashi}
                    onChange={(e) => setSelectedRashi(e.target.value)}
                    className="bg-[#2a3942] text-white text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#00a884] border border-[#3d4a54]"
                  >
                    <option value="">Select Rashi</option>
                    {rashiList.map((rashi, idx) => (
                      <option key={idx} value={rashi}>
                        {rashi}
                      </option>
                    ))}
                  </select>
                </div>

               <div className="flex gap-10 text-xs leading-relaxed">

                {/* जन्म मिति (Nepali DOB) */}
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400">जन्म मिति:</span>
                  <span className="text-gray-300">{selectedUser.dob_nep || "N/A"}</span>
                </div>

                {/* जन्म स्थान (Birth Place) */}
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400">जन्म स्थान:</span>
                  <span className="text-gray-300">
                    {selectedUser.birth_place || "N/A"}
                  </span>
                </div>

                {/* जन्म समय (Birth Time) */}
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400">जन्म समय:</span>
                  <span className="text-gray-300">{selectedUser.birth_time || "N/A"}</span>
                </div>

                {/* ठेगाना (Address) */}
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400">ठेगाना:</span>
                  <span className="text-gray-300">{selectedUser.temp_address || "N/A"}</span>
                </div>

              </div>
              </div>


              {/* User Name Row - BELOW */}
              <div className="p-3 flex items-center gap-3">
                <FaArrowLeft
                  className="text-white md:hidden cursor-pointer"
                  onClick={() => setSelectedUser(null)}
                />
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg">
                  {selectedUser.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">
                    {selectedUser.name}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedUser.email || "Online"}
                  </p>
                </div>
                <FaEllipsisV className="text-gray-400 cursor-pointer hover:text-white" />
              </div>
            </div>

            {/* Messages Area */}
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
                  const messageUserId = msg.user_id || msg.sender_id || msg.from_user_id;
                  const currentUserId = currentUser?.id;
                  
                  // Convert both to numbers for reliable comparison
                  const isOwnMessage = Number(messageUserId) === Number(currentUserId);
                  
                  // Create a unique key that won't conflict
                  const uniqueKey = msg.id ? `msg-${msg.id}` : `temp-${index}`;
                  
                  // Debug log to see what's happening
                  console.log('Rendering message:', {
                    msgId: msg.id,
                    messageUserId,
                    currentUserId,
                    isOwnMessage,
                    text: msg.text.substring(0, 30)
                  });
                  
                  return (
                    <div
                      key={uniqueKey}
                      className={`flex ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[65%] rounded-md px-3 py-2 shadow-sm ${
                          isOwnMessage
                            ? "bg-[#005c4b] text-white"
                            : "bg-[#202c33] text-white"
                        }`}
                        style={{
                          borderRadius: isOwnMessage ? "8px 8px 0px 8px" : "8px 8px 8px 0px"
                        }}
                      >
                        <p className="break-words text-[14.2px] leading-[19px]">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1 mt-1">
                          <span className="text-[11px] text-gray-300 opacity-70">
                            {formatTime(msg.created_at)}
                          </span>
                          {isOwnMessage && (
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

            {/* Message Input */}
            <div className="bg-[#202c33] p-3 flex items-center gap-2">
              <input
                type="text"
                placeholder="Type a message"
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
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <div className="text-7xl mb-4">💬</div>
            <h2 className="text-2xl font-light mb-2">astro web</h2>
            <p className="text-center max-w-md">
              Send and receive messages without keeping your phone online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}