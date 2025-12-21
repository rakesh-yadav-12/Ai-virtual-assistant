import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { userDataContext } from "../context/UserContext.jsx";
import axios from "axios";

function Customize2() {
  const { serverUrl, userData, setUserData } = useContext(userDataContext);
  const navigate = useNavigate();

  const [assistantName, setAssistantName] = useState(
    userData?.assistantName || userData?.name + "'s Assistant" || ""
  );
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Track if already saved

  // Load selected image on component mount
  useEffect(() => {
    console.log("📥 Loading assistant image data...");
    
    // Priority 1: Check localStorage for most recent selection
    const savedImage = localStorage.getItem('selectedAssistantImage');
    if (savedImage) {
      console.log("✅ Found image in localStorage");
      setSelectedImage(savedImage);
      setPreviewImage(savedImage);
      return;
    }
    
    // Priority 2: Check userData from backend
    if (userData?.assistantImage) {
      console.log("✅ Found image in userData");
      setSelectedImage(userData.assistantImage);
      setPreviewImage(userData.assistantImage);
      
      // Also save to localStorage for consistency
      localStorage.setItem('selectedAssistantImage', userData.assistantImage);
      return;
    }
    
    // Priority 3: Use default
    console.log("⚠️ No saved image found, using default");
    const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%233b82f6'/%3E%3Ccircle cx='100' cy='80' r='40' fill='white'/%3E%3Ccircle cx='80' cy='70' r='8' fill='black'/%3E%3Ccircle cx='120' cy='70' r='8' fill='black'/%3E%3Cpath d='M80,120 Q100,140 120,120' stroke='black' stroke-width='5' fill='none'/%3E%3C/svg%3E";
    setSelectedImage(defaultImage);
    setPreviewImage(defaultImage);
  }, [userData]);

  // Update save status when userData changes
  useEffect(() => {
    if (userData?.assistantName && userData?.assistantImage) {
      setIsSaved(true);
    }
  }, [userData]);

  const handleSaveOnly = async () => {
    if (!assistantName.trim()) {
      alert("Please enter a name for your assistant");
      return;
    }

    setLoading(true);
    setSaveSuccess(false);

    try {
      const formData = new FormData();
      formData.append("assistantName", assistantName.trim());

      // Check what type of image we have
      console.log("📤 Preparing image data for upload...");
      
      if (selectedImage) {
        if (selectedImage.startsWith('data:image')) {
          console.log("🖼️ Processing base64 custom image");
          try {
            // Convert base64 to blob
            const response = await fetch(selectedImage);
            const blob = await response.blob();
            
            // Create a file from blob
            const file = new File([blob], 'assistant-image.png', { 
              type: 'image/png',
              lastModified: Date.now()
            });
            formData.append("assistantImage", file);
            console.log("✅ Custom image attached to form data");
          } catch (error) {
            console.error("❌ Error converting image:", error);
            alert("Error processing image. Please try again.");
            setLoading(false);
            return;
          }
        } else if (selectedImage.startsWith('http')) {
          // It's a URL from default images
          console.log("🔗 Using image URL");
          formData.append("imageUrl", selectedImage);
        } else {
          console.log("⚠️ No valid image to upload, using default");
          // Use default image
          const defaultImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%233b82f6'/%3E%3Ccircle cx='100' cy='80' r='40' fill='white'/%3E%3Ccircle cx='80' cy='70' r='8' fill='black'/%3E%3Ccircle cx='120' cy='70' r='8' fill='black'/%3E%3Cpath d='M80,120 Q100,140 120,120' stroke='black' stroke-width='5' fill='none'/%3E%3C/svg%3E";
          const response = await fetch(defaultImage);
          const blob = await response.blob();
          const file = new File([blob], 'default-assistant.png', { type: 'image/svg+xml' });
          formData.append("assistantImage", file);
        }
      }

      console.log("🚀 Uploading assistant data to server...");
      
      const response = await axios.post(
        `${serverUrl}/api/user/update`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000 // 30 second timeout
        }
      );

      console.log("✅ Server response received:", response.data);

      if (response.data.user) {
        setUserData(response.data.user);
        setIsSaved(true);
        
        // Update localStorage with the new assistant image
        if (response.data.user.assistantImage) {
          localStorage.setItem('selectedAssistantImage', response.data.user.assistantImage);
          console.log("💾 Updated localStorage with new assistant image");
        } else if (selectedImage) {
          localStorage.setItem('selectedAssistantImage', selectedImage);
          console.log("💾 Updated localStorage with selected image");
        }
        
        // Update assistant name in localStorage
        localStorage.setItem('assistantName', response.data.user.assistantName);
        
        setSaveSuccess(true);
        alert("✅ Assistant saved successfully! You can continue customizing or launch when ready.");
      }
    } catch (error) {
      console.error("❌ Update error:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.status === 413) {
        alert("Image is too large. Please select an image smaller than 5MB.");
      } else if (error.response?.status === 415) {
        alert("Unsupported image format. Please use JPEG, PNG, or WebP.");
      } else if (error.code === 'ECONNABORTED') {
        alert("Request timed out. Please check your connection and try again.");
      } else {
        alert(error.response?.data?.message || "Failed to save assistant. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLaunch = () => {
    // Navigate to home after saving
    navigate("/");
  };

  const handleSaveAndLaunch = async () => {
    // If already saved, just launch
    if (isSaved) {
      handleLaunch();
      return;
    }
    
    // Otherwise save first, then launch
    await handleSaveOnly();
    
    // Only navigate if save was successful
    if (saveSuccess) {
      setTimeout(() => {
        handleLaunch();
      }, 500);
    }
  };

  const handleSkip = () => {
    // Navigate to home without saving
    navigate("/");
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setSelectedImage(imageData);
      setPreviewImage(imageData);
      
      // Save to localStorage immediately
      localStorage.setItem('selectedAssistantImage', imageData);
      console.log("💾 Saved new image to localStorage");
      
      // Reset saved status since image changed
      if (isSaved) {
        setIsSaved(false);
        setSaveSuccess(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUseCurrent = () => {
    // Use the currently selected/previewed image
    if (previewImage) {
      setSelectedImage(previewImage);
      localStorage.setItem('selectedAssistantImage', previewImage);
      alert("✅ Current image selected for assistant");
      
      // Reset saved status since image changed
      if (isSaved) {
        setIsSaved(false);
        setSaveSuccess(false);
      }
    }
  };

  // Reset saved status when name changes
  useEffect(() => {
    if (isSaved && assistantName !== userData?.assistantName) {
      setIsSaved(false);
      setSaveSuccess(false);
    }
  }, [assistantName, isSaved, userData?.assistantName]);

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="glass rounded-3xl p-6 md:p-8 shadow-2xl">
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white">1</span>
              </div>
              <div className="w-16 h-1 bg-blue-500"></div>
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white">2</span>
              </div>
              <div className="w-16 h-1 bg-gray-600"></div>
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-white/70">3</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Name Your <span className="gradient-text">Assistant</span>
            </h1>
            <p className="text-white/70">Give your assistant a unique name and finalize its appearance</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column - Image */}
            <div className="lg:w-1/2">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-lg font-semibold text-white/80">
                    Assistant Avatar Preview
                  </label>
                  <button
                    onClick={handleUseCurrent}
                    className="text-sm bg-white/10 hover:bg-white/15 px-3 py-1 rounded-lg transition"
                  >
                    Use This
                  </button>
                </div>
                
                <div className="relative group">
                  <div className="w-full h-72 md:h-80 rounded-2xl overflow-hidden border-4 border-blue-500/50 shadow-2xl bg-gradient-to-br from-blue-500/10 to-purple-500/10">
                    {previewImage ? (
                      <img 
                        src={previewImage} 
                        alt="Assistant preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.error("Error loading preview image");
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%233b82f6'/%3E%3Ccircle cx='100' cy='80' r='40' fill='white'/%3E%3Ccircle cx='80' cy='70' r='8' fill='black'/%3E%3Ccircle cx='120' cy='70' r='8' fill='black'/%3E%3Cpath d='M80,120 Q100,140 120,120' stroke='black' stroke-width='5' fill='none'/%3E%3C/svg%3E";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🤖</div>
                          <p className="text-white/60">Loading image...</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Overlay with image info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-white text-sm font-medium">
                        {selectedImage?.startsWith('data:') ? 'Custom Uploaded Image' : 'Default Avatar'}
                      </p>
                      <p className="text-white/60 text-xs truncate">
                        {selectedImage?.substring(0, 60)}...
                      </p>
                    </div>
                  </div>
                  
                  {/* Change Image Button */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl flex flex-col items-center justify-center gap-3">
                    <label className="btn-primary cursor-pointer px-6 py-3 flex items-center gap-2">
                      <span>🖼️</span>
                      <span>Change Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <p className="text-white/80 text-sm">Click to upload a new image</p>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => navigate("/customize")}
                    className="btn-secondary w-full py-2.5"
                  >
                    ← Choose Different Image
                  </button>
                </div>
              </div>
              
              {/* Current Image Info */}
              <div className="bg-white/5 rounded-xl p-4">
                <h4 className="font-medium mb-2 text-white/80">Current Image Info</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Type:</span>
                    <span className="text-white">
                      {selectedImage?.startsWith('data:') ? 'Custom Upload' : 'Default'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Status:</span>
                    <span className={isSaved ? "text-green-400" : "text-yellow-400"}>
                      {isSaved ? "✓ Saved" : "Not Saved"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="lg:w-1/2">
              <div className="space-y-6">
                {/* Assistant Name Input */}
                <div className="bg-white/5 rounded-xl p-5">
                  <label className="block text-lg font-semibold mb-3 text-white/80">
                    Assistant Name *
                  </label>
                  <input
                    type="text"
                    value={assistantName}
                    onChange={(e) => setAssistantName(e.target.value)}
                    className="input-field text-lg py-3"
                    placeholder="e.g., Jarvis, Alexa, Cortana"
                    required
                  />
                  <p className="text-sm text-white/60 mt-2">
                    This name will be used to activate your assistant. Example: "Hey {assistantName || 'Assistant'}..."
                  </p>
                </div>

                {/* Name Suggestions */}
                <div className="bg-white/5 rounded-xl p-5">
                  <h3 className="font-semibold mb-3 text-white/80">Name Suggestions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Athena', 'Nova', 'Orion', 'Luna', 'Phoenix', 'Zenith', 'Aura', 'Nexus'].map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setAssistantName(name)}
                        className="px-3 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition flex items-center justify-center gap-1"
                      >
                        <span>✨</span>
                        <span>{name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-white/60 mt-3">
                    Or create your own unique name!
                  </p>
                </div>

                {/* Preview Card */}
                <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-5 border border-blue-500/30">
                  <h3 className="font-semibold mb-3 text-white/80">Preview</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500/50">
                      <img 
                        src={previewImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='200' height='200' fill='%233b82f6'/%3E%3Ccircle cx='100' cy='80' r='40' fill='white'/%3E%3Ccircle cx='80' cy='70' r='8' fill='black'/%3E%3Ccircle cx='120' cy='70' r='8' fill='black'/%3E%3Cpath d='M80,120 Q100,140 120,120' stroke='black' stroke-width='5' fill='none'/%3E%3C/svg%3E"}
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-white">Your Assistant:</p>
                      <p className="text-blue-300 text-lg font-bold">{assistantName || "Your Assistant Name"}</p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-white/60">
                    {isSaved ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <span>✓</span>
                        <span>Your assistant has been saved</span>
                      </div>
                    ) : saveSuccess ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <span>✓</span>
                        <span>Saved! You can now launch or continue customizing</span>
                      </div>
                    ) : (
                      "Make sure to save your changes before launching"
                    )}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex flex-col gap-4">
                    {/* Save Button */}
                    <button
                      onClick={handleSaveOnly}
                      disabled={loading || !assistantName.trim()}
                      className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 ${
                        loading 
                          ? 'bg-blue-500/50 cursor-not-allowed' 
                          : saveSuccess
                            ? 'bg-green-500 hover:bg-green-600'
                            : isSaved
                              ? 'bg-green-500/80 hover:bg-green-600'
                              : 'btn-primary'
                      }`}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </span>
                      ) : isSaved ? (
                        <span className="flex items-center justify-center gap-2">
                          <span>✓</span>
                          Saved Successfully
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <span>💾</span>
                          Save Assistant
                        </span>
                      )}
                    </button>

                    {/* Bottom Row: Skip and Launch */}
                    <div className="flex flex-col sm:flex-row gap-4">
                      
                      <button
                        onClick={handleLaunch}
                        
                        disabled={!isSaved && !saveSuccess}
                        className={`px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 flex-1 ${
                          isSaved || saveSuccess
                            ? 'bg-purple-600 hover:bg-purple-700'
                            : 'bg-purple-500/50 cursor-not-allowed'
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span className="text-lg">←</span>
                          {isSaved || saveSuccess ? "Back" : "Save First"}
                        </span>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-center text-sm text-white/60 mt-3">
                    {isSaved 
                      ? "Your assistant is ready to launch!"
                      : saveSuccess
                      ? "Great! Your assistant is saved. You can launch now."
                      : assistantName.trim() 
                      ? `Save "${assistantName}" first, then launch your assistant`
                      : "Enter a name to save your assistant"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-blue-400 text-lg mb-1">💾</div>
                <p className="text-white/70">Save your assistant first</p>
              </div>
              <div className="text-center">
                <div className="text-green-400 text-lg mb-1">✓</div>
                <p className="text-white/70">Changes saved to your account</p>
              </div>
              <div className="text-center">
                <div className="text-purple-400 text-lg mb-1">🚀</div>
                <p className="text-white/70">Launch when you're ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Customize2;
