"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Volume2,
  Download,
  Play,
  Pause,
  Music,
  FileVideo,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  FileType,
  Video,
  Eye,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Loader2,
  Clock,
  Headphones,
  FileArchive,
  FileCode,
  Film,
  X,
  Search,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  MoreVertical,
  Share2,
  Bookmark,
  Shield,
  Zap,
  RefreshCw,
  UploadCloud,
  Folder,
  HardDrive,
  Database,
  AlertCircle,
  CheckCircle,
  Trash2,
  Copy,
  Star,
  BarChart3,
  MessageSquare,
  Mic,
  VolumeX,
  Volume1,
  SkipBack,
  SkipForward
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// File type detection utilities
const getFileType = (name = "", type = "", url = "") => {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  
  if (type) {
    if (type.startsWith("video/")) {
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
  
  const audioExtensions = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "wma", "aiff", "opus", "webm", "weba"];
  const videoExtensions = ["mp4", "avi", "mov", "mkv", "flv", "m4v", "mpeg", "mpg", "3gp"];
  
  if (ext === "webm" || ext === "weba") {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('audio') || nameLower.includes('sound') || nameLower.includes('recording') || 
        nameLower.includes('track') || nameLower.includes('podcast') || nameLower.includes('music') || 
        nameLower.includes('song') || nameLower.includes('voice') || nameLower.includes('mic')) {
      return "audio";
    }
    if (nameLower.includes('video') || nameLower.includes('movie') || nameLower.includes('clip') || 
        nameLower.includes('film') || nameLower.includes('recording') || nameLower.includes('screen')) {
      return "video";
    }
    return nameLower.includes('audio') ? "audio" : "video";
  }
  
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

// DARK RED/EMERALD COLOR THEME WITH WHITE BACKGROUND
const getFileColor = (type) => {
  switch (type) {
    case "video": return "from-rose-600 via-red-600 to-rose-700";
    case "audio": return "from-emerald-600 via-teal-600 to-emerald-700";
    case "image": return "from-amber-600 via-orange-600 to-amber-700";
    case "pdf": return "from-red-700 via-rose-700 to-red-800";
    case "doc": return "from-blue-600 via-sky-600 to-blue-700";
    case "excel": return "from-green-600 via-emerald-600 to-green-700";
    case "powerpoint": return "from-orange-600 via-amber-600 to-orange-700";
    case "text": return "from-gray-600 via-gray-700 to-gray-800";
    case "archive": return "from-purple-600 via-violet-600 to-purple-700";
    case "code": return "from-yellow-600 via-amber-600 to-yellow-700";
    default: return "from-gray-600 via-gray-700 to-gray-800";
  }
};

const getTypeGradient = (type) => {
  switch (type) {
    case "video": return "bg-gradient-to-br from-rose-50 via-red-50 to-rose-100";
    case "audio": return "bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100";
    case "image": return "bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100";
    case "pdf": return "bg-gradient-to-br from-red-50 via-rose-50 to-red-100";
    case "doc": return "bg-gradient-to-br from-blue-50 via-sky-50 to-blue-100";
    case "excel": return "bg-gradient-to-br from-green-50 via-emerald-50 to-green-100";
    case "powerpoint": return "bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100";
    case "text": return "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-150";
    case "archive": return "bg-gradient-to-br from-purple-50 via-violet-50 to-purple-100";
    case "code": return "bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100";
    default: return "bg-gradient-to-br from-gray-50 via-gray-100 to-gray-150";
  }
};

const getTypeColor = (type) => {
  switch (type) {
    case "video": return "from-rose-100 via-red-50 to-rose-50 border-rose-200";
    case "audio": return "from-emerald-100 via-teal-50 to-emerald-50 border-emerald-200";
    case "image": return "from-amber-100 via-orange-50 to-amber-50 border-amber-200";
    case "pdf": return "from-red-100 via-rose-50 to-red-50 border-red-200";
    case "doc": return "from-blue-100 via-sky-50 to-blue-50 border-blue-200";
    case "excel": return "from-green-100 via-emerald-50 to-green-50 border-green-200";
    case "powerpoint": return "from-orange-100 via-amber-50 to-orange-50 border-orange-200";
    case "text": return "from-gray-100 via-gray-50 to-gray-50 border-gray-200";
    case "archive": return "from-purple-100 via-violet-50 to-purple-50 border-purple-200";
    case "code": return "from-yellow-100 via-amber-50 to-yellow-50 border-yellow-200";
    default: return "from-gray-100 via-gray-50 to-gray-50 border-gray-200";
  }
};

const getFileIcon = (type, className = "w-6 h-6") => {
  switch (type) {
    case "video": return <Film className={className} />;
    case "image": return <ImageIcon className={className} />;
    case "audio": return <Music className={className} />;
    case "pdf": return <File className={className} />;
    case "doc": return <FileType className={className} />;
    case "excel": return <FileSpreadsheet className={className} />;
    case "powerpoint": return <File className={className} />;
    case "text": return <File className={className} />;
    case "archive": return <FileArchive className={className} />;
    case "code": return <FileCode className={className} />;
    default: return <File className={className} />;
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case "video": return "VIDEO";
    case "audio": return "AUDIO";
    case "image": return "IMAGE";
    case "pdf": return "PDF";
    case "doc": return "DOCUMENT";
    case "excel": return "SPREADSHEET";
    case "powerpoint": return "PRESENTATION";
    case "text": return "TEXT";
    case "archive": return "ARCHIVE";
    case "code": return "CODE";
    default: return "FILE";
  }
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Enhanced File Card Component for White Background
const FileCard = ({ file, onClick, viewMode = "grid", isAudioMain = false }) => {
  const [detectedType, setDetectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);
  
  const url = file?.url || file?.path;
  const initialFileType = getFileType(file?.name, file?.type, url);
  const fileType = detectedType || initialFileType;
  const typeColor = getTypeColor(fileType);
  const typeGradient = getTypeGradient(fileType);
  const fileColor = getFileColor(fileType);

  useEffect(() => {
    const detectWebmType = async () => {
      if (initialFileType === "video" && file?.name?.toLowerCase().endsWith('.webm')) {
        setIsLoading(true);
        try {
          const video = document.createElement('video');
          video.preload = 'metadata';
          
          const isVideo = await new Promise((resolve) => {
            video.onloadedmetadata = () => {
              resolve(true);
              video.remove();
            };
            
            video.onerror = () => {
              const audio = document.createElement('audio');
              audio.preload = 'metadata';
              
              audio.onloadedmetadata = () => {
                resolve(false);
                audio.remove();
              };
              
              audio.onerror = () => {
                resolve(true);
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

  const handleAudioPlay = (e) => {
    e.stopPropagation();
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const renderPreview = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
          <Loader2 className="w-10 h-10 text-gray-400 animate-spin" />
          <div className="text-xs text-gray-500">Detecting file type...</div>
        </div>
      );
    }

    switch (fileType) {
      case "video":
        return (
          <div className="relative w-full h-full">
            <video 
              src={url} 
              className="h-full w-full object-cover rounded-t-2xl opacity-80 group-hover:opacity-100 transition-all duration-500"
              muted 
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className={`w-16 h-16 bg-gradient-to-br ${fileColor.split(' ').slice(0, 3).join(' ')} backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-all duration-300`}>
                <Video className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
              {file?.name?.toLowerCase().endsWith('.webm') ? 'WEBM' : 'VIDEO'}
            </div>
          </div>
        );
      
      case "audio":
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-lg shadow-emerald-200">
                <Music className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {[1, 2, 3, 4, 3, 2, 1].map((height, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-300'}`}
                    style={{
                      height: `${height * 4}px`,
                      animationDelay: `${i * 0.1}s`
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-emerald-700 font-semibold">
                {file?.name?.toLowerCase().endsWith('.webm') ? 'WEBM AUDIO' : 'AUDIO FILE'}
              </div>
              <div className="text-xs text-emerald-500 mt-1">Click to preview</div>
            </div>
            <audio 
              ref={audioRef}
              src={url}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        );
      
      case "image":
        return (
          <div className="relative w-full h-full">
            <img 
              src={url} 
              alt={file.name} 
              className="h-full w-full object-cover rounded-t-2xl opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-amber-500/80 to-amber-600/80 backdrop-blur-sm text-white">
                IMAGE
              </Badge>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="relative">
              <div className={`w-20 h-20 ${typeGradient} rounded-2xl flex items-center justify-center shadow-lg`}>
                <div className="relative">
                  {getFileIcon(fileType, "w-10 h-10 text-gray-700")}
                  {isHovered && (
                    <div className="absolute -inset-4 bg-white/20 rounded-full animate-ping" />
                  )}
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-white/80 rounded-full animate-bounce shadow" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-white/80 rounded-full animate-bounce shadow" style={{ animationDelay: '0.2s' }} />
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-700 font-semibold uppercase">
                {getTypeLabel(fileType)}
              </div>
              <div className="text-[10px] text-gray-500 mt-1">Click to preview</div>
            </div>
          </div>
        );
    }
  };

  if (viewMode === "list") {
    return (
      <div
        className="group bg-white hover:bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-rose-300 transition-all duration-300 shadow-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`relative p-3 rounded-xl bg-gradient-to-r ${fileColor} shadow-md`}>
              {getFileIcon(fileType, "w-5 h-5 text-white")}
              {isHovered && (
                <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">
                {file.name}
                {isAudioMain && (
                  <Badge className="ml-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs">
                    Main
                  </Badge>
                )}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-xs border-gray-300 bg-gray-50 text-gray-700">
                  {getTypeLabel(fileType)}
                </Badge>
                <span className="text-sm text-gray-600">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-sm text-gray-600">
                  {file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString() : 'Just now'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {fileType === "audio" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleAudioPlay}
                className={`${isPlaying ? 'bg-emerald-50 text-emerald-600' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300 hover:bg-emerald-50 text-emerald-600`}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClick}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-rose-50 text-rose-600"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(url, file.name);
              }}
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-emerald-50 text-emerald-600"
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-100 text-gray-600"
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Grid View
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer group relative overflow-hidden bg-white border border-gray-200 hover:border-rose-300 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl hover:shadow-rose-100 rounded-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main audio indicator */}
      {isAudioMain && (
        <div className="absolute top-3 right-3 z-20">
          <Badge className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg">
            <Mic className="w-3 h-3 mr-1" />
            Main Audio
          </Badge>
        </div>
      )}
      
      {/* Animated background effect */}
      <div className={`absolute inset-0 ${typeGradient} opacity-0 group-hover:opacity-10 transition-all duration-700`} />
      
      <CardContent className="p-0 relative z-10">
        <div className={`h-48 flex items-center justify-center ${typeColor} rounded-t-2xl relative overflow-hidden`}>
          {renderPreview()}
          
          {/* Audio play overlay */}
          {fileType === "audio" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Button
                onClick={handleAudioPlay}
                size="lg"
                className={`rounded-full ${isPlaying ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'} text-white shadow-xl`}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-rose-700 transition-colors duration-300">
                {file?.name}
              </p>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-2">
                {file?.size ? formatFileSize(file.size) : 'Unknown size'}
                {file?.name?.toLowerCase().endsWith('.webm') && (
                  <span className="text-emerald-600 font-medium">• WEBM</span>
                )}
                {isAudioMain && (
                  <span className="text-emerald-600 font-medium">• Voice Instructions</span>
                )}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge 
                className={`text-[10px] font-bold px-2 py-1 bg-gradient-to-r ${fileColor.split(' ').slice(0, 3).join(' ')} border-0 text-white shadow-md`}
              >
                {getTypeLabel(fileType)}
              </Badge>
              <Eye size={14} className="text-gray-400 group-hover:text-rose-500 transition-colors" />
            </div>
          </div>
          
          {/* Progress bar effect */}
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${fileColor.split(' ')[0]} transition-all duration-1000 group-hover:w-full w-0`}
            />
          </div>
          
          {/* Action buttons on hover */}
          <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-gray-600 hover:text-rose-700 hover:bg-rose-50"
              >
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              {fileType === "audio" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAudioPlay}
                  className="h-8 px-2 text-xs text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Play
                    </>
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadFile(url, file.name);
                }}
                className="h-8 px-2 text-xs text-gray-600 hover:text-emerald-700 hover:bg-emerald-50"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
       
          </div>
        </div>
      </CardContent>
      
      {/* Selection indicator */}
      {isHovered && (
        <div className="absolute top-2 left-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 flex items-center justify-center shadow-lg">
            <Eye className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
    </Card>
  );
};

// Helper function for downloading files
const downloadFile = (fileUrl, fileName) => {
  if (!fileUrl) return;
  
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = fileName || "download";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Advanced Audio Player Component
const AdvancedAudioPlayer = ({ audioFiles, taskTitle }) => {
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVisualizer, setShowVisualizer] = useState(true);
  const [repeatMode, setRepeatMode] = useState('none'); // 'none', 'one', 'all'
  const [shuffleMode, setShuffleMode] = useState(false);
  
  const audioRef = useRef(null);
  const visualizerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);
  
  const currentTrack = audioFiles[currentTrackIndex];

  useEffect(() => {
    if (showVisualizer) {
      const initAudioContext = async () => {
        try {
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          
          if (audioRef.current) {
            sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.connect(audioContextRef.current.destination);
          }
        } catch (error) {
          console.error("Error initializing audio context:", error);
          setShowVisualizer(false);
        }
      };
      
      initAudioContext();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [showVisualizer]);

  useEffect(() => {
    if (!showVisualizer || !visualizerRef.current || !analyserRef.current) return;

    const canvas = visualizerRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "rgba(16, 185, 129, 0.1)");
      gradient.addColorStop(1, "rgba(16, 185, 129, 0.05)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 2) + 10;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#10b981");
        gradient.addColorStop(0.5, "#059669");
        gradient.addColorStop(1, "#047857");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    
    draw();
  }, [showVisualizer]);

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(console.error);
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(progress);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      const time = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(value[0]);
    }
  };

  const handleVolumeChange = (value) => {
    const newVolume = value[0] / 100;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    const muted = !isMuted;
    setIsMuted(muted);
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  };

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    const newRate = rates[nextIndex];
    
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const nextTrack = () => {
    if (shuffleMode) {
      const randomIndex = Math.floor(Math.random() * audioFiles.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((prev) => 
        repeatMode === 'one' ? prev : (prev + 1) % audioFiles.length
      );
    }
  };

  const prevTrack = () => {
    if (shuffleMode) {
      const randomIndex = Math.floor(Math.random() * audioFiles.length);
      setCurrentTrackIndex(randomIndex);
    } else {
      setCurrentTrackIndex((prev) => 
        repeatMode === 'one' ? prev : (prev - 1 + audioFiles.length) % audioFiles.length
      );
    }
  };

  const handleEnded = () => {
    if (repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (repeatMode === 'all') {
      nextTrack();
    } else if (currentTrackIndex < audioFiles.length - 1) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-transparent rounded-2xl p-6 border border-emerald-200">
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        {/* Track Info */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-500/20 to-teal-600/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Music className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="absolute -inset-2 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-xl animate-pulse" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-900 text-lg">
              {currentTrack?.name || `Audio Track ${currentTrackIndex + 1}`}
            </h4>
            <p className="text-sm text-emerald-600/70">
              {audioFiles.length > 1 ? `Track ${currentTrackIndex + 1} of ${audioFiles.length}` : 'Voice Instructions'}
              {taskTitle && ` • ${taskTitle}`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {formatTime(duration)} • {currentTrack?.size ? formatFileSize(currentTrack.size) : 'Unknown size'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={showVisualizer}
                onCheckedChange={setShowVisualizer}
                className="data-[state=checked]:bg-emerald-600"
              />
              <Label className="text-sm text-emerald-700">Visualizer</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShuffleMode(!shuffleMode)}
                className={`${shuffleMode ? 'bg-emerald-500/10 text-emerald-700' : 'text-gray-600'} hover:bg-emerald-500/10`}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setRepeatMode(repeatMode === 'none' ? 'all' : repeatMode === 'all' ? 'one' : 'none')}
                className={`${
                  repeatMode === 'all' || repeatMode === 'one' 
                    ? 'bg-emerald-500/10 text-emerald-700' 
                    : 'text-gray-600'
                } hover:bg-emerald-500/10`}
              >
                <RepeatModeIcon mode={repeatMode} />
              </Button>
            </div>
          </div>

          {/* Visualizer */}
          {showVisualizer && (
            <div className="mb-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-300">
              <canvas
                ref={visualizerRef}
                width={800}
                height={100}
                className="w-full h-20 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Player Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={prevTrack}
              variant="ghost"
              size="icon"
              className="hover:bg-emerald-500/10 text-emerald-700"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={handlePlay}
              size="lg"
              className={`gap-3 px-6 rounded-xl shadow-lg ${
                isPlaying
                  ? "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
              } text-white`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  Play
                </>
              )}
            </Button>
            
            <Button
              onClick={nextTrack}
              variant="ghost"
              size="icon"
              className="hover:bg-emerald-500/10 text-emerald-700"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleMute}
                className="hover:bg-emerald-500/10 text-emerald-700"
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : 
                 volume > 0.5 ? <Volume2 className="w-5 h-5" /> : 
                 <Volume1 className="w-5 h-5" />}
              </Button>
              
              <div className="w-32">
                <Slider
                  value={[volume * 100]}
                  max={100}
                  step={1}
                  onValueChange={handleVolumeChange}
                  className="[&>span]:bg-gradient-to-r [&>span]:from-emerald-500 [&>span]:to-teal-600"
                />
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={changePlaybackRate}
              className="text-emerald-700 hover:bg-emerald-500/10"
            >
              {playbackRate.toFixed(2)}x
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[progress]}
            max={100}
            step={0.1}
            onValueChange={handleSeek}
            className="[&>span]:bg-gradient-to-r [&>span]:from-emerald-500 [&>span]:to-emerald-600"
          />
          <div className="flex justify-between text-sm text-emerald-600/70">
            <span>{formatTime((progress / 100) * duration)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        
        {/* Playlist (if multiple audio files) */}
        {audioFiles.length > 1 && (
          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Playlist ({audioFiles.length} tracks)</h5>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
              {audioFiles.map((audio, index) => (
                <div
                  key={index}
                  onClick={() => setCurrentTrackIndex(index)}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    index === currentTrackIndex
                      ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    index === currentTrackIndex 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {audio.name || `Audio ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(audio.size)} • {audio.duration ? formatTime(audio.duration) : '--:--'}
                    </p>
                  </div>
                  {index === currentTrackIndex && isPlaying && (
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-1 bg-emerald-500 rounded-full animate-pulse"
                          style={{
                            height: `${i * 6}px`,
                            animationDelay: `${i * 0.1}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Hidden Audio Element */}
        <audio
          ref={audioRef}
          src={currentTrack?.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          className="hidden"
        />
      </div>
    </div>
  );
};

const RepeatModeIcon = ({ mode }) => {
  if (mode === 'one') return <RefreshCw className="w-4 h-4" />;
  if (mode === 'all') return <RefreshCw className="w-4 h-4" />;
  return <RefreshCw className="w-4 h-4 opacity-50" />;
};

// Main Component - MediaSection
export default function MediaSection({ task }) {
  const [previewFile, setPreviewFile] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    totalSize: 0,
    videoCount: 0,
    audioCount: 0,
    imageCount: 0,
    documentCount: 0,
    otherCount: 0
  });
  const [allFiles, setAllFiles] = useState([]);
  const [audioFiles, setAudioFiles] = useState([]);
  const [otherFiles, setOtherFiles] = useState([]);

  // Prepare all files - moved to useEffect
  useEffect(() => {
    const prepareFiles = () => {
      const files = [];
      const audioFilesList = [];
      let totalSize = 0;
      const counts = { video: 0, audio: 0, image: 0, document: 0, other: 0 };
      
      // Add audio files from audioFiles array (new structure)
      if (task?.audioFiles && Array.isArray(task.audioFiles)) {
        task.audioFiles.forEach((audioFile, index) => {
          const audioFileObj = {
            id: `audio-${index}`,
            name: audioFile.name || `🎙️ Voice Instructions ${index + 1}`,
            url: audioFile.url,
            type: audioFile.type || 'audio/mpeg',
            size: audioFile.size || 1024 * 1024 * 5,
            duration: audioFile.duration || 0,
            isAudio: true,
            isMain: index === 0,
            uploadedAt: audioFile.createdAt || audioFile.uploadedAt || new Date().toISOString(),
            isPinned: true
          };
          files.push(audioFileObj);
          audioFilesList.push(audioFileObj);
          totalSize += audioFileObj.size;
          counts.audio++;
        });
      }
      
      // Add legacy audioUrl (for backward compatibility)
      if (task?.audioUrl && !task.audioFiles) {
        const audioUrl = task.audioUrl;
        const audioName = audioUrl.split('/').pop() || 'audio_recording.mp3';
        const audioFile = {
          id: 'audio-main',
          name: `🎙️ Voice Instructions - ${task.title || 'Task'}`,
          url: audioUrl,
          type: 'audio/mpeg',
          size: 1024 * 1024 * 5, // 5MB estimated
          isAudio: true,
          isMain: true,
          uploadedAt: new Date().toISOString(),
          isPinned: true
        };
        files.push(audioFile);
        audioFilesList.push(audioFile);
        totalSize += audioFile.size;
        counts.audio++;
      }
      
      // Add file attachments
      if (task?.fileAttachments) {
        if (Array.isArray(task.fileAttachments)) {
          task.fileAttachments.forEach((file, index) => {
            const fileObj = {
              id: `file-${index}`,
              name: file.name || file.fileName || `File ${index + 1}`,
              url: file.url || file.path,
              type: file.type || 'application/octet-stream',
              size: file.size || 1024 * 1024 * 2, // 2MB estimated
              uploadedAt: file.uploadedAt || file.createdAt || new Date().toISOString(),
              isPinned: false
            };
            files.push(fileObj);
            totalSize += fileObj.size;
            
            const fileType = getFileType(fileObj.name, fileObj.type);
            if (['video', 'audio', 'image'].includes(fileType)) {
              counts[fileType]++;
            } else if (['pdf', 'doc', 'excel', 'powerpoint', 'text', 'archive', 'code'].includes(fileType)) {
              counts.document++;
            } else {
              counts.other++;
            }
          });
        } else {
          const fileObj = {
            id: 'file-single',
            name: task.fileAttachments.name || "📄 Supporting Document",
            url: task.fileAttachments.url || task.fileAttachments.path,
            type: task.fileAttachments.type || 'application/octet-stream',
            size: task.fileAttachments.size || 1024 * 1024 * 3, // 3MB estimated
            uploadedAt: task.fileAttachments.uploadedAt || task.fileAttachments.createdAt || new Date().toISOString(),
            isPinned: false
          };
          files.push(fileObj);
          totalSize += fileObj.size;
          counts.document++;
        }
      }
      
      setAllFiles(files);
      setAudioFiles(audioFilesList);
      setOtherFiles(files.filter(f => !f.isAudio));
      setStats({
        totalSize,
        videoCount: counts.video,
        audioCount: counts.audio,
        imageCount: counts.image,
        documentCount: counts.document,
        otherCount: counts.other
      });
    };
    
    prepareFiles();
  }, [task]);

  // Filter and sort files - useMemo to prevent recalculating on every render
  const filteredFiles = useMemo(() => {
    let filesToFilter = allFiles;
    
    // Apply tab filter
    if (activeTab === "audio") {
      filesToFilter = allFiles.filter(f => f.isAudio);
    } else if (activeTab === "documents") {
      filesToFilter = allFiles.filter(f => {
        const fileType = getFileType(f.name, f.type);
        return ['pdf', 'doc', 'excel', 'powerpoint', 'text', 'archive', 'code'].includes(fileType);
      });
    } else if (activeTab === "media") {
      filesToFilter = allFiles.filter(f => {
        const fileType = getFileType(f.name, f.type);
        return ['video', 'image', 'audio'].includes(fileType);
      });
    }
    
    return filesToFilter.filter(file => {
      if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filterType !== "all") {
        const fileType = getFileType(file.name, file.type);
        if (fileType !== filterType) return false;
      }
      
      return true;
    }).sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        case "date":
          aValue = new Date(a.uploadedAt);
          bValue = new Date(b.uploadedAt);
          break;
        case "type":
          aValue = getFileType(a.name, a.type);
          bValue = getFileType(b.name, b.type);
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (sortOrder === "desc") {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });
  }, [allFiles, searchQuery, filterType, sortBy, sortOrder, activeTab]);

  const openPreview = (file) => {
    setPreviewFile(file);
    setZoom(1);
    setRotation(0);
  };

  const renderPreviewModal = () => {
    if (!previewFile) return null;
    
    const { url, name, type } = previewFile;
    const fileType = getFileType(name, type);
    const isImage = fileType === "image";
    const isVideo = fileType === "video";
    const isAudio = fileType === "audio";
    const isPdf = fileType === "pdf";
    const fileColor = getFileColor(fileType);

    return (
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-6xl bg-white border border-gray-200 p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${fileColor}`}>
                {getFileIcon(fileType, "w-7 h-7 text-white")}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 truncate max-w-lg">{name}</h3>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <Badge className={`bg-gradient-to-r ${fileColor.split(' ').slice(0, 3).join(' ')} border-0 text-white`}>
                    {getTypeLabel(fileType)}
                  </Badge>
                  <span>•</span>
                  <span>{formatFileSize(previewFile.size || 0)}</span>
                  <span>•</span>
                  <span>{previewFile.uploadedAt ? new Date(previewFile.uploadedAt).toLocaleDateString() : 'Just now'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(isImage || isVideo) && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="hover:bg-rose-50 text-rose-600 border border-rose-200"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                    className="hover:bg-amber-50 text-amber-600 border border-amber-200"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                  <span className="text-gray-900 text-sm min-w-[60px] text-center bg-gray-100 px-3 py-1 rounded-lg">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                    className="hover:bg-emerald-50 text-emerald-600 border border-emerald-200"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => downloadFile(url, name)}
                className="hover:bg-emerald-50 text-emerald-600 border border-emerald-200"
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewFile(null)}
                className="hover:bg-rose-50 text-rose-600 border border-rose-200"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="p-6 overflow-auto max-h-[calc(90vh-120px)] flex items-center justify-center">
            {isImage ? (
              <div className="relative">
                <img
                  src={url}
                  alt={name}
                  className="rounded-2xl shadow-xl max-w-full max-h-[70vh] object-contain transition-all duration-300"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    boxShadow: '0 25px 50px -12px rgba(225, 29, 72, 0.15)'
                  }}
                />
              </div>
            ) : isVideo ? (
              <div className="relative w-full max-w-4xl">
                <video
                  src={url}
                  controls
                  className="rounded-2xl shadow-xl w-full max-h-[70vh] shadow-rose-200"
                />
              </div>
            ) : isAudio ? (
              <div className="w-full max-w-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-8 border border-emerald-200">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Music className="w-16 h-16 text-emerald-600" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 to-transparent rounded-full animate-ping" />
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-bold text-emerald-900">{name}</h4>
                    <p className="text-emerald-700/70 text-sm">Audio File • Professional Recording</p>
                  </div>
                  <audio src={url} controls className="w-full bg-white/50 rounded-xl border border-gray-200" />
                </div>
              </div>
            ) : isPdf ? (
              <iframe
                src={url}
                className="w-full h-[70vh] rounded-2xl shadow-xl shadow-rose-100"
                title={name}
              />
            ) : (
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border border-gray-300">
                    <File className="w-16 h-16 text-gray-600" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500/5 to-transparent rounded-2xl animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-gray-900">{name}</h4>
                  <p className="text-gray-600">
                    Preview not available for this file type
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (allFiles.length === 0) {
    return (
      <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl flex items-center justify-center">
                <FileVideo className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 to-red-500/10 blur-xl" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Media Files & Attachments
              </CardTitle>
              <CardDescription className="text-gray-600">
                No files available
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4 border border-gray-300">
            <File className="w-10 h-10 text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Files Found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            No media files or attachments are available for this task.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-200 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                  <FileVideo className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-rose-500/20 to-red-500/10 blur-xl" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Media Files & Attachments
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} • {formatFileSize(stats.totalSize)} total • Voice instructions and supporting documents
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-gradient-to-r from-rose-500/10 to-red-600/10 text-rose-700 border border-rose-200">
                <FileVideo className="w-3 h-3 mr-1" />
                {allFiles.length} Files
              </Badge>
              <Badge className="bg-gradient-to-r from-emerald-500/10 to-teal-600/10 text-emerald-700 border border-emerald-200">
                <Database className="w-3 h-3 mr-1" />
                {formatFileSize(stats.totalSize)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        {/* Stats Overview */}
        <div className="px-6 pb-6">
         

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-4 lg:grid-cols-5 bg-gray-100 p-1 rounded-xl gap-1">
  <TabsTrigger
    value="all"
    className="flex items-center justify-center gap-2 px-3 py-2 text-gray-700 rounded-lg
               data-[state=active]:bg-gradient-to-r
               data-[state=active]:from-rose-500
               data-[state=active]:to-red-600
               data-[state=active]:text-white
               data-[state=active]:shadow-md
               hover:bg-gray-200 transition-colors duration-200"
  >
    <Grid className="w-4 h-4" />
    <span>All Files</span>
  </TabsTrigger>

  <TabsTrigger
    value="audio"
    className="flex items-center justify-center gap-2 px-3 py-2 text-gray-700 rounded-lg
               data-[state=active]:bg-gradient-to-r
               data-[state=active]:from-emerald-500
               data-[state=active]:to-teal-600
               data-[state=active]:text-white
               data-[state=active]:shadow-md
               hover:bg-gray-200 transition-colors duration-200"
  >
    <Music className="w-4 h-4" />
    <span>Audio ({stats.audioCount})</span>
  </TabsTrigger>

  <TabsTrigger
    value="media"
    className="flex items-center justify-center gap-2 px-3 py-2 text-gray-700 rounded-lg
               data-[state=active]:bg-gradient-to-r
               data-[state=active]:from-amber-500
               data-[state=active]:to-orange-600
               data-[state=active]:text-white
               data-[state=active]:shadow-md
               hover:bg-gray-200 transition-colors duration-200"
  >
    <Film className="w-4 h-4" />
    <span>Media ({stats.videoCount + stats.imageCount})</span>
  </TabsTrigger>

  <TabsTrigger
    value="documents"
    className="flex items-center justify-center gap-2 px-3 py-2 text-gray-700 rounded-lg
               data-[state=active]:bg-gradient-to-r
               data-[state=active]:from-blue-500
               data-[state=active]:to-sky-600
               data-[state=active]:text-white
               data-[state=active]:shadow-md
               hover:bg-gray-200 transition-colors duration-200"
  >
    <File className="w-4 h-4" />
    <span>Documents ({stats.documentCount + stats.otherCount})</span>
  </TabsTrigger>
</TabsList>

          </Tabs>

          {/* Advanced Audio Player */}
          

       

          {/* Files Grid/List */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {activeTab === "all" ? "All Files" : 
                 activeTab === "audio" ? "Audio Files" :
                 activeTab === "media" ? "Media Files" : 
                 "Documents"} ({filteredFiles.length})
              </h3>
              <div className="text-sm text-gray-600">
                Showing {filteredFiles.length} of {allFiles.length} files
              </div>
            </div>
            
            {filteredFiles.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {filteredFiles.map((file, index) => (
                    <FileCard 
                      key={file.id || index} 
                      file={file} 
                      onClick={() => openPreview(file)}
                      viewMode={viewMode}
                      isAudioMain={file.isMain}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFiles.map((file, index) => (
                    <FileCard 
                      key={file.id || index} 
                      file={file} 
                      onClick={() => openPreview(file)}
                      viewMode={viewMode}
                      isAudioMain={file.isMain}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4 border border-gray-300">
                  <File className="w-10 h-10 text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Files Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No files match your search criteria. Try adjusting your filters or select a different tab.
                </p>
              </div>
            )}
          </div>
        </div>
        
        
      </Card>
      
      {/* File Preview Modal */}
      {renderPreviewModal()}
    </>
  );
}