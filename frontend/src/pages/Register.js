import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import API from "../api";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    birthdate: "",
    birthtime: "",
    gender: "",
    temp_country: "",
    temp_city: "",
    temp_street: "",
    perm_country: "",
    perm_city: "",
    perm_street: "",
    password: "",
    confirm_password: "",
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showCPassword, setShowCPassword] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (errors[name]) {
      setErrors({ ...errors, [name]: undefined });
    }
    
    if (error) setError("");
  };

  const togglePass = () => setShowPassword(!showPassword);
  const toggleCPass = () => setShowCPassword(!showCPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setErrors({});
    setLoading(true);

    if (!formData.name.trim() || !formData.email.trim() || !formData.password || !formData.confirm_password) {
      setError("Please fill in all required fields");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setErrors({ confirm_password: "Passwords do not match" });
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setErrors({ password: "Password must be at least 8 characters" });
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.confirm_password,
        gender: formData.gender || "male",
        dob_nep: formData.birthdate || "2000-01-01",
        birth_time: formData.birthtime || "12:00:00",
        country: formData.perm_country || formData.temp_country || "Nepal",
        city: formData.perm_city || formData.temp_city || "Kathmandu",
        street: formData.perm_street || formData.temp_street || "Street",
        role: "customer" // FIXED: Added default role
      };

      console.log("📤 Registering user with payload:", payload);

      const res = await API.post("/register", payload);

      console.log("✅ Registration response:", res.data);

      if (res.data.success || res.data.token) {
        const { token, user } = res.data;

        if (token) {
          localStorage.setItem("token", token);
          console.log("✅ Token stored successfully");
        }
        
        if (user) {
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("role", user.role || "customer");
          console.log("✅ User data stored:", user);
        }
        
        setSuccess("Registration successful! Redirecting...");
        
        setTimeout(() => {
          navigate("/customerchat", { replace: true });
        }, 1500);
      } else {
        setError(res.data.message || "Registration failed");
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      console.error("❌ Error response:", err.response?.data);
      
      if (err.response?.status === 422) {
        const validationErrors = err.response.data.errors || {};
        setErrors(validationErrors);
        
        const firstError = Object.values(validationErrors)[0];
        setError(Array.isArray(firstError) ? firstError[0] : "Please check the form for errors");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Registration failed. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-5xl bg-white shadow-lg rounded-2xl p-10 grid grid-cols-1 md:grid-cols-2 gap-10"
      >
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-700 mb-4">Register</h2>

          {error && (
            <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded-lg text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block font-medium mb-1">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">
                {Array.isArray(errors.name) ? errors.name[0] : errors.name}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Email *</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              required
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">
                {Array.isArray(errors.email) ? errors.email[0] : errors.email}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium mb-1">Birth Date</label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
              {errors.dob_nep && (
                <p className="text-red-600 text-sm mt-1">
                  {Array.isArray(errors.dob_nep) ? errors.dob_nep[0] : errors.dob_nep}
                </p>
              )}
            </div>

            <div>
              <label className="block font-medium mb-1">Birth Time</label>
              <input
                type="time"
                name="birthtime"
                value={formData.birthtime}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
              {errors.birth_time && (
                <p className="text-red-600 text-sm mt-1">
                  {Array.isArray(errors.birth_time) ? errors.birth_time[0] : errors.birth_time}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-1">Gender</label>
            <select
              name="gender"
              onChange={handleChange}
              value={formData.gender}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && (
              <p className="text-red-600 text-sm mt-1">
                {Array.isArray(errors.gender) ? errors.gender[0] : errors.gender}
              </p>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1">Photo (optional)</label>
            <input
              type="file"
              name="photo"
              className="w-full border rounded-lg p-3 bg-gray-50"
            />
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Temporary Address
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Country"
                name="temp_country"
                value={formData.temp_country}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="City"
                name="temp_city"
                value={formData.temp_city}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Street"
                name="temp_street"
                value={formData.temp_street}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-700">
              Permanent Address
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Country"
                name="perm_country"
                value={formData.perm_country}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="City"
                name="perm_city"
                value={formData.perm_city}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Street"
                name="perm_street"
                value={formData.perm_street}
                onChange={handleChange}
                className="border rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {errors.country && (
              <p className="text-red-600 text-sm">
                {Array.isArray(errors.country) ? errors.country[0] : errors.country}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="block font-medium mb-1">Password *</label>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span
                onClick={togglePass}
                className="absolute right-4 top-11 cursor-pointer text-gray-600"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              {errors.password && (
                <p className="text-red-600 text-sm mt-1">
                  {Array.isArray(errors.password) ? errors.password[0] : errors.password}
                </p>
              )}
            </div>

            <div className="relative">
              <label className="block font-medium mb-1">Confirm Password *</label>
              <input
                type={showCPassword ? "text" : "password"}
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                className="w-full border rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span
                onClick={toggleCPass}
                className="absolute right-4 top-11 cursor-pointer text-gray-600"
              >
                {showCPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
              {errors.confirm_password && (
                <p className="text-red-600 text-sm mt-1">{errors.confirm_password}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Submit"}
          </button>

          <p className="text-center text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 font-semibold">
              Login
            </Link>
          </p>

          {success && (
            <div className="bg-green-100 border border-green-300 text-green-800 p-3 rounded-lg text-center font-medium">
              {success}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}