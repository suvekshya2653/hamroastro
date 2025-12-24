import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

// ✅ Function to get fresh token
const getAuthHeaders = () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    console.log("🔑 Using token for auth:", token ? "Token exists" : "NO TOKEN!");
    return {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
    };
};

const echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY || "sqja9bn48v14nbqjmts5",
    wsHost: import.meta.env.VITE_REVERB_HOST || "localhost",
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
    enabledTransports: ["ws", "wss"],

    authEndpoint: "http://localhost:8000/broadcasting/auth",

    auth: {
        headers: getAuthHeaders(),
    },
});

window.Echo = echo;

echo.connector.pusher.connection.bind("connected", () => {
    console.log("💚 Reverb WebSocket Connected");
});

echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ Reverb WebSocket Error:", err);
});

export default echo;
