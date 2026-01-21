// MediaFiles.jsx - Unified Premium Component
"use client";
import React, { useState, useRef, useEffect } from "react";
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
  AudioLines,
  FileText,
  Download,
  Play,
  Pause,
  Music,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  File,
  FileSpreadsheet,
  FileType,
  Video,
  Eye,
  Maximize2,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Loader2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock,
  Headphones,
  Waves,
  FileArchive,
  FileCode,
  Film,
  X,
  SkipBack,
  SkipForward,
  VolumeX,
  Search,
  Grid,
  List,
  Filter,
  SortAsc,
  SortDesc,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// File type detection utilities
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

const getFileIcon = (type, className = "w-6 h-6") => {
  switch (type) {
    case "video": return <Film className={className} />;
    case "image": return <ImageIcon className={className} />;
    case "audio": return <Music className={className} />;
    case "pdf": return <FileText className={className} />;
    case "doc": return <FileType className={className} />;
    case "excel": return <FileSpreadsheet className={className} />;
    case "powerpoint": return <FileText className={className} />;
    case "text": return <FileText className={className} />;
    case "archive": return <FileArchive className={className} />;
    case "code": return <FileCode className={className} />;
    default: return <File className={className} />;
  }
};

const getFileColor = (type) => {
  switch (type) {
    case "video": return "from-purple-500 to-violet-600";
    case "audio": return "from-amber-500 to-orange-600";
    case "image": return "from-emerald-500 to-teal-600";
    case "pdf": return "from-red-500 to-rose-600";
    case "doc": return "from-blue-500 to-cyan-600";
    case "excel": return "from-green-500 to-lime-600";
    case "powerpoint": return "from-orange-500 to-amber-600";
    case "text": return "from-gray-500 to-gray-600";
    case "archive": return "from-indigo-500 to-purple-600";
    case "code": return "from-yellow-500 to-amber-600";
    default: return "from-gray-500 to-gray-600";
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
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

// Enhanced File Card Component
const FileCard = ({ file, onClick, viewMode = "grid" }) => {
  const [detectedType, setDetectedType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const url = file?.url || file?.path;
  const initialFileType = getFileType(file?.name, file?.type, url);
  const fileType = detectedType || initialFileType;
  const typeColor = getTypeColor(fileType);
  const typeGradient = getTypeGradient(fileType);
  const fileColor = getFileColor(fileType);

  // Detect WEBM type on mount
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

  if (viewMode === "list") {
    return (
      <div
        className="group bg-white hover:bg-gray-100 rounded-xl p-4 border border-gray-200 hover:border-purple-500 transition-all duration-300 shadow-sm"
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${fileColor}`}>
              {getFileIcon(fileType)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">
                {file.name}
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant="outline" className="text-xs border-gray-700 text-gray-400">
                  {getTypeLabel(fileType)}
                </Badge>
                <span className="text-sm text-gray-500">
                  {formatFileSize(file.size)}
                </span>
                <span className="text-xs text-gray-500">•</span>
                <span className="text-sm text-gray-500">
                  {new Date(file.uploadedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-500/20 text-purple-600"
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
              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-purple-500/20 text-purple-600"
            >
              <Download className="w-4 h-4" />
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
      className="cursor-pointer group relative overflow-hidden bg-white border border-gray-200 hover:border-purple-500 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 rounded-2xl"
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

        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                {file?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {file?.size ? formatFileSize(file.size) : 'Unknown size'}
                {file?.name?.toLowerCase().endsWith('.webm') && (
                  <span className="ml-2 text-amber-600">• WEBM</span>
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
              <Eye size={14} className="text-gray-400 group-hover:text-purple-600 transition-colors" />
            </div>
          </div>
          
          {/* Progress bar effect */}
          <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full ${typeColor.split(' ')[0]} transition-all duration-1000 group-hover:w-full w-0`}
            />
          </div>
        </div>
      </CardContent>
      
      {/* Corner accent */}
      <div className={`absolute top-0 right-0 w-12 h-12 ${typeColor.split(' ')[0]} opacity-20 blur-xl`} />
    </Card>
  );
};

// Main Component
export default function MediaFiles({ task }) {
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioVolume, setAudioVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showAudioVisualizer, setShowAudioVisualizer] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [viewMode, setViewMode] = useState("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  
  const audioRef = useRef(null);
  const visualizerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const animationRef = useRef(null);

  // Prepare all files
  const getAllFiles = () => {
    const files = [];
    
    // Add audio file if exists
    if (task?.audioUrl) {
      const audioName = task.audioUrl.split('/').pop() || 'audio_recording.mp3';
      files.push({
        id: 'audio-main',
        name: `Voice Instructions - ${task.title}`,
        url: task.audioUrl,
        type: 'audio/mpeg',
        size: 0,
        isAudio: true,
        uploadedAt: new Date().toISOString()
      });
    }
    
    // Add file attachments
    if (task?.fileAttachments) {
      if (Array.isArray(task.fileAttachments)) {
        task.fileAttachments.forEach((file, index) => {
          files.push({
            id: `file-${index}`,
            name: file.name || file.fileName || `File ${index + 1}`,
            url: file.url || file.path,
            type: file.type || 'application/octet-stream',
            size: file.size || 0,
            uploadedAt: file.uploadedAt || new Date().toISOString()
          });
        });
      } else {
        files.push({
          id: 'file-single',
          name: task.fileAttachments.name || "Supporting Document",
          url: task.fileAttachments.url || task.fileAttachments.path,
          type: task.fileAttachments.type || 'application/octet-stream',
          size: task.fileAttachments.size || 0,
          uploadedAt: task.fileAttachments.uploadedAt || new Date().toISOString()
        });
      }
    }
    
    return files;
  };

  const allFiles = getAllFiles();
  
  // Filter and sort files
  const filteredFiles = allFiles.filter(file => {
    // Search filter
    if (searchQuery && !file.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Type filter
    if (filterType !== "all") {
      const fileType = getFileType(file.name, file.type);
      if (fileType !== filterType) return false;
    }
    
    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "size":
        return (b.size || 0) - (a.size || 0);
      case "date":
        return new Date(b.uploadedAt) - new Date(a.uploadedAt);
      case "type":
        return getFileType(a.name, a.type).localeCompare(getFileType(b.name, b.type));
      default:
        return 0;
    }
  });

  // Audio context initialization
  useEffect(() => {
    if (showAudioVisualizer) {
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
          setShowAudioVisualizer(false);
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
  }, [showAudioVisualizer]);

  // Audio visualizer drawing
  useEffect(() => {
    if (!showAudioVisualizer || !visualizerRef.current || !analyserRef.current) return;

    const canvas = visualizerRef.current;
    const ctx = canvas.getContext("2d");
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;
      
      for (let i = 0; i < bufferLength; i++) {
        const barHeight = dataArray[i] / 2;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#f59e0b");
        gradient.addColorStop(0.5, "#f97316");
        gradient.addColorStop(1, "#ea580c");
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };
    
    draw();
  }, [showAudioVisualizer]);

  // Audio handlers
  const playAudio = () => {
    if (audioPlaying) {
      audioRef.current?.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current?.play().catch(console.error);
      setAudioPlaying(true);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setAudioProgress(progress);
    }
  };

  const handleAudioLoaded = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (value) => {
    if (audioRef.current) {
      const time = (value[0] / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setAudioProgress(value[0]);
    }
  };

  const handleVolumeChange = (value) => {
    const volume = value[0];
    setAudioVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = volume;
      setIsMuted(volume === 0);
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

  const downloadFile = (fileUrl, fileName) => {
    if (!fileUrl) return;
    
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <DialogContent className="max-w-6xl bg-[#0b0b0b] border border-[#222] p-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-black">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg bg-gradient-to-r ${fileColor}`}>
                {getFileIcon(fileType)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white truncate max-w-lg">{name}</h3>
                <p className="text-gray-400 text-sm">
                  {getTypeLabel(fileType)} • {formatFileSize(previewFile.size || 0)}
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
                    className="hover:bg-white/10 text-white"
                  >
                    <RotateCw className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))}
                    className="hover:bg-white/10 text-white"
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                  <span className="text-white text-sm min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}
                    className="hover:bg-white/10 text-white"
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => downloadFile(url, name)}
                className="hover:bg-white/10 text-white"
              >
                <Download className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setPreviewFile(null)}
                className="hover:bg-red-500/20 text-white"
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
                  className="rounded-xl shadow-2xl max-w-full max-h-[70vh] object-contain transition-transform duration-300"
                  style={{
                    transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  }}
                />
              </div>
            ) : isVideo ? (
              <div className="relative w-full max-w-4xl">
                <video
                  src={url}
                  controls
                  className="rounded-xl shadow-2xl w-full max-h-[70vh]"
                />
              </div>
            ) : isAudio ? (
              <div className="w-full max-w-2xl bg-gradient-to-br from-amber-900/30 to-orange-900/20 rounded-2xl p-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-full flex items-center justify-center backdrop-blur-lg">
                      <Music className="w-16 h-16 text-amber-300" />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-bold text-amber-100">{name}</h4>
                    <p className="text-amber-300/70">Audio File</p>
                  </div>
                  <audio src={url} controls className="w-full" />
                </div>
              </div>
            ) : isPdf ? (
              <iframe
                src={url}
                className="w-full h-[70vh] rounded-xl"
                title={name}
              />
            ) : (
              <div className="text-center space-y-6">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center">
                    <File className="w-16 h-16 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-bold text-white">{name}</h4>
                  <p className="text-gray-400">
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

  if (allFiles.length === 0) return null;

  return (
    <>
      <Card className="border-0 shadow-xl bg-white rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-200 pb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <FileVideo className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-violet-600/10 blur-xl" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  Media Files & Attachments
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {allFiles.length} file{allFiles.length !== 1 ? 's' : ''} • Voice instructions and supporting documents
                </CardDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-gradient-to-r from-purple-500/20 to-violet-600/20 text-purple-600 border-purple-500/30">
                <FileText className="w-3 h-3 mr-1" />
                {allFiles.length} Files
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Controls Bar */}
          

          {/* Audio Player Section */}
          {task?.audioUrl && (
            <div className="mb-8 bg-gradient-to-br from-amber-50 via-orange-50 to-transparent rounded-xl p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-r from-amber-600/30 to-orange-600/30 rounded-xl flex items-center justify-center">
                    <Headphones className="w-7 h-7 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">Voice Instructions</h4>
                    <p className="text-sm text-amber-600/70">Professional audio guidance</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAudioVisualizer(!showAudioVisualizer)}
                  className={`border ${showAudioVisualizer ? 'border-amber-500 bg-amber-500/10' : 'border-amber-200'} text-amber-700 hover:bg-amber-100`}
                >
                  {showAudioVisualizer ? "Hide Visualizer" : "Show Visualizer"}
                </Button>
              </div>
              
              {/* Audio Visualizer */}
              {showAudioVisualizer && (
                <div className="mb-6 bg-black/50 rounded-xl p-4">
                  <canvas
                    ref={visualizerRef}
                    width={800}
                    height={100}
                    className="w-full h-20 rounded-lg"
                  />
                </div>
              )}
              
              {/* Audio Controls */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={playAudio}
                      size="lg"
                      className={`gap-3 px-6 ${
                        audioPlaying
                          ? "bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700"
                          : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                      } text-white shadow-lg`}
                    >
                      {audioPlaying ? (
                        <>
                          <Pause className="w-5 h-5" />
                          Pause Audio
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5" />
                          Play Instructions
                        </>
                      )}
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleMute}
                        className="hover:bg-amber-500/20 text-amber-600"
                      >
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </Button>
                      
                      <div className="w-32">
                        <Slider
                          value={[audioVolume * 100]}
                          max={100}
                          step={1}
                          onValueChange={handleVolumeChange}
                          className="[&>span]:bg-amber-500"
                        />
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={changePlaybackRate}
                        className="text-amber-600 hover:bg-amber-500/20"
                      >
                        {playbackRate.toFixed(2)}x
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-amber-600">
                      {audioDuration > 0 ? (
                        <>
                          <Clock className="w-4 h-4 inline mr-1" />
                          {formatDuration(audioDuration)}
                        </>
                      ) : (
                        "Loading..."
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="space-y-2">
                  <Slider
                    value={[audioProgress]}
                    max={100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="[&>span]:bg-amber-500"
                  />
                  <div className="flex justify-between text-sm text-amber-600/70">
                    <span>{formatDuration((audioProgress / 100) * audioDuration)}</span>
                    <span>{formatDuration(audioDuration)}</span>
                  </div>
                </div>
                
                {/* Hidden Audio Element */}
                <audio
                  ref={audioRef}
                  src={task.audioUrl}
                  onTimeUpdate={handleAudioTimeUpdate}
                  onLoadedMetadata={handleAudioLoaded}
                  onEnded={() => setAudioPlaying(false)}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Files Grid/List */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Attached Files ({filteredFiles.length})
              </h3>
              <div className="text-sm text-gray-500">
                {filteredFiles.length} of {allFiles.length} files
              </div>
            </div>
            
            {filteredFiles.length > 0 ? (
              viewMode === "grid" ? (
                <div className="grid grid-cols-2 gap-4">
                  {filteredFiles.map((file, index) => (
                    <FileCard 
                      key={file.id || index} 
                      file={file} 
                      onClick={() => openPreview(file)}
                      viewMode={viewMode}
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
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                  <File className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Files Found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No files match your search criteria. Try adjusting your filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* File Preview Modal */}
      {renderPreviewModal()}
    </>
  );
}