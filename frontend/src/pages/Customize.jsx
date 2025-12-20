import React, { useState, useRef, useContext, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card.jsx";
import { userDataContext } from "../context/userContext.jsx";

// Default assets images - using SVG data URLs
const defaultImages = [
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%233b82f6;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%231d4ed8;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23grad1)'/%3E%3Ccircle cx='100' cy='80' r='35' fill='white'/%3E%3Ccircle cx='80' cy='70' r='7' fill='%231F2937'/%3E%3Ccircle cx='120' cy='70' r='7' fill='%231F2937'/%3E%3Cpath d='M80,115 Q100,135 120,115' stroke='%231F2937' stroke-width='5' fill='none'/%3E%3Ccircle cx='100' cy='100' r='3' fill='%231F2937'/%3E%3C/svg%3E",
  
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%2310b981;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%23047352;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23grad2)'/%3E%3Ccircle cx='100' cy='80' r='35' fill='white'/%3E%3Ccircle cx='85' cy='70' r='7' fill='%231F2937'/%3E%3Ccircle cx='115' cy='70' r='7' fill='%231F2937'/%3E%3Cpath d='M85,120 Q100,145 115,120' stroke='%231F2937' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
  
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad3' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%238b5cf6;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%237c3aed;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23grad3)'/%3E%3Ccircle cx='100' cy='80' r='35' fill='white'/%3E%3Ccircle cx='75' cy='70' r='7' fill='%231F2937'/%3E%3Ccircle cx='125' cy='70' r='7' fill='%231F2937'/%3E%3Cpath d='M80,125 Q100,105 120,125' stroke='%231F2937' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3Ccircle cx='100' cy='90' r='2' fill='%231F2937'/%3E%3C/svg%3E",
  
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad4' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23f59e0b;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%23d97706;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23grad4)'/%3E%3Ccircle cx='100' cy='80' r='35' fill='white'/%3E%3Ccircle cx='82' cy='68' r='7' fill='%231F2937'/%3E%3Ccircle cx='118' cy='68' r='7' fill='%231F2937'/%3E%3Cpath d='M85,115 Q100,125 115,115' stroke='%231F2937' stroke-width='5' fill='none'/%3E%3Ccircle cx='100' cy='95' r='3' fill='%231F2937'/%3E%3C/svg%3E",
  
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad5' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ef4444;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%23dc2626;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23grad5)'/%3E%3Ccircle cx='100' cy='80' r='35' fill='white'/%3E%3Ccircle cx='78' cy='72' r='7' fill='%231F2937'/%3E%3Ccircle cx='122' cy='72' r='7' fill='%231F2937'/%3E%3Cpath d='M85,120 Q100,100 115,120' stroke='%231F2937' stroke-width='5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E",
  
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cdefs%3E%3ClinearGradient id='grad6' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%230ea5e9;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%230287c7;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='200' height='200' fill='url(%23grad6)'/%3E%3Ccircle cx='100' cy='80' r='35' fill='white'/%3E%3Ccircle cx='83' cy='65' r='7' fill='%231F2937'/%3E%3Ccircle cx='117' cy='65' r='7' fill='%231F2937'/%3E%3Cpath d='M85,110 Q100,130 115,110' stroke='%231F2937' stroke-width='5' fill='none'/%3E%3Ccircle cx='100' cy='85' r='3' fill='%231F2937'/%3E%3C/svg%3E"
];

// Helper function to validate and compress image if needed
const compressImage = (base64Data, maxSizeKB = 100) => {
  return new Promise((resolve) => {
    if (base64Data.length < maxSizeKB * 1024) {
      resolve(base64Data);
      return;
    }

    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;
      const maxDimension = 512;
      
      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Draw with high quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Get compressed base64 with quality based on original size
      const quality = base64Data.length > 1024 * 1024 ? 0.7 : 0.85;
      const compressedBase64 = canvas.toDataURL('image/webp', quality);
      
      console.log(`✅ Image compressed: ${Math.round(base64Data.length / 1024)}KB → ${Math.round(compressedBase64.length / 1024)}KB`);
      resolve(compressedBase64);
    };
    
    img.onerror = function() {
      console.warn("Image compression failed, using original");
      resolve(base64Data);
    };
    
    img.src = base64Data;
  });
};

