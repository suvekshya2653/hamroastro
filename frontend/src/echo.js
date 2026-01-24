import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

// ✅ Safe environment variable access
const getEnv = (key, fallback) => {
    try {
        return import.meta.env[key] || fallback;
    } catch (e) {
        return fallback;
    }
};

// ✅ Detect environment
const isLocal = window.location.hostname === 'localhost' || 
                window.location.hostname === '127.0.0.1';

console.log("🌍 Environment detected:", isLocal ? "LOCAL" : "PRODUCTION");
console.log("🔑 VITE_REVERB_APP_KEY:", getEnv('VITE_REVERB_APP_KEY', 'not-set'));
console.log("🏠 VITE_REVERB_HOST:", getEnv('VITE_REVERB_HOST', 'not-set'));
console.log("🔌 VITE_REVERB_PORT:", getEnv('VITE_REVERB_PORT', 'not-set'));

// ✅ Configuration
const config = {
    broadcaster: "reverb",
    key: getEnv('VITE_REVERB_APP_KEY', 'sqja9bn48v14nbqjmts5'),
    
    wsHost: getEnv('VITE_REVERB_HOST', isLocal ? 'localhost' : 'hamroastro.com'),
    wsPort: parseInt(getEnv('VITE_REVERB_PORT', isLocal ? '8080' : '443')),
    wssPort: parseInt(getEnv('VITE_REVERB_PORT', isLocal ? '8080' : '443')),
    forceTLS: getEnv('VITE_REVERB_SCHEME', isLocal ? 'http' : 'https') === 'https',
    
    disableStats: true,
    enabledTransports: ["ws", "wss"],
    
    authEndpoint: `${getEnv('VITE_API_URL', isLocal ? 'http://localhost:8000' : 'https://hamroastro.com')}/api/broadcasting/auth`,
    
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
                    console.error("❌ No token found in localStorage");
                    callback(new Error("No auth token"), null);
                    return;
                }

                console.log("=== 🔐 CHANNEL AUTHORIZATION ===");
                console.log("Channel:", channel.name);
                console.log("Socket ID:", socketId);
                console.log("Auth Endpoint:", options.authEndpoint);
                console.log("Token (first 20 chars):", token.substring(0, 20) + "...");
                console.log("================================");

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
                            console.error("❌ Auth failed - Status:", response.status);
                            console.error("❌ Response body:", text);
                            throw new Error(`Auth failed: ${response.status} - ${text}`);
                        });
                    }
                    return response.json();
                })
                .then(data => {
                    console.log("✅ Channel authenticated successfully!");
                    console.log("✅ Auth data:", data);
                    callback(null, data);
                })
                .catch(error => {
                    console.error("❌ Authorization error:", error.message);
                    callback(error, null);
                });
            }
        };
    },
};

// Debug: Log the full configuration
console.log("=== 🔧 ECHO CONFIGURATION ===");
console.log("Environment:", isLocal ? "LOCAL" : "PRODUCTION");
console.log("Broadcaster:", config.broadcaster);
console.log("Key:", config.key);
console.log("WS Host:", config.wsHost);
console.log("WS Port:", config.wsPort);
console.log("Force TLS:", config.forceTLS);
console.log("Auth Endpoint:", config.authEndpoint);
console.log("============================");

const echo = new Echo(config);

window.Echo = echo;

// ✅ Connection event listeners with detailed logging
echo.connector.pusher.connection.bind("connected", () => {
    console.log("=== 💚 WEBSOCKET CONNECTED ===");
    console.log("Socket ID:", echo.socketId());
    console.log("Connection State:", echo.connector.pusher.connection.state);
    console.log("==============================");
});

echo.connector.pusher.connection.bind("connecting", () => {
    console.log("🔄 WebSocket connecting...");
});

echo.connector.pusher.connection.bind("disconnected", () => {
    console.log("=== 🔴 WEBSOCKET DISCONNECTED ===");
});

echo.connector.pusher.connection.bind("error", (err) => {
    console.error("=== ❌ WEBSOCKET ERROR ===");
    console.error("Error:", err);
    console.error("=========================");
});

echo.connector.pusher.connection.bind("state_change", (states) => {
    console.log("🔄 Connection state:", states.previous, "→", states.current);
});

echo.connector.pusher.connection.bind("unavailable", () => {
    console.error("⚠️ WebSocket connection unavailable");
});

echo.connector.pusher.connection.bind("failed", () => {
    console.error("💀 WebSocket connection failed - check Reverb server");
});

export default echo;