// src/CloudinaryTestUploader.js

import React from "react";

const CloudinaryTestUploader = () => {
  const testCloudinaryUpload = async (videoFile) => {
    const formData = new FormData();
    formData.append("file", videoFile);
    formData.append("upload_preset", "ml_default"); // Cloudinary public preset

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/demo/video/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("🔍 Cloudinary response:", data);

      if (res.ok && data.secure_url) {
        alert("✅ Upload Success:\n" + data.secure_url);
      } else {
        alert("❌ Upload Failed:\n" + data.error?.message);
      }
    } catch (error) {
      console.error("❌ Upload Error:", error);
      alert("❌ Upload Failed: " + error.message);
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>🎥 Cloudinary Demo Video Upload Test</h2>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => testCloudinaryUpload(e.target.files[0])}
        style={{ marginTop: "1rem" }}
      />
    </div>
  );
};

export default CloudinaryTestUploader;
