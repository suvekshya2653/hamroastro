import React, { useEffect, useState, useRef } from "react";
import { IoSend } from "react-icons/io5";
import API from "../api";
import echo from "../echo";
import PaymentModal from "./PaymentModal";

export default function CustomerChat() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const [paymentRequired, setPaymentRequired] = useState(false);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load user + chat history
  useEffect(() => {
    const loadUserAndMessages = async () => {
      const storedUser =
        JSON.parse(localStorage.getItem("user")) ||
        JSON.parse(sessionStorage.getItem("user"));

      if (!storedUser) {
        console.error("❌ No user found in storage");
        window.location.href = "/login";
        return;
      }

      console.log("👤 Customer logged in:", storedUser);
      console.log("🔍 User data check:", {
        hasName: !!storedUser.name,
        hasEmail: !!storedUser.email,
        hasGender: !!storedUser.gender,
        hasDobNep: !!storedUser.dob_nep,
        hasBirthTime: !!storedUser.birth_time,
        hasBirthPlace: !!storedUser.birth_place,
        hasTempAddress: !!storedUser.temp_address
      });

      // Fetch fresh user data from API to get complete profile
      try {
        const userResponse = await API.get('/user');
        console.log("✅ Fresh user data from API:", userResponse.data);
        setUser(userResponse.data);
        await loadMessages(userResponse.data.id);
      } catch (err) {
        console.error("❌ Error fetching user profile:", err);
        // Fallback to stored user
        setUser(storedUser);
        await loadMessages(storedUser.id);
      }
    };

    loadUserAndMessages();
  }, []);

  // Real-time listener
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

      const isForMe = data.receiver_id === user.id;

      if (!isForMe) {
        console.log("⚠️ Message not for me");
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.id);
        if (exists) {
          console.log("⚠️ Message already exists, skipping");
          return prev;
        }

        console.log("✅ Adding admin message to chat");
        return [
          ...prev,
          {
            id: data.id,
            text: data.text,
            sender: "admin",
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

  // Load messages
  const loadMessages = async (userId) => {
    try {
      console.log("📜 Loading messages for user:", userId);
      const res = await API.get(`/messages?receiver_id=1`);
      console.log("📜 Loaded chat history:", res.data);

      const formatted = res.data.map((msg) => ({
        id: msg.id,
        text: msg.text,
        sender: msg.user_id === userId ? "customer" : "admin",
        user_id: msg.user_id,
        receiver_id: msg.receiver_id,
        created_at: msg.created_at,
        time: new Date(msg.created_at).toLocaleTimeString(),
      }));

      console.log("✅ Formatted messages:", formatted.length);
      setMessages(formatted);
    } catch (err) {
      console.error("❌ Error loading messages:", err);
      console.error("Error details:", err.response?.data);
    }
  };

  // Check if payment is required
  const checkPaymentRequired = async () => {
    if (!user) {
      console.error("❌ No user, cannot check payment");
      return false;
    }
    
    try {
      console.log("💰 Checking if payment required...");
      const res = await API.get(`/check-payment?receiver_id=1`);
      console.log("💰 Payment check result:", res.data);
      setPaymentRequired(res.data.requires_payment);
      return res.data.requires_payment;
    } catch (err) {
      console.error("❌ Payment check error:", err);
      console.error("Error response:", err.response?.data);
      return false;
    }
  };

  // Send message (with payment check)
  const sendMessage = async () => {
    if (!message.trim() || !user) {
      console.log("⚠️ Cannot send: empty message or no user");
      return;
    }

    const text = message.trim();
    console.log("📤 Attempting to send message:", text);

    try {
      // ✅ Check if payment is required
      const needsPayment = await checkPaymentRequired();

      if (needsPayment) {
        console.log("💳 Payment required, showing modal");
        setPendingMessage(text);
        setShowPaymentModal(true);
        return; // Don't send yet, wait for payment
      }

      // Payment not required, send message
      console.log("✅ No payment required, sending message");
      await sendMessageWithPayment(text, null);
    } catch (err) {
      console.error("❌ Error in sendMessage:", err);
      alert("Failed to send message. Check console for details.");
    }
  };

  // Actually send the message (with optional transaction ID)
  const sendMessageWithPayment = async (text, transactionId = null) => {
    console.log("🚀 sendMessageWithPayment called:", { text, transactionId });
    
    const tempId = `tmp-${Date.now()}`;

    const optimistic = {
      id: tempId,
      text,
      sender: "customer",
      user_id: user.id,
      receiver_id: 1,
      created_at: new Date().toISOString(),
      time: new Date().toLocaleTimeString(),
    };

    console.log("➕ Adding optimistic message:", optimistic);
    setMessages((prev) => [...prev, optimistic]);
    setMessage("");

    try {
      const payload = {
        text,
        receiver_id: 1, // Admin ID
      };

      // ✅ Add transaction ID if payment was made
      if (transactionId) {
        payload.transaction_id = transactionId;
        console.log("💳 Including transaction ID:", transactionId);
      }

      console.log("📡 Sending API request:", payload);
      const res = await API.post("/messages", payload);
      const real = res.data;
      console.log("✅ Message sent successfully:", real);

      // Replace optimistic with real message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: real.id,
                text: real.text,
                sender: "customer",
                user_id: real.user_id,
                receiver_id: real.receiver_id,
                created_at: real.created_at,
                time: new Date(real.created_at).toLocaleTimeString(),
              }
            : m
        )
      );

      // ✅ Update payment status
      if (transactionId) {
        console.log("✅ Payment confirmed, updating status");
        setPaymentRequired(false);
      }
    } catch (err) {
      console.error("❌ Message send error:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      // Remove optimistic message on error
      console.log("🗑️ Removing failed message");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setMessage(text); // Restore message text
      
      // ✅ Show payment error
      if (err.response?.status === 402 || err.response?.data?.requires_payment) {
        console.log("💳 Payment required error, showing modal");
        setPendingMessage(text);
        setShowPaymentModal(true);
      } else {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || "Failed to send message";
        alert(errorMsg);
      }
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async (transactionId) => {
    console.log("💳 Processing payment with ID:", transactionId);
    
    try {
      await sendMessageWithPayment(pendingMessage, transactionId);
      setShowPaymentModal(false);
      setPendingMessage("");
      console.log("✅ Payment processed successfully");
    } catch (err) {
      console.error("❌ Payment submission error:", err);
      throw err; // Let PaymentModal handle the error display
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0C141D] flex text-white">
      {/* LEFT PANEL */}
      <div className="w-80 bg-[#111B28] border-r border-gray-800 p-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Hamro Astro</h2>

        <div className="space-y-4">
          <div>
            <h3 className="text-gray-400 text-sm">Full Name</h3>
            <p className="text-lg font-semibold">{user.name || "Not provided"}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Email</h3>
            <p>{user.email || "Not provided"}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Gender</h3>
            <p>{user.gender || "Not provided"}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Birth Date</h3>
            <p>{user.dob_nep || "Not provided"}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Birth Time</h3>
            <p>{user.birth_time || "Not provided"}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Birth Place</h3>
            <p>{user.birth_place || "Not provided"}</p>
          </div>

          <div>
            <h3 className="text-gray-400 text-sm">Address</h3>
            <p>{user.temp_address || "Not provided"}</p>
          </div>

          {/* Debug info - Remove after testing */}
          <div className="mt-6 p-3 bg-gray-800 rounded text-xs">
            <p className="text-gray-400 mb-1">Debug Info:</p>
            <p className="text-green-400">User ID: {user.id}</p>
            <p className="text-green-400">Messages: {messages.length}</p>
            <p className="text-green-400">Payment Required: {paymentRequired ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>

      {/* CHAT UI */}
      <div className="flex-1 flex flex-col">
        <div className="p-5 border-b border-gray-800 bg-[#111B28]">
          <h2 className="text-xl font-bold">Chat with Hamro Astro</h2>
          <p className="text-gray-400 text-sm">• {user.email}</p>
        </div>

        <div
          className="p-6 space-y-3 overflow-y-auto h-[calc(100vh-130px)]"
          style={{
            backgroundImage:
              "url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')",
            backgroundSize: "cover",
          }}
        >
          {messages.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-gray-400">No messages yet. Start the conversation!</p>
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
                    m.sender === "customer" ? "bg-[#005c4b]" : "bg-[#202c33]"
                  }`}
                >
                  <p className="break-words text-[14.2px] leading-[19px]">
                    {m.text}
                  </p>
                  <div className="text-xs text-gray-300 mt-1 opacity-70">
                    {m.time}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* INPUT BOX */}
        <div className="p-4 bg-[#202c33] border-t border-gray-800 flex items-center gap-3">
          <input
            type="text"
            className="flex-1 p-3 rounded-lg bg-[#2a3942] text-white placeholder-gray-500 focus:outline-none"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKey}
          />
          <button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-[#00a884] hover:bg-[#06cf9c] text-white p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IoSend size={22} />
          </button>
        </div>
      </div>

      {/* ✅ PAYMENT MODAL */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          console.log("❌ Payment modal closed");
          setShowPaymentModal(false);
          setMessage(pendingMessage); // Restore message if user closes modal
        }}
        onPaymentSubmit={handlePaymentSubmit}
        amount={20}
      />
    </div>
  );
}