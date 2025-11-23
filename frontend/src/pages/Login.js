import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import API from "../api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setErrors({});
    setLoading(true);

    if (!form.email || !form.password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      console.log("🔐 Attempting login...");
      
      const res = await API.post("/login", {
        email: form.email.trim(),
        password: form.password
      });

      console.log("✅ Login response:", res.data);

      if (res.data.token && res.data.user) {
        const { token, user } = res.data;

        // Store authentication data
        if (token) {
          sessionStorage.setItem("token", token);
          localStorage.setItem("token", token);
          console.log("✅ Token stored:", token);
        }
        
        if (user) {
          sessionStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("user", JSON.stringify(user));
          console.log("✅ User stored:", user);
        }

        console.log("🚀 Redirecting to /messages");
        
        
        navigate("/messages"); 
      } else {
        setError(res.data.message || "Login failed");
        setLoading(false);
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors || {});
        setError("Please check your input");
      } else if (err.response?.status === 401) {
        setError("Invalid email or password");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-800 to-indigo-900 text-white p-10">
          <h1 className="text-5xl font-extrabold mb-4">Welcome Back</h1>
          <p className="text-center opacity-90 max-w-sm text-lg">
            Login to access your astrological insights and cosmic connections ✨
          </p>
          <div className="mt-10 text-7xl animate-pulse">🌟</div>
        </div>

        {/* Right Side - Login Form */}
        <div className="p-8 md:p-12 bg-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign In</h2>
          <p className="text-gray-600 mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                required
                autoComplete="current-password"
              />
              <span
                className="absolute right-4 top-11 cursor-pointer text-gray-600 hover:text-gray-800 transition"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </span>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">
                  {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium text-lg transition-all disabled:bg-indigo-400 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging in...
                </span>
              ) : (
                "Login"
              )}
            </button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to Astro?</span>
              </div>
            </div>

            {/* Register Link */}
            <p className="text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline transition"
              >
                Create one now
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}