// src/utils/certificateGenerator.jsx

import jsPDF from 'jspdf';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';
import certificateBgPath from '../assets/certificate.png';

/**
 * Helper function to asynchronously load an image.
 */
const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

/**
 * Generates and downloads a PDF certificate for the given course.
 */
export const generateCertificate = async (courseTitle, courseId) => {
  let user = auth.currentUser;

  if (!user) {
    await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        if (u) {
          user = u;
          resolve();
          unsubscribe();
        }
      });
    });
  }

  if (!user) {
    alert("Login required to download certificate.");
    return;
  }

  if (!courseTitle) {
    alert("Course title is missing.");
    return;
  }

  try {
    const bgImage = await loadImage(certificateBgPath);

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.addImage(bgImage, 'PNG', 0, 0, pageWidth, pageHeight);

    // --- FINAL ALIGNMENT ---
    // We'll use a slightly adjusted center and much more deliberate vertical spacing.
    const contentCenterX = pageWidth * 0.64;

    // --- Add Text Elements with Polished Alignment & Spacing ---

    // 1. ADD A MAIN TITLE (This makes a huge difference)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.setTextColor(80, 80, 80);
    doc.text("CERTIFICATE OF COMPLETION", contentCenterX, 190, { align: 'center' });

    // 2. LEARNER'S NAME (with adjusted vertical position)
    const name = user.displayName || user.email?.split('@')[0] || "A Valued Learner";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(30, 30, 30);
    doc.text(name, contentCenterX, 240, { align: 'center' });

    // 3. COMPLETION MESSAGE (tighter spacing)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18);
    doc.setTextColor(50, 50, 50);
    doc.text("has successfully completed the course", contentCenterX, 270, { align: 'center' });

    // 4. COURSE TITLE (the main focus)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(26);
    doc.setTextColor(44, 44, 150);
    const courseTextOptions = {
        align: 'center',
        maxWidth: 400 // Handles long titles gracefully
    };
    doc.text(courseTitle, contentCenterX, 315, courseTextOptions);

    // 5. COMPLETION DATE
    const dateStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`Date: ${dateStr}`, contentCenterX, 360, { align: 'center' });

    // Save the PDF
    const filename = `${courseTitle.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error("Certificate generation error:", error);
    alert("Failed to generate certificate. Please check the console for details.");
  }
};