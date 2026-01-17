import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY || "sqja9bn48v14nbqjmts5",
    wsHost: import.meta.env.VITE_REVERB_HOST || "localhost",
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT) || 8080,
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT) || 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    authEndpoint: `${import.meta.env.VITE_API_URL || "https://hamroastro.com"}/api/broadcasting/auth`,
    auth: {
        headers: {
            Accept: "application/json",
        },
    },
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                const token = localStorage.getItem("token");
                if (!token) {
                    console.error("❌ No token found");
                    callback(new Error("No auth token"), null);
                    return;
                }
                
                console.log("🔐 Authenticating channel:", channel.name);
                
                fetch(options.authEndpoint, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                .then(response => {
                    console.log("📡 Auth status:", response.status);
                    if (!response.ok) {
                        throw new Error(`Auth failed: ${response.status}`);  // ✅ FIXED
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("✅ Authenticated!");
                    callback(null, data);
                })
                .catch(error => {
                    console.error("❌ Auth error:", error);
                    callback(error, null);
                });
            }
        };
    },
});

window.Echo = echo;

echo.connector.pusher.connection.bind("connected", () => {
    console.log("💚 WebSocket Connected");
    console.log("🆔 Socket ID:", echo.socketId());
});

echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ WebSocket Error:", err);
});

export default echo;