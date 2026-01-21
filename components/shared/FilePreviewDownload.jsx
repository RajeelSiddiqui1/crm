// components/shared/FilePreviewDownload.jsx
"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Video,
  AudioLines,
  FileIcon,
  X,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FilePreviewDownload = ({ file, showPreview = true, showDownload = true, children }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Get file type
  const getFileType = (fileName, mimeType) => {
    if (!fileName && !mimeType) return "unknown";
    
    const name = fileName?.toLowerCase() || "";
    const type = mimeType?.toLowerCase() || "";

    if (type.includes("image/") || name.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) {
      return "image";
    }
    if (type.includes("video/") || name.match(/\.(mp4|mov|avi|mkv|webm|flv|wmv)$/)) {
      return "video";
    }
    if (type.includes("audio/") || name.match(/\.(mp3|wav|ogg|m4a|flac|aac)$/)) {
      return "audio";
    }
    if (type.includes("application/pdf") || name.match(/\.pdf$/)) {
      return "pdf";
    }
    if (name.match(/\.(doc|docx)$/) || type.includes("application/msword") || type.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      return "word";
    }
    if (name.match(/\.(xls|xlsx)$/) || type.includes("application/vnd.ms-excel") || type.includes("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
      return "excel";
    }
    return "other";
  };

  // Get icon based on file type
  const getFileIcon = (fileType) => {
    switch (fileType) {
      case "image":
        return <ImageIcon className="w-5 h-5 text-green-600" />;
      case "video":
        return <Video className="w-5 h-5 text-red-600" />;
      case "audio":
        return <AudioLines className="w-5 h-5 text-purple-600" />;
      case "pdf":
        return <FileText className="w-5 h-5 text-red-500" />;
      case "word":
        return <FileText className="w-5 h-5 text-blue-600" />;
      case "excel":
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <FileIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Handle download
  const handleDownload = async (e) => {
    e.stopPropagation();
    
    if (!file || !file.url) {
      console.error("No file URL provided");
      return;
    }

    setIsDownloading(true);
    
    try {
      // Fetch the file
      const response = await fetch(file.url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Get the blob
      const blob = await response.blob();
      
      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = file.name || "download";
      
      // Append to body and click
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      console.error("Download failed:", error);
      
      // Fallback: Direct link approach
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name || "download";
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle preview
  const handlePreview = (e) => {
    e.stopPropagation();
    
    const fileType = getFileType(file?.name, file?.type);
    
    // Only show preview for images and videos
    if (fileType === "image" || fileType === "video" || fileType === "audio") {
      setIsPreviewOpen(true);
    } else {
      // For other files, open in new tab
      window.open(file.url, "_blank");
    }
  };

  const fileType = getFileType(file?.name, file?.type);

  return (
    <>
      <div className="flex items-center gap-2">
        {showPreview && (fileType === "image" || fileType === "video" || fileType === "audio") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View</span>
          </Button>
        )}
        
        {showPreview && (fileType === "pdf" || fileType === "word" || fileType === "excel" || fileType === "other") && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(file.url, "_blank")}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View</span>
          </Button>
        )}
        
        {showDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center gap-1"
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Download</span>
          </Button>
        )}
        
        {children}
      </div>

      {/* Preview Modal for Images, Videos and Audio */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg font-semibold">
                {file?.name || "File Preview"}
              </DialogTitle>
              <Button
                onClick={() => setIsPreviewOpen(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-lg">
            {fileType === "image" && (
              <div className="relative w-full max-h-[70vh] flex items-center justify-center">
                <img
                  src={file.url}
                  alt={file.name || "Image"}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                />
              </div>
            )}
            
            {fileType === "video" && (
              <div className="w-full">
                <video
                  controls
                  className="w-full max-h-[70vh] rounded-lg shadow-lg"
                  src={file.url}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}
            
            {fileType === "audio" && (
              <div className="w-full max-w-2xl">
                <div className="p-6 bg-white rounded-lg shadow-lg">
                  <div className="flex items-center gap-4 mb-6">
                    {getFileIcon(fileType)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{file.name}</h3>
                      {file.size && (
                        <p className="text-sm text-gray-500">
                          Size: {formatFileSize(file.size)}
                        </p>
                      )}
                    </div>
                  </div>
                  <audio
                    controls
                    className="w-full"
                    src={file.url}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            )}
            
            <div className="mt-4 text-center">
              <p className="font-medium">{file.name}</p>
              {file.size && (
                <p className="text-sm text-gray-500 mt-1">
                  Size: {formatFileSize(file.size)}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default FilePreviewDownload;