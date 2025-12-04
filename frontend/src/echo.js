import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Make Pusher available globally
window.Pusher = Pusher;

// Configure Echo
const echo = new Echo({
    broadcaster: "reverb",
    key: process.env.REACT_APP_REVERB_APP_KEY || "sqja9bn48v14nbqjmts5",
    wsHost: process.env.REACT_APP_REVERB_HOST || "localhost",
    wsPort: process.env.REACT_APP_REVERB_PORT || 8080,
    wssPort: process.env.REACT_APP_REVERB_PORT || 8080,
    forceTLS: false,
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    
    authEndpoint: `${process.env.REACT_APP_API_URL || "http://localhost:8000"}/broadcasting/auth`,
    
    auth: {
        headers: {
            Accept: "application/json",
        },
    },
    
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                const token = localStorage.getItem("token") || sessionStorage.getItem("token");
                
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
                .then(response => response.json())
                .then(data => {
                    callback(null, data);
                })
                .catch(error => {
                    callback(error, null);
                });
            }
        };
    },
});

// Store globally for debugging
window.Echo = echo;

// Connection event handlers
echo.connector.pusher.connection.bind("connected", () => {
    console.log("💚 Reverb WebSocket Connected");
});

echo.connector.pusher.connection.bind("error", (err) => {
    console.error("❌ Reverb WebSocket Error:", err);
});

echo.connector.pusher.connection.bind("disconnected", () => {
    console.warn("⚠️ Reverb WebSocket Disconnected");
});

echo.connector.pusher.connection.bind("unavailable", () => {
    console.error("❌ Reverb WebSocket Unavailable");
});

echo.connector.pusher.connection.bind("failed", () => {
    console.error("❌ Reverb WebSocket Failed");
});

// Export the echo instance
export default echo;
