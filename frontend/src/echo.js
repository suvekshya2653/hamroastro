import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const echo = new Echo({
    broadcaster: "reverb",
    key: process.env.REACT_APP_REVERB_APP_KEY || "sqja9bn48v14nbqjmts5",
    wsHost: process.env.REACT_APP_REVERB_HOST || "localhost",
    wsPort: parseInt(process.env.REACT_APP_REVERB_PORT) || 8080,
    wssPort: parseInt(process.env.REACT_APP_REVERB_PORT) || 8080,
    forceTLS: (process.env.REACT_APP_REVERB_SCHEME || "http") === "https",
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    
    authEndpoint: `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/api/broadcasting/auth`,
    
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
                        throw new Error(`Auth failed: ${response.status}`);
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