import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext.jsx";
import axios from "axios";

function SignUp() {
  const { setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert("Please enter your name");
      return;
    }
    
    if (!formData.email.trim()) {
      alert("Please enter your email");
      return;
    }
    
    if (!formData.password) {
      alert("Please enter a password");
      return;
    }
    
    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        "https://ai-virtual-backend.onrender.com/api/auth/signup",
        {
          name: formData.name,
          email: formData.email,
          password: formData.password
        },
        { withCredentials: true }
      );

      if (response.data.user) {
        setUserData(response.data.user);
        alert("Account created successfully!");
        navigate("/customize");
      }
    } catch (error) {
      console.error("Signup error:", error);
      alert(error.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Professional Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-slate-900 to-black">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1.5s'}}></div>
        <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}}></div>
        
        {/* Diamond Grid Pattern */}
        <div className="absolute inset-0 bg-diamond-pattern opacity-5"></div>
        
        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-purple-400/40 rounded-full animate-float-slow"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${15 + Math.random() * 25}s`
              }}
            ></div>
          ))}
        </div>
        
        {/* Dynamic Wave Lines */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
          <svg className="absolute bottom-0 w-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
                  opacity=".25" 
                  className="fill-current text-purple-500/20"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35,6.36,119.13-6.25,32-10.63,60.58-26.18,92-34.88,21.23-5.84,43.38-10,65.5-10.46,49.18-1.21,97.38,10.21,145,25.22,30.62,9.68,59.78,21.45,87.58,35.13C1145,59.38,1200,0,1200,0Z" 
                  opacity=".5" 
                  className="fill-current text-pink-500/20"></path>
          </svg>
        </div>
        
        {/* Light Beam Effect */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="glass rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Create Your <span className="gradient-text">Virtual Assistant</span>
            </h1>
            <p className="text-white/70">Start your AI-powered journey</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Create a password (min. 6 chars)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input-field pr-12"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-white/70">
              Already have an account?{" "}
              <Link to="/signin" className="text-blue-400 hover:text-blue-300 font-medium">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx="true">{`
        @keyframes float-slow {
          0%, 100% { 
            transform: translateY(0) translateX(0) rotate(0deg); 
            opacity: 0.4;
          }
          25% { 
            transform: translateY(-15px) translateX(5px) rotate(90deg);
            opacity: 0.6;
          }
          50% { 
            transform: translateY(0) translateX(10px) rotate(180deg);
            opacity: 0.4;
          }
          75% { 
            transform: translateY(15px) translateX(5px) rotate(270deg);
            opacity: 0.6;
          }
        }
        
        .animate-float-slow {
          animation: float-slow ease-in-out infinite;
        }
        
        .bg-diamond-pattern {
          background-image: 
            linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%);
          background-size: 40px 40px;
          background-position: 0 0, 0 20px, 20px -20px, -20px 0px;
        }
        
        @keyframes wave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        
        .animate-wave {
          animation: wave 20s linear infinite;
        }
      `}</style>
    </div>
  );
}

export default SignUp;
