import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

// Debug: confirm env is loading correctly
console.log("🔧 REVERB CONFIG:", {
  key: process.env.REACT_APP_REVERB_KEY,
  host: process.env.REACT_APP_REVERB_HOST,
  port: process.env.REACT_APP_REVERB_PORT,
});

const echo = new Echo({
  broadcaster: "reverb",
  key: process.env.REACT_APP_REVERB_KEY || "sqja9bn48v14nbqjmts5",
  wsHost: process.env.REACT_APP_REVERB_HOST || "localhost",
  wsPort: process.env.REACT_APP_REVERB_PORT || 8080,
  wssPort: process.env.REACT_APP_REVERB_PORT || 8080,
  forceTLS: false,
  enabledTransports: ["ws", "wss"],
  disableStats: true,
  // Add auth endpoint for private channels (if needed later)
  authEndpoint: `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  },
});

// Connection status logging
echo.connector.pusher.connection.bind("connected", () => {
  console.log("✅ Reverb Connected!");
});

echo.connector.pusher.connection.bind("error", (err) => {
  console.error("❌ Reverb Connection Error:", err);
});

echo.connector.pusher.connection.bind("disconnected", () => {
  console.warn("⚠️ Reverb Disconnected");
});

export default echo;