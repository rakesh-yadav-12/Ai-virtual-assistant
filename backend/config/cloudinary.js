import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import fsSync from "fs";

const publicDir = path.join(process.cwd(), "public", "temp");
try {
  if (!fsSync.existsSync(publicDir)) fsSync.mkdirSync(publicDir, { recursive: true });
} catch (err) {
  console.warn("Could not ensure public folder:", err.message);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (filePath, options = {}) => {
  if (!filePath) return null;
  try {
    const result = await cloudinary.uploader.upload(filePath, { 
      resource_type: "auto", 
      folder: "virtual-assistant",
      ...options 
    });
    try { 
      await fs.unlink(filePath); 
    } catch (err) { 
      console.warn("Failed to delete local file:", err?.message || err); 
    }
    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    try { 
      await fs.unlink(filePath); 
    } catch (err) { 
      console.warn("Failed to delete local file after error:", err?.message || err); 
    }
    return null;
  }
};