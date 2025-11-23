import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";  // Add this import
import Register from "./pages/Register";
import Login from "./pages/Login";
import Messages from "./pages/Messages";
import UserProfile from "./pages/UserProfile.js";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />  {/* Add this line */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/userprofile" element={<UserProfile />} />
      </Routes>
    </Router>
  );
}

export default App;