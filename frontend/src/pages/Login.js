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
    const res = await API.post("/login", {
      email: form.email.trim(),
      password: form.password,
    });

    if (!res.data.token || !res.data.user) {
      setError("Invalid login response");
      setLoading(false);
      return;
    }

    const { token, user } = res.data;

    console.log("Login:", user);

    // STORE ONLY IN LOCALSTORAGE
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    // ROLE CHECK
    const isAdmin = user.role && user.role.toLowerCase() === "admin";
    const role = isAdmin ? "admin" : "customer";

    localStorage.setItem("role", role);

    // REDIRECT
    if (isAdmin) {
      navigate("/messages");
    } else {
      navigate("/customerchat");
    }
  } catch (err) {
    console.error("Login error:", err);

    if (err.response?.status === 422) {
      setErrors(err.response.data.errors || {});
      setError("Please check your input.");
    } else if (err.response?.status === 401) {
      setError("Invalid email or password.");
    } else {
      setError("Login failed. Please try again.");
    }
  }

  setLoading(false);
};


  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-700">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 overflow-hidden">

        <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-indigo-800 via-purple-800 to-indigo-900 text-white p-10">
          <h1 className="text-5xl font-extrabold mb-4">Welcome Back</h1>
          <p className="text-center opacity-90 max-w-sm text-lg">
            Login to access your astrological insights ✨
          </p>
          <div className="mt-10 text-7xl animate-pulse">🌟</div>
        </div>

        <div className="p-8 md:p-12 bg-white flex flex-col justify-center">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">Sign In</h2>
          <p className="text-gray-600 mb-8">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {errors.email && (
                <p className="text-red-600 text-sm mt-1">
                  {Array.isArray(errors.email) ? errors.email[0] : errors.email}
                </p>
              )}
            </div>

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
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <span
                className="absolute right-4 top-11 cursor-pointer text-gray-600"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </span>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">
                  {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium text-lg transition disabled:bg-indigo-400"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">New to Astro?</span>
              </div>
            </div>

            <p className="text-center text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline"
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