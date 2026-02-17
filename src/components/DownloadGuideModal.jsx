import { Download, FileImage, FileText, Loader2, X } from "lucide-react";
import { useState } from "react";

export default function DownloadGuideModal({ guide, authorName, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  // Add luxury watermark to canvas with prominent design
  const addWatermark = (ctx, canvas, pageNumber, totalPages) => {
    // Large semi-transparent diagonal watermark in center
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.font = "bold 180px Arial";
    ctx.fillStyle = "#8B5CF6"; // Purple color
    ctx.textAlign = "center";
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-45 * Math.PI) / 180);
    ctx.fillText("ZetsuGuide", 0, 0);
    ctx.restore();

    // Luxury footer watermark bar with gradient effect
    const footerHeight = 120;
    const gradient = ctx.createLinearGradient(
      0,
      canvas.height - footerHeight,
      0,
      canvas.height,
    );
    gradient.addColorStop(0, "rgba(139, 92, 246, 0.95)");
    gradient.addColorStop(1, "rgba(219, 39, 119, 0.95)");

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - footerHeight, canvas.width, footerHeight);

    // Top border with gold accent
    const goldGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
    goldGradient.addColorStop(0, "rgba(251, 191, 36, 0)");
    goldGradient.addColorStop(0.5, "rgba(251, 191, 36, 1)");
    goldGradient.addColorStop(1, "rgba(251, 191, 36, 0)");
    ctx.fillStyle = goldGradient;
    ctx.fillRect(0, canvas.height - footerHeight, canvas.width, 4);

    // Author and branding (white text for contrast)
    ctx.globalAlpha = 1;
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;

    ctx.font = "bold 28px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.textAlign = "left";
    ctx.fillText(`📝 ${authorName}`, 40, canvas.height - 70);

    ctx.font = "bold 22px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillText(`✨ ZetsuGuide Premium`, 40, canvas.height - 35);

    // Page numbers with luxury style
    ctx.textAlign = "right";
    ctx.font = "bold 32px Arial";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(
      `${pageNumber}/${totalPages}`,
      canvas.width - 40,
      canvas.height - 70,
    );

    ctx.font = "18px Arial";
    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.fillText(
      "zetsuguids.vercel.app",
      canvas.width - 40,
      canvas.height - 35,
    );

    ctx.restore();
  };

  // Download as PDF with better quality and layout
  const downloadAsPDF = async () => {
    setDownloading(true);
    setProgress(0);
    setCurrentStep("Preparing guide content...");

    try {
      // Dynamic imports with error handling
      const [html2canvasModule, jsPDFModule] = await Promise.all([
        import("html2canvas"),
        import("jspdf")
      ]);
      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.default;

      // Lock page scrolling during processing
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      try {
        const content = document.querySelector(".guide-content");
        setCurrentStep("Optimizing layout...");

        // Clone content for clean capture
        const container = document.createElement("div");
        container.style.width = "210mm"; // A4 width
        container.style.padding = "20mm";
        container.style.background = "white";
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "0";

        // Add luxury title page
        const titlePage = document.createElement("div");
        titlePage.style.cssText =
          "min-height: 300px; margin-bottom: 50px; padding: 60px; border: 5px solid #000; background: linear-gradient(135deg, #8B5CF6 0%, #DB2777 50%, #F59E0B 100%); box-shadow: inset 0 0 100px rgba(0,0,0,0.2);";
        titlePage.innerHTML = `
          <div style="background: rgba(255,255,255,0.95); padding: 40px; border: 3px solid #000; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
              <h1 style="font-size: 42px; font-weight: 900; margin-bottom: 15px; color: #000; text-shadow: 2px 2px 0px #8B5CF6;">✨ ${guide.title}</h1>
              <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #8B5CF6;">
                <p style="font-size: 20px; color: #333; margin-bottom: 8px; font-weight: 600;">📝 Created by ${authorName}</p>
                <p style="font-size: 16px; color: #8B5CF6; font-weight: 700; letter-spacing: 2px;">PREMIUM ZETSUGUIDE CONTENT</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 14px; color: #666; font-style: italic;">High-Quality Professional Guide • zetsuguids.vercel.app</p>
            </div>
          </div>
        `;

        container.appendChild(titlePage);

        // Clone actual content with better formatting
        const contentClone = content.cloneNode(true);
        contentClone.style.cssText =
          "font-family: Arial, sans-serif; line-height: 1.8; color: #000; font-size: 14px; padding-bottom: 60px;";

        // Improve content styling for better page breaks
        const headings = contentClone.querySelectorAll("h1, h2, h3, h4, h5, h6");
        headings.forEach((h) => {
          h.style.pageBreakAfter = "avoid";
          h.style.breakAfter = "avoid";
          h.style.marginTop = "25px";
          h.style.marginBottom = "15px";
        });

        const paragraphs = contentClone.querySelectorAll("p");
        paragraphs.forEach((p) => {
          p.style.marginBottom = "12px";
          p.style.orphans = "3";
          p.style.widows = "3";
        });

        container.appendChild(contentClone);

        document.body.appendChild(container);

        setProgress(10);
        setCurrentStep("Capturing high-quality snapshots...");

        // Capture entire container
        const canvas = await html2canvas(container, {
          scale: 3, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 794, // A4 width in pixels at 96 DPI
          windowHeight: container.scrollHeight,
        });

        setProgress(40);
        setCurrentStep("Creating professional PDF...");

        // Create PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          compress: true,
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const contentHeight = pdfHeight - 20; // Leave space for watermark

        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        const totalPages = Math.ceil(imgHeight / contentHeight);

        setProgress(50);
        setCurrentStep(
          `Generating ${totalPages} page${totalPages > 1 ? "s" : ""}...`,
        );

        for (let i = 0; i < totalPages; i++) {
          setProgress(50 + (40 / totalPages) * (i + 1));
          setCurrentStep(`Processing page ${i + 1} of ${totalPages}...`);

          if (i > 0) pdf.addPage();

          // Calculate slice position
          const yPosition = -i * contentHeight;

          // Add image slice
          pdf.addImage(
            canvas.toDataURL("image/jpeg", 0.95),
            "JPEG",
            0,
            yPosition,
            imgWidth,
            imgHeight,
            undefined,
            "FAST",
          );

          // Create overlay canvas for watermark
          const overlayCanvas = document.createElement("canvas");
          overlayCanvas.width = canvas.width;
          overlayCanvas.height = (contentHeight / pdfWidth) * canvas.width;
          const overlayCtx = overlayCanvas.getContext("2d");

          addWatermark(overlayCtx, overlayCanvas, i + 1, totalPages);

          // Add watermark overlay
          pdf.addImage(
            overlayCanvas.toDataURL("image/png"),
            "PNG",
            0,
            0,
            pdfWidth,
            contentHeight,
            undefined,
            "FAST",
          );
        }

        // Cleanup
        document.body.removeChild(container);

        setProgress(95);
        setCurrentStep("Finalizing PDF...");

        // Add metadata
        pdf.setProperties({
          title: guide.title,
          subject: "ZetsuGuide Export",
          author: authorName,
          keywords: guide.keywords?.join(", ") || "",
          creator: "ZetsuGuide - zetsuguids.vercel.app",
        });

        // Save PDF
        const fileName = `${guide.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_zetsuguide.pdf`;
        pdf.save(fileName);

        setProgress(100);
        setCurrentStep("Download complete!");

        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (error) {
        console.error("PDF Download Error:", error);
        setCurrentStep("Error: " + error.message);
        setTimeout(() => onClose(), 3000);
      } finally {
        // Restore page scrolling
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = "";
      }
    } catch (error) {
      console.error("PDF Download Error:", error);
      setCurrentStep("Error: " + error.message);
      setTimeout(() => onClose(), 3000);
      // Ensure scrolling is restored even if initial setup fails
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    } finally {
      setDownloading(false);
    }
  };

  // Download as Images with better quality
  const downloadAsImages = async () => {
    setDownloading(true);
    setProgress(0);
    setCurrentStep("Preparing guide content...");

    try {
      // Dynamic import with error handling
      const html2canvasModule = await import("html2canvas");
      const html2canvas = html2canvasModule.default;

      // Lock page scrolling during processing
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";

      try {
        const content = document.querySelector(".guide-content");
        if (!content) {
          throw new Error("Guide content not found");
        }

        setProgress(5);
        setCurrentStep("Optimizing layout...");

        // Clone content for clean capture
        const container = document.createElement("div");
        container.style.width = "210mm"; // A4 width
        container.style.padding = "20mm";
        container.style.background = "white";
        container.style.position = "absolute";
        container.style.left = "-9999px";
        container.style.top = "0";

        // Add luxury title page
        const titlePage = document.createElement("div");
        titlePage.style.cssText =
          "min-height: 300px; margin-bottom: 50px; padding: 60px; border: 5px solid #000; background: linear-gradient(135deg, #8B5CF6 0%, #DB2777 50%, #F59E0B 100%); box-shadow: inset 0 0 100px rgba(0,0,0,0.2);";
        titlePage.innerHTML = `
          <div style="background: rgba(255,255,255,0.95); padding: 40px; border: 3px solid #000; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 20px; margin-bottom: 20px;">
              <h1 style="font-size: 42px; font-weight: 900; margin-bottom: 15px; color: #000; text-shadow: 2px 2px 0px #8B5CF6;">✨ ${guide.title}</h1>
              <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #8B5CF6;">
                <p style="font-size: 20px; color: #333; margin-bottom: 8px; font-weight: 600;">📝 Created by ${authorName}</p>
                <p style="font-size: 16px; color: #8B5CF6; font-weight: 700; letter-spacing: 2px;">PREMIUM ZETSUGUIDE CONTENT</p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px;">
              <p style="font-size: 14px; color: #666; font-style: italic;">High-Quality Professional Guide • zetsuguids.vercel.app</p>
            </div>
          </div>
        `;

        container.appendChild(titlePage);

        // Clone actual content with better formatting
        const contentClone = content.cloneNode(true);
        contentClone.style.cssText =
          "font-family: Arial, sans-serif; line-height: 1.8; color: #000; font-size: 14px; padding-bottom: 60px;";

        // Improve content styling for better page breaks
        const headings = contentClone.querySelectorAll("h1, h2, h3, h4, h5, h6");
        headings.forEach((h) => {
          h.style.pageBreakAfter = "avoid";
          h.style.breakAfter = "avoid";
          h.style.marginTop = "25px";
          h.style.marginBottom = "15px";
        });

        const paragraphs = contentClone.querySelectorAll("p");
        paragraphs.forEach((p) => {
          p.style.marginBottom = "12px";
          p.style.orphans = "3";
          p.style.widows = "3";
        });

        container.appendChild(contentClone);

        document.body.appendChild(container);

        setProgress(10);
        setCurrentStep("Capturing high-quality images...");

        // Capture entire container
        const fullCanvas = await html2canvas(container, {
          scale: 3, // Higher quality
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          windowWidth: 794, // A4 width in pixels at 96 DPI
          windowHeight: container.scrollHeight,
        });

        setProgress(40);

        // Calculate page splits
        const pageHeightPx = 1123; // A4 height in pixels at 96 DPI
        const totalPages = Math.ceil(fullCanvas.height / pageHeightPx);

        setCurrentStep(
          `Generating ${totalPages} image${totalPages > 1 ? "s" : ""}...`,
        );

        for (let i = 0; i < totalPages; i++) {
          setProgress(40 + (50 / totalPages) * (i + 1));
          setCurrentStep(`Processing image ${i + 1} of ${totalPages}...`);

          // Create page canvas
          const pageCanvas = document.createElement("canvas");
          pageCanvas.width = fullCanvas.width;
          pageCanvas.height = Math.min(
            pageHeightPx,
            fullCanvas.height - i * pageHeightPx,
          );
          const pageCtx = pageCanvas.getContext("2d");

          // Draw slice from full canvas
          pageCtx.drawImage(
            fullCanvas,
            0,
            i * pageHeightPx,
            fullCanvas.width,
            pageCanvas.height,
            0,
            0,
            fullCanvas.width,
            pageCanvas.height,
          );

          // Add watermark
          addWatermark(pageCtx, pageCanvas, i + 1, totalPages);

          // Convert to blob and download
          await new Promise((resolve) => {
            pageCanvas.toBlob((blob) => {
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${guide.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_page_${i + 1}_zetsuguide.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              resolve();
            }, "image/png");
          });

          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        // Cleanup
        document.body.removeChild(container);

        setProgress(100);
        setCurrentStep("All images downloaded!");

        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (error) {
        console.error("Images Download Error:", error);
        setCurrentStep("Error: " + error.message);
        setTimeout(() => onClose(), 3000);
      } finally {
        // Restore page scrolling
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = "";
      }
    } catch (error) {
      console.error("Images Download Error:", error);
      setCurrentStep("Error: " + error.message);
      setTimeout(() => onClose(), 3000);
      // Ensure scrolling is restored even if initial setup fails
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-white border-4 border-black w-full max-w-md mx-4 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-black bg-gradient-to-r from-purple-100 via-pink-100 to-purple-100">
          <div className="flex items-center gap-2">
            <Download size={24} className="text-purple-600" />
            <h2 className="text-xl font-black">Download Guide</h2>
          </div>
          {!downloading && (
            <button
              onClick={onClose}
              className="hover:bg-black/10 p-2 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {!downloading ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm mb-6">
                Choose your preferred format to download this guide. All
                downloads include watermarks to protect the content.
              </p>

              {/* PDF Option */}
              <button
                onClick={downloadAsPDF}
                className="w-full flex items-center justify-between p-4 border-2 border-black hover:bg-purple-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 border-2 border-black">
                    <FileText size={24} className="text-red-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Save as PDF</div>
                    <div className="text-xs text-gray-600">
                      Single file, easy to share
                    </div>
                  </div>
                </div>
                <Download
                  size={20}
                  className="text-gray-400 group-hover:text-black transition-colors"
                />
              </button>

              {/* Images Option */}
              <button
                onClick={downloadAsImages}
                className="w-full flex items-center justify-between p-4 border-2 border-black hover:bg-pink-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 border-2 border-black">
                    <FileImage size={24} className="text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold">Save as Images</div>
                    <div className="text-xs text-gray-600">
                      Multiple PNG files
                    </div>
                  </div>
                </div>
                <Download
                  size={20}
                  className="text-gray-400 group-hover:text-black transition-colors"
                />
              </button>

              <div className="text-xs text-gray-500 text-center mt-4 p-3 bg-gray-50 border border-gray-200">
                ⚠️ Watermarks are applied to protect guide content
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Progress Animation */}
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2
                  size={48}
                  className="animate-spin text-purple-600 mb-4"
                />
                <p className="font-bold text-lg text-center">{currentStep}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Progress</span>
                  <span className="text-purple-600">{progress}%</span>
                </div>
                <div className="w-full h-4 bg-gray-200 border-2 border-black overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {progress === 100 && (
                <div className="text-center text-green-600 font-bold flex items-center justify-center gap-2">
                  <Download size={20} />
                  Download Complete!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
