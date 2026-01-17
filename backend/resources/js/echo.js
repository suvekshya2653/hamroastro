import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

// ✅ FIXED: Use import.meta.env for Vite instead of process.env
const echo = new Echo({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY || "sqja9bn48v14nbqjmts5",
    wsHost: import.meta.env.VITE_REVERB_HOST || "127.0.0.1",
    wsPort: parseInt(import.meta.env.VITE_REVERB_PORT) || 8080,
    wssPort: parseInt(import.meta.env.VITE_REVERB_PORT) || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
    disableStats: true,
    enabledTransports: ["ws", "wss"],

    authEndpoint: `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api/broadcasting/auth`,

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
                console.log("🆔 Socket ID:", socketId);

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
                    console.log("📡 Auth response status:", response.status);
                    if (!response.ok) {
                        return response.text().then(text => {
                            console.error("❌ Auth failed with response:", text);
                            throw new Error(`Auth failed: ${response.status}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("✅ Channel authenticated successfully!");
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

// ✅ Connection event listeners
echo.connector.pusher.connection.bind("connected", () => {
    console.log("💚 WebSocket Connected Successfully");
    console.log("🆔 Socket ID:", echo.socketId());
});

echo.connector.pusher.connection.bind("disconnected", () => {
    console.log("🔴 WebSocket Disconnected");
});

echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ WebSocket Connection Error:", err);
});

echo.connector.pusher.connection.bind("state_change", (states) => {
    console.log("🔄 Connection state changed:", states.previous, "→", states.current);
});

export default echo;
