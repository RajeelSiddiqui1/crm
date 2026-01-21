// FileCard.jsx - Fixed version with proper WEBM handling
"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  FileAudio, 
  FileSpreadsheet,
  File,
  Music,
  Film,
  FileType,
  FileCode,
  Loader2,
  FileArchive
} from "lucide-react";
import ViewFileModal from "./ViewFileModal";

const getFileType = (name = "", type = "", url = "") => {
  const ext = name.split(".").pop().toLowerCase();
  
  // Check MIME type first if available
  if (type) {
    if (type.startsWith("video/")) {
      // WEBM can be video or audio, check MIME type more specifically
      if (type === "audio/webm" || type === "audio/webm; codecs=opus") {
        return "audio";
      }
      return "video";
    }
    if (type.startsWith("audio/")) return "audio";
    if (type.startsWith("image/")) return "image";
    if (type === "application/pdf") return "pdf";
    if (type.includes("word") || type.includes("document")) return "doc";
    if (type.includes("excel") || type.includes("spreadsheet")) return "excel";
    if (type.includes("powerpoint") || type.includes("presentation")) return "powerpoint";
    if (type.includes("text")) return "text";
    if (type.includes("zip") || type.includes("compressed")) return "archive";
    if (type.includes("json") || type.includes("javascript") || type.includes("python")) return "code";
  }
  
  // Check extensions with priority
  // Audio extensions (including audio-only webm)
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma", "aiff", "opus"];
  
  // Video extensions
  const videoExtensions = ["mp4", "avi", "mov", "mkv", "flv", "m4v", "mpeg", "mpg", "3gp"];
  
  // WEBM handling - check filename for clues
  if (ext === "webm") {
    const nameLower = name.toLowerCase();
    // If filename suggests audio, treat as audio
    if (nameLower.includes('audio') || 
        nameLower.includes('sound') || 
        nameLower.includes('recording') || 
        nameLower.includes('track') ||
        nameLower.includes('podcast') ||
        nameLower.includes('music') ||
        nameLower.includes('song')) {
      return "audio";
    }
    // If filename suggests video, treat as video
    if (nameLower.includes('video') || 
        nameLower.includes('movie') || 
        nameLower.includes('clip') || 
        nameLower.includes('film') ||
        nameLower.includes('recording') ||
        nameLower.includes('screen')) {
      return "video";
    }
    // Default to video (most common use case for webm)
    return "video";
  }
  
  // Check other extensions
  if (videoExtensions.includes(ext)) return "video";
  if (audioExtensions.includes(ext)) return "audio";
  if (["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "tiff", "ico", "psd"].includes(ext)) return "image";
  if (ext === "pdf") return "pdf";
  if (["doc", "docx", "odt", "rtf", "pages"].includes(ext)) return "doc";
  if (["xls", "xlsx", "csv", "ods", "numbers"].includes(ext)) return "excel";
  if (["ppt", "pptx", "odp", "key"].includes(ext)) return "powerpoint";
  if (["txt", "md", "log", "ini", "cfg", "conf"].includes(ext)) return "text";
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(ext)) return "archive";
  if (["js", "jsx", "ts", "tsx", "py", "java", "cpp", "c", "h", "hpp", "cs", "php", "rb", "go", "rs", "swift", "kt", "html", "htm", "css", "scss", "sass", "less", "json", "xml", "sql", "yaml", "yml", "toml"].includes(ext)) return "code";

  return "file";
};

const getFileIcon = (type, className = "w-8 h-8") => {
  switch (type) {
    case "video":
      return <Film className={className} />;
    case "image":
      return <ImageIcon className={className} />;
    case "audio":
      return <Music className={className} />;
    case "pdf":
      return <FileText className={className} />;
    case "doc":
      return <FileType className={className} />;
    case "excel":
      return <FileSpreadsheet className={className} />;
    case "powerpoint":
      return <FileText className={className} />;
    case "text":
      return <FileText className={className} />;
    case "archive":
      return <FileArchive className={className} />;
    case "code":
      return <FileCode className={className} />;
    default:
      return <File className={className} />;
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case "video":
      return "from-purple-500/20 via-violet-500/10 to-purple-600/20 border-purple-500/30";
    case "image":
      return "from-emerald-500/20 via-green-500/10 to-teal-600/20 border-emerald-500/30";
    case "audio":
      return "from-amber-500/20 via-yellow-500/10 to-orange-600/20 border-amber-500/30";
    case "pdf":
      return "from-red-500/20 via-rose-500/10 to-pink-600/20 border-red-500/30";
    case "doc":
      return "from-blue-500/20 via-sky-500/10 to-cyan-600/20 border-blue-500/30";
    case "excel":
      return "from-green-500/20 via-emerald-500/10 to-lime-600/20 border-green-500/30";
    case "powerpoint":
      return "from-orange-500/20 via-red-500/10 to-amber-600/20 border-orange-500/30";
    case "text":
      return "from-gray-500/20 via-gray-500/10 to-gray-600/20 border-gray-500/30";
    case "archive":
      return "from-indigo-500/20 via-purple-500/10 to-violet-600/20 border-indigo-500/30";
    case "code":
      return "from-yellow-500/20 via-amber-500/10 to-orange-600/20 border-yellow-500/30";
    default:
      return "from-gray-500/20 via-gray-500/10 to-gray-600/20 border-gray-500/30";
  }
};

const getTypeGradient = (type) => {
  switch (type) {
    case "video":
      return "bg-gradient-to-br from-purple-900 via-violet-900 to-fuchsia-900";
    case "image":
      return "bg-gradient-to-br from-emerald-900 via-teal-900 to-green-900";
    case "audio":
      return "bg-gradient-to-br from-amber-900 via-orange-900 to-yellow-900";
    case "pdf":
      return "bg-gradient-to-br from-red-900 via-rose-900 to-pink-900";
    case "doc":
      return "bg-gradient-to-br from-blue-900 via-sky-900 to-cyan-900";
    case "excel":
      return "bg-gradient-to-br from-green-900 via-emerald-900 to-lime-900";
    case "powerpoint":
      return "bg-gradient-to-br from-orange-900 via-red-900 to-amber-900";
    case "text":
      return "bg-gradient-to-br from-gray-800 via-gray-900 to-gray-950";
    case "archive":
      return "bg-gradient-to-br from-indigo-900 via-purple-900 to-violet-900";
    case "code":
      return "bg-gradient-to-br from-yellow-900 via-amber-900 to-orange-900";
    default:
      return "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900";
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case "video":
      return "VIDEO";
    case "image":
      return "IMAGE";
    case "audio":
      return "AUDIO";
    case "pdf":
      return "PDF";
    case "doc":
      return "DOCUMENT";
    case "excel":
      return "SPREADSHEET";
    case "powerpoint":
      return "PRESENTATION";
    case "text":
      return "TEXT";
    case "archive":
      return "ARCHIVE";
    case "code":
      return "CODE";
    default:
      return "FILE";
  }
};

export default function FileCard({ file }) {
  const [open, setOpen] = useState(false);
  const [detectedType, setDetectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const url = file?.url || file?.path;
  const initialFileType = getFileType(file?.name, file?.type, url);
  const fileType = detectedType || initialFileType;
  const typeColor = getTypeColor(fileType);
  const typeGradient = getTypeGradient(fileType);

  // Detect WEBM type on mount
  useEffect(() => {
    const detectWebmType = async () => {
      if (initialFileType === "video" && file?.name?.toLowerCase().endsWith('.webm')) {
        setIsLoading(true);
        try {
          // Try to detect if it's actually audio
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          const isVideo = await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              resolve(true);
              video.remove();
            };
            
            video.onerror = () => {
              // If video fails to load metadata, try audio
              const audio = document.createElement('audio');
              audio.preload = 'metadata';
              
              audio.onloadedmetadata = () => {
                resolve(false); // It's audio
                audio.remove();
              };
              
              audio.onerror = () => {
                resolve(true); // Default to video
                audio.remove();
              };
              
              audio.src = url;
            };
            
            video.src = url;
          });
          
          if (!isVideo) {
            setDetectedType("audio");
          }
        } catch (error) {
          console.error("Error detecting WEBM type:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    detectWebmType();
  }, [file?.name, initialFileType, url]);

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
          <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
          <div className="text-xs text-gray-400">Detecting file type...</div>
        </div>
      );
    }

    switch (fileType) {
      case "video":
        return (
          <div className="relative w-full h-full">
            <video 
              src={url} 
              className="h-full w-full object-cover rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity"
              muted 
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Video className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {file?.name?.toLowerCase().endsWith('.webm') ? 'WEBM' : 'VIDEO'}
            </div>
          </div>
        );
      
      case "audio":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500/30 to-orange-600/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Music className="w-10 h-10 text-amber-300" />
              </div>
              {/* Sound waves animation */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {[1, 2, 3, 4, 3, 2, 1].map((height, i) => (
                  <div
                    key={i}
                    className="w-1 bg-amber-400/50 rounded-full animate-pulse"
                    style={{
                      height: `${height * 4}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-amber-300/70 tracking-wider font-semibold">
                {file?.name?.toLowerCase().endsWith('.webm') ? 'WEBM AUDIO' : 'AUDIO FILE'}
              </div>
              <div className="text-xs text-amber-200/50 mt-1">Click to play</div>
            </div>
          </div>
        );
      
      case "image":
        return (
          <div className="relative w-full h-full">
            <img 
              src={url} 
              alt={file.name} 
              className="h-full w-full object-cover rounded-t-2xl opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="relative">
              <div className={`w-20 h-20 bg-gradient-to-br ${typeColor.replace('border', 'bg').split(' ')[0]} rounded-2xl flex items-center justify-center backdrop-blur-sm rotate-12 group-hover:rotate-0 transition-transform duration-500`}>
                <div className="-rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  {getFileIcon(fileType, "w-10 h-10")}
                </div>
              </div>
              {/* Floating particles */}
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/20 rounded-full animate-bounce" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white/20 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-300/70 tracking-wider font-semibold uppercase">
                {getTypeLabel(fileType)}
              </div>
              <div className="text-[10px] text-gray-400/50 mt-1">Click to preview</div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        className="cursor-pointer group relative overflow-hidden bg-[#0a0a0a] border border-[#1a1a1a] hover:border-opacity-50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 rounded-2xl"
      >
        {/* Animated background effect */}
        <div className={`absolute inset-0 ${typeGradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-black/20" />
        
        <CardContent className="p-0 relative z-10">
          <div className={`h-48 flex items-center justify-center bg-gradient-to-br ${typeColor} rounded-t-2xl relative overflow-hidden`}>
            {/* Animated particles */}
            <div className="absolute inset-0">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${1 + Math.random() * 2}s`
                  }}
                />
              ))}
            </div>

            {renderPreview()}
          </div>

          <div className="p-4 space-y-3 bg-gradient-to-b from-[#0a0a0a] to-[#111] rounded-b-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate group-hover:text-gray-200 transition-colors">
                  {file?.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {file?.size ? formatFileSize(file.size) : 'Unknown size'}
                  {file?.name?.toLowerCase().endsWith('.webm') && (
                    <span className="ml-2 text-amber-400">• WEBM</span>
                  )}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-[10px] font-semibold px-2 py-0.5 border-opacity-30 bg-opacity-10 ${typeColor.split(' ').slice(0, 3).join(' ')}`}
                >
                  {getTypeLabel(fileType)}
                </Badge>
                <Eye size={14} className="text-gray-400 group-hover:text-white transition-colors" />
              </div>
            </div>
            
            {/* Progress bar effect */}
            <div className="h-0.5 bg-gray-900 rounded-full overflow-hidden">
              <div 
                className={`h-full ${typeColor.split(' ')[0]} transition-all duration-1000 group-hover:w-full w-0`}
              />
            </div>
          </div>
        </CardContent>
        
        {/* Corner accent */}
        <div className={`absolute top-0 right-0 w-12 h-12 ${typeColor.split(' ')[0]} opacity-20 blur-xl`} />
      </Card>

      <ViewFileModal 
        open={open} 
        onClose={() => setOpen(false)} 
        file={file} 
        fileType={fileType} 
        url={url} 
      />
    </>
  );
}

// Helper function
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}