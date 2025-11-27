import Echo from "laravel-echo";
import Pusher from "pusher-js";

Pusher.Runtime.createWebSocket = (url) => {
    return new WebSocket(url); // Important for React
};

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: "reverb",

    wsHost: process.env.REACT_APP_REVERB_HOST || "localhost",
    wsPort: process.env.REACT_APP_REVERB_PORT || 8080,
    wssPort: process.env.REACT_APP_REVERB_PORT || 8080,
    key: process.env.REACT_APP_REVERB_APP_KEY || "sqja9bn48v14nbqjmts5",

    forceTLS: false,
    enabledTransports: ["ws"],
    encrypted: false,

    authEndpoint:
        `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/broadcasting/auth`,

    auth: {
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    },
});

// Debug
window.Echo.connector.pusher.connection.bind("connected", () => {
    console.log("💚 Reverb WebSocket Connected");
});

window.Echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ Reverb WebSocket Error:", err);
});

window.Echo.connector.pusher.connection.bind("disconnected", () => {
    console.warn("⚠️ Reverb WebSocket Disconnected");
});

export default window.Echo;