// Helper function to generate unique image ID
const generateImageId = (image) => {
  if (!image) return '';
  // Create a hash from the image data
  const str = image.substring(0, 100) + image.length;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `img_${Math.abs(hash)}`;
};

function Customize() {
  const navigate = useNavigate();
  const { userData, setUserData } = useContext(userDataContext);
  const fileInputRef = useRef(null);

  // Initialize with localStorage data or defaults
  const [customImages, setCustomImages] = useState(() => {
    try {
      const saved = localStorage.getItem('customAssistantImages');
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      // Filter out invalid images and remove duplicates
      const uniqueImages = [];
      const seenIds = new Set();
      
      parsed.forEach(img => {
        if (img && (img.startsWith('data:image') || img.startsWith('http'))) {
          const imgId = generateImageId(img);
          if (!seenIds.has(imgId)) {
            seenIds.add(imgId);
            uniqueImages.push(img);
          } else {
            console.log("⚠️ Removing duplicate image");
          }
        }
      });
      
      console.log(`✅ Loaded ${uniqueImages.length} unique custom images`);
      return uniqueImages;
    } catch (error) {
      console.error("Error loading custom images:", error);
      return [];
    }
  });

  // Get all images (default + custom)
  const allImages = [...defaultImages, ...customImages];
  console.log("📊 Total images:", allImages.length, "Default:", defaultImages.length, "Custom:", customImages.length);

  // Initialize selectedIndex by finding the current image
  const [selectedIndex, setSelectedIndex] = useState(() => {
    try {
      // First check if user has a saved image in localStorage
      const savedImage = localStorage.getItem('selectedAssistantImage');
      console.log("🔄 Initializing selection, saved image:", savedImage?.substring(0, 50));
      
      if (savedImage) {
        // Try to find exact match first
        const index = allImages.findIndex(img => img === savedImage);
        if (index !== -1) {
          console.log("✅ Found exact match at index:", index);
          return index;
        }
        
        // Try to find similar image (in case of compression differences)
        const savedId = generateImageId(savedImage);
        const similarIndex = allImages.findIndex(img => {
          const imgId = generateImageId(img);
          return imgId === savedId;
        });
        
        if (similarIndex !== -1) {
          console.log("✅ Found similar image at index:", similarIndex);
          return similarIndex;
        }
      }
      
      // Then check userData context
      if (userData?.assistantImage) {
        const index = allImages.findIndex(img => img === userData.assistantImage);
        if (index !== -1) {
          console.log("✅ Found image in userData at index:", index);
          return index;
        }
      }
      
      // Default to first image
      console.log("⚠️ No saved image found, using default (index 0)");
      return 0;
    } catch (error) {
      console.error("Error initializing selected index:", error);
      return 0;
    }
  });

  const selectedImage = allImages[selectedIndex];
  const isCustomImageSelected = selectedIndex >= defaultImages.length;

  // Function to show toast message
  const showToast = useCallback((message, type = 'success') => {
    // Remove existing toasts
    const existingToasts = document.querySelectorAll('.custom-toast');
    existingToasts.forEach(toast => toast.remove());
    
    const toast = document.createElement('div');
    toast.className = `custom-toast fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 animate-fade-in ${
      type === 'success' ? 'bg-green-500 text-white' : 
      type === 'error' ? 'bg-red-500 text-white' : 
      'bg-blue-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('animate-fade-out');
        setTimeout(() => {
          if (toast.parentNode) document.body.removeChild(toast);
        }, 300);
      }
    }, 3000);
  }, []);

  // Update localStorage when selected image changes
  useEffect(() => {
    if (selectedImage && selectedIndex >= 0) {
      console.log("💾 Saving selected image to localStorage:", {
        index: selectedIndex,
        type: isCustomImageSelected ? 'custom' : 'default',
        preview: selectedImage.substring(0, 50)
      });
      
      try {
        localStorage.setItem('selectedAssistantImage', selectedImage);
        localStorage.setItem('selectedImageIndex', selectedIndex.toString());
        
        // Also update userData for immediate display
        if (userData) {
          setUserData(prev => ({
            ...prev,
            assistantImage: selectedImage
          }));
        }
        
        console.log("✅ Image saved successfully");
      } catch (error) {
        console.error("❌ Error saving image to localStorage:", error);
        showToast("Error saving selection", 'error');
      }
    }
  }, [selectedImage, selectedIndex, userData, setUserData, isCustomImageSelected, showToast]);

  // Load saved selection on component mount
  useEffect(() => {
    console.log("📥 Loading saved image on mount");
    
    const savedImage = localStorage.getItem('selectedAssistantImage');
    if (savedImage) {
      console.log("Found saved image:", savedImage.substring(0, 50) + "...");
      
      // Validate the saved image
      if (!savedImage.startsWith('data:image') && !savedImage.startsWith('http')) {
        console.error("Invalid saved image format, clearing");
        localStorage.removeItem('selectedAssistantImage');
        showToast("Invalid image format, resetting to default", 'error');
        return;
      }
      
      const index = allImages.findIndex(img => img === savedImage);
      if (index !== -1) {
        console.log("✅ Loaded saved image at index:", index);
        setSelectedIndex(index);
      } else {
        console.log("⚠️ Saved image not found in current images");
        // Don't auto-add to custom images to prevent duplicates
      }
    }
  }, [allImages, showToast]);

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      showToast('Please select a valid image file (JPEG, PNG, GIF, WebP, SVG)', 'error');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        let newImage = event.target.result;
        
        // Check for duplicate before processing
        const newImageId = generateImageId(newImage);
        const isDuplicate = customImages.some(img => generateImageId(img) === newImageId);
        
        if (isDuplicate) {
          showToast('This image has already been uploaded', 'error');
          return;
        }
        
        // Show loading state
        showToast('Processing image...', 'info');
        
        // Compress image if it's too large
        if (file.size > 100 * 1024) {
          console.log("Compressing image...");
          newImage = await compressImage(newImage, 200);
        }
        
        // Update state
        setCustomImages(prev => {
          const updated = [...prev, newImage];
          localStorage.setItem('customAssistantImages', JSON.stringify(updated));
          return updated;
        });
        
        // Select the new image
        const newIndex = defaultImages.length + customImages.length; // Use current length before adding
        setSelectedIndex(newIndex);
        
        console.log("✅ Custom image added and selected at index:", newIndex);
        
        // Save to localStorage
        localStorage.setItem('selectedAssistantImage', newImage);
        
        // Update userData context
        if (userData) {
          setUserData(prev => ({
            ...prev,
            assistantImage: newImage
          }));
        }
        
        // Show success message
        setTimeout(() => {
          showToast('✅ Custom image added successfully!', 'success');
        }, 500);
        
      } catch (error) {
        console.error("Error processing image:", error);
        showToast('Error processing image. Please try again.', 'error');
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      showToast('Error reading image file. Please try again.', 'error');
    };
    
    reader.readAsDataURL(file);

    // Reset file input
    e.target.value = '';
  };

  const handleImageSelect = (index) => {
    if (index === selectedIndex) return; // Don't re-select same image
    
    console.log("🖱️ Image selected at index:", index);
    setSelectedIndex(index);
  };

  const handleDeleteCustomImage = (customIndex) => {
    if (window.confirm("Are you sure you want to delete this custom image?")) {
      const updatedCustomImages = [...customImages];
      updatedCustomImages.splice(customIndex, 1);
      setCustomImages(updatedCustomImages);
      localStorage.setItem('customAssistantImages', JSON.stringify(updatedCustomImages));
      
      // If the deleted image was selected, select the first default image
      const deletedImageGlobalIndex = defaultImages.length + customIndex;
      if (selectedIndex === deletedImageGlobalIndex) {
        setSelectedIndex(0);
        localStorage.setItem('selectedAssistantImage', defaultImages[0]);
      } else if (selectedIndex > deletedImageGlobalIndex) {
        // Adjust selected index if it was after the deleted image
        setSelectedIndex(prev => prev - 1);
      }
      
      showToast('Image deleted successfully!', 'success');
    }
  };

  const handleSkip = () => {
    navigate("/");
  };

  const handleClearCustomImages = () => {
    if (window.confirm("Are you sure you want to clear all custom images?")) {
      setCustomImages([]);
      localStorage.removeItem('customAssistantImages');
      
      // If current selection is a custom image, reset to default
      if (selectedIndex >= defaultImages.length) {
        setSelectedIndex(0);
        localStorage.setItem('selectedAssistantImage', defaultImages[0]);
      }
      
      showToast('All custom images cleared!', 'success');
    }
  };

  // Calculate image size
  const getImageSize = (image) => {
    if (!image || !image.startsWith('data:image')) return 'N/A';
    try {
      const base64Length = image.split(',')[1]?.length || 0;
      const sizeInKB = Math.round((base64Length * 3) / 4 / 1024); // More accurate base64 to binary conversion
      return sizeInKB < 1024 ? `${sizeInKB}KB` : `${(sizeInKB / 1024).toFixed(1)}MB`;
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Customize Your Assistant Avatar
          </h1>
          <p className="text-white/70 text-center text-lg mb-8 max-w-2xl mx-auto">
            Select from beautiful default avatars or upload your own custom image
          </p>
          
          {/* Stats Bar */}
          <div className="glass rounded-2xl p-5 mb-6 backdrop-blur-lg border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-blue-400">{defaultImages.length}</div>
                <div className="text-white/70 text-sm">Default Avatars</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-purple-400">{customImages.length}</div>
                <div className="text-white/70 text-sm">Custom Images</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-green-400">{allImages.length}</div>
                <div className="text-white/70 text-sm">Total Options</div>
              </div>
              <div className="text-center p-3 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-pink-400">#{selectedIndex + 1}</div>
                <div className="text-white/70 text-sm">Selected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Panel - Image Grid */}
          <div className="lg:w-2/3">
            {/* Image Grid Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Choose an Avatar</h2>
              <div className="flex gap-3">
                {customImages.length > 0 && (
                  <button
                    onClick={handleClearCustomImages}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition flex items-center gap-2 text-sm"
                  >
                    <span>🗑️</span>
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl transition text-sm"
                >
                  ← Back
                </button>
              </div>
            </div>
            
            {/* Image Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5 mb-8">
              {allImages.map((img, index) => (
                <Card
                  key={`${index}_${generateImageId(img)}`}
                  image={img}
                  selected={selectedIndex === index}
                  onClick={() => handleImageSelect(index)}
                  index={index}
                  onDelete={index >= defaultImages.length ? () => handleDeleteCustomImage(index - defaultImages.length) : null}
                />
              ))}
              
              {/* Add Custom Image Card */}
              <Card
                isAddCard={true}
                onClick={handleAddImage}
              />
            </div>
            
            {/* Custom Images Section */}
            {customImages.length > 0 && (
              <div className="glass rounded-2xl p-6 mb-8 backdrop-blur-lg border border-purple-500/20">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                      <span className="text-purple-400">📸</span>
                      Your Custom Images ({customImages.length})
                    </h3>
                    <p className="text-white/60 text-sm">
                      Click on any image to select it as your avatar
                    </p>
                  </div>
                  <div className="text-sm text-white/50">
                    Storage: {getImageSize(customImages[0])} each
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {customImages.map((img, index) => {
                    const globalIndex = defaultImages.length + index;
                    return (
                      <div 
                        key={`custom_${index}`}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 ${
                          selectedIndex === globalIndex 
                            ? 'border-purple-500 ring-2 ring-purple-500/30' 
                            : 'border-purple-500/30 hover:border-purple-500/60'
                        }`}
                        onClick={() => handleImageSelect(globalIndex)}
                      >
                        <img
                          src={img}
                          alt={`Custom ${index + 1}`}
                          className="w-full h-24 object-cover"
                          onError={(e) => e.target.src = defaultImages[0]}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCustomImage(index);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <span className="text-white text-xs">×</span>
                        </button>
                        {selectedIndex === globalIndex && (
                          <div className="absolute top-1 left-1 w-4 h-4 bg-purple-500 rounded-full"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Preview & Actions */}
          <div className="lg:w-1/3">
            {/* Preview Card */}
            <div className="glass rounded-2xl p-6 mb-6 backdrop-blur-lg border border-white/10 sticky top-6">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-blue-400">👁️</span>
                Preview
              </h2>
              
              {/* Preview Image */}
              <div className="relative mb-6">
                <div className={`w-full aspect-square rounded-2xl overflow-hidden border-4 shadow-2xl ${
                  isCustomImageSelected 
                    ? 'border-purple-500 shadow-purple-500/30' 
                    : 'border-blue-500 shadow-blue-500/30'
                }`}>
                  {selectedImage ? (
                    <img 
                      src={selectedImage} 
                      alt="Selected avatar" 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        console.error("Error loading preview image");
                        e.target.src = defaultImages[0];
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl mb-2">🤖</div>
                        <p className="text-white/80">Select an avatar</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Selection Badge */}
                {selectedImage && (
                  <div className={`absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 rounded-full font-medium ${
                    isCustomImageSelected 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}>
                    {isCustomImageSelected ? 'Custom Image' : 'Default Avatar'}
                  </div>
                )}
              </div>
              
              {/* Image Details */}
              {selectedImage && (
                <div className="space-y-4">
                  <div className="bg-white/5 rounded-xl p-4">
                    <h4 className="font-medium text-white mb-3">Image Details</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-white/60">Type:</span>
                        <span className={`font-medium ${
                          isCustomImageSelected ? 'text-purple-300' : 'text-blue-300'
                        }`}>
                          {isCustomImageSelected ? 'Custom Upload' : 'Default Asset'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Size:</span>
                        <span className="text-white">{getImageSize(selectedImage)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Position:</span>
                        <span className="text-white">#{selectedIndex + 1} of {allImages.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Selection Status */}
                  <div className={`p-4 rounded-xl border ${
                    isCustomImageSelected 
                      ? 'bg-purple-500/10 border-purple-500/30' 
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isCustomImageSelected ? 'bg-purple-500/20' : 'bg-blue-500/20'
                      }`}>
                        <span className={isCustomImageSelected ? 'text-purple-300' : 'text-blue-300'}>
                          {isCustomImageSelected ? '📸' : '🤖'}
                        </span>
                      </div>
                      <div>
                        <p className={`font-medium ${
                          isCustomImageSelected ? 'text-purple-300' : 'text-blue-300'
                        }`}>
                          {isCustomImageSelected ? 'Custom Image Selected' : 'Default Avatar Selected'}
                        </p>
                        <p className="text-white/60 text-sm">
                          {isCustomImageSelected 
                            ? 'Uploaded from your device' 
                            : 'From our premium avatar collection'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Navigation Buttons */}
            <div className="glass rounded-2xl p-6 backdrop-blur-lg border border-white/10">
              <div className="space-y-4">
                <button
                  onClick={handleSkip}
                  className="w-full py-4 px-6 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 border border-white/10 hover:border-white/20"
                >
                  <span>🚀</span>
                  Launch Assistant
                </button>
                
                <button
                  onClick={() => navigate("/customize2")}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                  <span>✨</span>
                  Continue to Name →
                </button>
              </div>
              
              <p className="text-center text-white/60 text-sm mt-4">
                Your selection is saved automatically
              </p>
            </div>
          </div>
        </div>

        {/* File Input (Hidden) */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          id="image-upload"
        />

        {/* Help Text */}
        <div className="text-center mt-12 pt-8 border-t border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 text-xl">🖼️</span>
              </div>
              <h4 className="font-medium text-white mb-1">No Duplicates</h4>
              <p className="text-white/60 text-sm">Automatic duplicate detection</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-green-400 text-xl">⚡</span>
              </div>
              <h4 className="font-medium text-white mb-1">Fast Processing</h4>
              <p className="text-white/60 text-sm">Images optimized automatically</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-400 text-xl">🔒</span>
              </div>
              <h4 className="font-medium text-white mb-1">Secure Storage</h4>
              <p className="text-white/60 text-sm">Your images are saved locally</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fade-out {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-fade-out {
          animation: fade-out 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Customize;