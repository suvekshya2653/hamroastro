import React, { useEffect, useState, useRef } from "react";
import { IoSend } from "react-icons/io5";
import API from "../api";
import echo from "../echo";

export default function CustomerChat() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load user + chat
  useEffect(() => {
    const storedUser =
      JSON.parse(localStorage.getItem("user")) ||
      JSON.parse(sessionStorage.getItem("user"));

    if (!storedUser) {
      window.location.href = "/login";
      return;
    }

    setUser(storedUser);
    loadMessages(storedUser.id);
  }, []);

  // ===========================
  // REAL-TIME ECHO LISTENER
  // ===========================
  useEffect(() => {
    if (!user) return;

    const channel = echo.channel("chat");

    const handleMessage = (e) => {
      const messageData = e.message || e;

      // Accept messages where customer is sender or receiver
      if (
        messageData.user_id === user.id ||
        messageData.receiver_id === user.id
      ) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.id === messageData.id);
          if (exists) return prev;

          return [
            ...prev,
            {
              id: messageData.id,
              text: messageData.text,
              sender:
                messageData.user_id === user.id ? "customer" : "admin",
              created_at: messageData.created_at,
              time: new Date(messageData.created_at).toLocaleTimeString(),
            },
          ];
        });
      }
    };

    channel.listen(".MessageSent", handleMessage);

    return () => {
      echo.leave("chat");
    };
  }, [user]);

  // ===========================
  // LOAD CHAT HISTORY (FIXED)
  // ===========================
  const loadMessages = async (userId) => {
    try {
      const res = await API.get(`/messages?user_id=${userId}`);
      const formatted = res.data.map((msg) => ({
        id: msg.id,
        text: msg.text,
        sender: msg.user_id === userId ? "customer" : "admin",
        created_at: msg.created_at,
        time: new Date(msg.created_at).toLocaleTimeString(),
      }));
      setMessages(formatted);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  // ===========================
  // SEND CUSTOMER MESSAGE (FIXED)
  // ===========================
  const sendMessage = async () => {
    if (!message.trim() || !user) return;

    const messageText = message.trim();
    const tempId = `temp-${Date.now()}`;

    // Optimistic display
    const optimistic = {
      id: tempId,
      text: messageText,
      sender: "customer",
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessage("");

    try {
      const response = await API.post("/messages", {
        text: messageText,
        user_id: user.id, // 🔥 FIXED: required sender
        receiver_id: 1,   // admin
      });

      const real = response.data;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: real.id,
                text: real.text,
                sender: "customer",
                created_at: real.created_at,
                time: new Date(real.created_at).toLocaleTimeString(),
              }
            : m
        )
      );
    } catch (err) {
      console.error("Send failed:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(messageText);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen w-full bg-[#0C141D] flex text-white">
      {/* LEFT SIDE USER PANEL */}
      <div className="w-80 bg-[#111B28] border-r border-gray-800 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Hamro Astro</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-gray-400 text-sm">Full Name</h3>
            <p className="text-lg font-semibold">{user.name}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Email</h3>
            <p>{user.email}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Gender</h3>
            <p>{user.gender || "N/A"}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Birth Date</h3>
            <p>{user.dob_nep}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Birth Time</h3>
            <p>{user.birth_time}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Address</h3>
            <p>
              {user.street}, {user.city}
            </p>
            <p>{user.country}</p>
          </div>
        </div>
      </div>

      {/* RIGHT CHAT */}
      <div className="flex-1 flex flex-col">
        {/* HEADER */}
        <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#111B28]">
          <div>
            <h2 className="text-xl font-bold">Chat with Hamro Astro</h2>
            <p className="text-gray-400 text-sm">
              {user.city}, {user.country} • {user.email}
            </p>
          </div>
        </div>

        {/* MESSAGES */}
        <div
          className="flex-1 overflow-y-auto p-6 space-y-3"
          style={{
            backgroundImage:
              "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundSize: "cover",
          }}
        >
          {messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-400">No messages yet. Start chatting!</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.sender === "customer" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[65%] rounded-lg px-4 py-2 shadow-md ${
                    m.sender === "customer"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-200"
                  }`}
                >
                  <p>{m.text}</p>
                  <div className="text-xs text-gray-300 mt-1 opacity-70">
                    {m.time}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT */}
        <div className="p-4 bg-[#111B28] border-t border-gray-800 flex items-center gap-3">
          <input
            type="text"
            className="flex-1 p-3 rounded-xl bg-[#0C141D] text-white border border-gray-700"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />

          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full"
          >
            <IoSend size={22} />
          </button>
        </div>
      </div>
    </div>
  );
}
