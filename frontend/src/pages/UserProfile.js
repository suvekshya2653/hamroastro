import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api";
import { FaUser, FaCamera, FaCalendar, FaClock, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHome, FaArrowLeft } from "react-icons/fa";

export default function UserProfile() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  
  const [form, setForm] = useState({
    photo: null,
    name: "",
    dob_nep: "",
    birth_time: "",
    birth_place: "",
    temp_address: "",
    phone: "",
    email: "",
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Get current user from localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user) {
          navigate("/login");
          return;
        }
        setCurrentUser(user);

        // Try to fetch existing profile from /user endpoint
        const response = await API.get("/user");
        const userData = response.data;

        console.log("Loaded user data:", userData);

        // Pre-fill form with existing data
        setForm({
          photo: null,
          name: userData.name || "",
          dob_nep: userData.dob_nep || "",
          birth_time: userData.birth_time || "",
          birth_place: userData.birth_place || "",
          temp_address: userData.temp_address || "",
          phone: userData.phone || "",
          email: userData.email || "",
        });

        // Set photo preview if exists
        if (userData.photo) {
          setPhotoPreview(`http://localhost:8000/storage/${userData.photo}`);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading profile:", error);
        
        // If profile doesn't exist yet, just use registration data
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          setForm(prev => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
          }));
        }
        
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm({ ...form, photo: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const data = new FormData();
    Object.keys(form).forEach((key) => {
      if (form[key] !== null && form[key] !== "") {
        data.append(key, form[key]);
      }
    });

    try {
      const response = await API.post("/profile/update", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      console.log("Profile saved:", response.data);
      
      // Update localStorage with new user data
      const updatedUser = { ...currentUser, ...response.data.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      alert("✅ Profile saved successfully!");
      navigate("/messages"); 
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("❌ Error saving profile: " + (error.response?.data?.message || error.message));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#111b21]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a884]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111b21] text-white">
      {/* Header */}
      <div className="bg-[#202c33] p-4 flex items-center gap-3 sticky top-0 z-10">
        <FaArrowLeft 
          className="text-xl cursor-pointer hover:text-[#00a884]" 
          onClick={() => navigate("/messages")}
        />
        <h1 className="text-xl font-semibold">Profile</h1>
      </div>

      {/* Profile Form */}
      <div className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Photo Upload Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-[#2a3942] flex items-center justify-center overflow-hidden">
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FaUser className="text-5xl text-gray-500" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-[#00a884] p-3 rounded-full cursor-pointer hover:bg-[#06cf9c] transition">
                <FaCamera className="text-white" />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handlePhoto}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-gray-400 text-sm mt-3">Click camera to upload photo</p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <FaUser /> Full Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              placeholder="Enter your full name"
            />
          </div>

          {/* Date of Birth (Nepali) */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <FaCalendar /> Date of Birth (Nepali BS) <span className="text-red-500">*</span>
            </label>
            <input
              name="dob_nep"
              value={form.dob_nep}
              onChange={handleChange}
              required
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              placeholder="e.g., 2081-05-12"
            />
          </div>

          {/* Birth Time */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <FaClock /> Birth Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="birth_time"
              value={form.birth_time}
              onChange={handleChange}
              required
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
            />
          </div>

          {/* Place of Birth */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <FaMapMarkerAlt /> Place of Birth <span className="text-red-500">*</span>
            </label>
            <input
              name="birth_place"
              value={form.birth_place}
              onChange={handleChange}
              required
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              placeholder="e.g., Kathmandu, Nepal"
            />
          </div>

          {/* Temporary Address */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <FaHome /> Temporary Address <span className="text-red-500">*</span>
            </label>
            <input
              name="temp_address"
              value={form.temp_address}
              onChange={handleChange}
              required
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              placeholder="Enter your current address"
            />
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <FaPhone /> Phone Number
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884]"
              placeholder="e.g., +977 9812345678"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-400">
              <FaEnvelope /> Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-[#2a3942] text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00a884] disabled:opacity-50"
              placeholder="your.email@example.com"
              disabled
            />
            <p className="text-xs text-gray-500">Email cannot be changed (from registration)</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#00a884] hover:bg-[#06cf9c] text-white font-semibold rounded-lg px-6 py-3 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}