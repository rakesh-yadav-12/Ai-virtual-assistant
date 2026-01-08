import React from "react";

function Card({ image, selected, onClick, isAddCard = false, index, onDelete }) {
  const isDefaultAsset = image && (image.includes('data:image/svg+xml') || image.includes('/assets/'));
  const isCustomImage = image && image.startsWith('data:image/') && !isDefaultAsset;

  const handleImageError = (e) => {
    console.error("Error loading image in Card component", image?.substring(0, 100));
    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%231F2937'/%3E%3Ccircle cx='100' cy='80' r='30' fill='%236B7280'/%3E%3Ccircle cx='80' cy='70' r='5' fill='white'/%3E%3Ccircle cx='120' cy='70' r='5' fill='white'/%3E%3Cpath d='M80,110 Q100,130 120,110' stroke='white' stroke-width='4' fill='none'/%3E%3Ctext x='100' y='180' font-size='12' fill='white' text-anchor='middle'%3EError%3C/text%3E%3C/svg%3E";
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (onDelete && window.confirm("Are you sure you want to delete this image?")) {
      onDelete();
    }
  };

  const getBorderColor = () => {
    if (isAddCard) return "border-emerald-500/50 hover:border-emerald-500";
    if (selected) {
      return isDefaultAsset 
        ? "border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.6)]" 
        : "border-purple-500 shadow-[0_0_25px_rgba(168,85,247,0.6)]";
    }
    return isDefaultAsset 
      ? "border-blue-500/30 hover:border-blue-500/70" 
      : "border-purple-500/30 hover:border-purple-500/70";
  };

  return (
    <div className="relative group" data-index={index} data-type={isDefaultAsset ? 'default' : 'custom'}>
      <div
        onClick={onClick}
        className={`relative cursor-pointer transition-all duration-300 transform ${
          selected ? 'scale-105 z-10' : 'hover:scale-[1.02]'
        }`}
      >
        <div
          className={`aspect-square rounded-2xl overflow-hidden border-3 transition-all duration-300 ${getBorderColor()} ${
            selected ? 'ring-2 ring-white/20' : ''
          }`}
        >
          {isAddCard ? (
            <div className="w-full h-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15 flex flex-col items-center justify-center transition-all duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl text-emerald-400">+</span>
              </div>
              <p className="text-white font-medium">Add Custom</p>
              <p className="text-white/60 text-xs mt-1">Upload Image</p>
            </div>
          ) : (
            <>
              {/* Image */}
              <img
                src={image}
                alt="Avatar option"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                loading="lazy"
                crossOrigin="anonymous"
              />
              
              {/* Type Badge */}
              {!selected && (
                <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm ${
                  isDefaultAsset 
                    ? 'bg-blue-500/80 text-white' 
                    : 'bg-purple-500/80 text-white'
                }`}>
                  {isDefaultAsset ? 'Asset' : 'Custom'}
                </div>
              )}
              
              {/* Delete Button for Custom Images */}
              {isCustomImage && onDelete && (
                <button
                  onClick={handleDeleteClick}
                  className="absolute top-2 right-2 w-7 h-7 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg backdrop-blur-sm"
                  title="Delete this image"
                >
                  <span className="text-white text-sm font-bold">×</span>
                </button>
              )}
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3">
                <div className="text-white text-xs font-medium">
                  {isDefaultAsset ? 'Default Asset' : 'Custom Upload'}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* Selection Indicator */}
        {selected && !isAddCard && (
          <div className={`absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center animate-pulse shadow-lg ${
            isDefaultAsset ? 'bg-blue-500' : 'bg-purple-500'
          }`}>
            <div className="w-3 h-3 bg-white rounded-full"></div>
          </div>
        )}
        
        {/* Selected Overlay */}
        {selected && !isAddCard && (
          <div className="absolute inset-0 rounded-2xl border-2 border-white/20 pointer-events-none"></div>
        )}
      </div>
    </div>
  );
}

export default Card;
