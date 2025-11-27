import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import UserProfile from "./pages/UserProfile";
import CustomerChat from "./pages/CustomerChat";  // ⬅ ADD THIS

import 'react-chat-widget/lib/styles.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/userprofile" element={<UserProfile />} />

        {/* Customer Chat Route */}
        <Route path="/customerchat" element={<CustomerChat />} />


      </Routes>
    </Router>
  );
}

export default App;
