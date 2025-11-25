"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Calendar,
  Eye,
  EyeOff,
  Pencil,
  MoreVertical,
  Trash2,
  FileText,
  Image,
  Video,
  File,
  Loader2,
  X,
  Check,
  Download,
  Play,
} from "lucide-react";
import axios from "axios";

export default function ManagerPostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPost, setSelectedPost] = useState(null);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    attachmentUrl: "",
    fileType: "",
    fileName: "",
  });

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    attachmentUrl: "",
    fileType: "",
    fileName: "",
    visible: false,
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/login");
      return;
    }

    fetchPosts();
  }, [session, status, router]);

  const fetchPosts = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/manager/manager-posts");
      if (response.data.success) {
        setPosts(response.data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast.error("Failed to fetch posts");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.title) {
      toast.error("Please enter a title");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/manager/manager-posts", formData);

      if (response.data.success) {
        toast.success("Post created successfully!");
        resetForm();
        fetchPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      attachmentUrl: "",
      fileType: "",
      fileName: "",
    });
    setShowForm(false);
  };

  const handleEdit = (post) => {
    setSelectedPost(post);
    setEditFormData({
      title: post.title || "",
      description: post.description || "",
      attachmentUrl: "",
      fileType: "",
      fileName: "",
      visible: post.visible || false,
    });
    setEditDialogOpen(true);
  };

  const handleView = (post) => {
    setSelectedPost(post);
    setViewDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedPost) return;

    setLoading(true);
    try {
      const updateData = {
        ...editFormData,
        // Only include attachmentUrl if a new file was uploaded
        attachmentUrl: editFormData.attachmentUrl || selectedPost.attachmentUrl,
        fileType: editFormData.fileType || selectedPost.attachmentType,
      };

      const response = await axios.patch(
        `/api/manager/manager-posts/${selectedPost._id}`,
        updateData
      );

      if (response.data.success) {
        toast.success("Post updated successfully!");
        setEditDialogOpen(false);
        fetchPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update post");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await axios.delete(`/api/manager/manager-posts/${postId}`);
      if (response.data.success) {
        toast.success("Post deleted successfully!");
        fetchPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete post");
    }
  };

  const handleVisibilityToggle = async (postId, currentVisibility) => {
    try {
      const response = await axios.patch(`/api/manager/manager-posts/${postId}`, {
        visible: !currentVisibility,
      });

      if (response.data.success) {
        toast.success(`Post ${!currentVisibility ? 'published' : 'hidden'} successfully!`);
        fetchPosts();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update post visibility");
    }
  };

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'file';
  };

  const handleFileUpload = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        toast.error("File size should be less than 50MB");
        return;
      }

      const fileType = getFileType(file);
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (isEdit) {
          setEditFormData((prev) => ({
            ...prev,
            attachmentUrl: reader.result,
            fileType: fileType,
            fileName: file.name,
          }));
          toast.success(`${fileType === 'image' ? 'Image' : fileType === 'video' ? 'Video' : 'File'} attached successfully!`);
        } else {
          setFormData((prev) => ({ 
            ...prev, 
            attachmentUrl: reader.result,
            fileType: fileType,
            fileName: file.name,
          }));
          toast.success(`${fileType === 'image' ? 'Image' : fileType === 'video' ? 'Video' : 'File'} attached successfully!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFileAttachment = (isEdit = false) => {
    if (isEdit) {
      setEditFormData((prev) => ({ 
        ...prev, 
        attachmentUrl: "",
        fileType: "",
        fileName: "" 
      }));
      toast.info("File removed");
    } else {
      setFormData((prev) => ({ 
        ...prev, 
        attachmentUrl: "",
        fileType: "",
        fileName: "" 
      }));
      toast.info("File removed");
    }
  };

  const downloadFile = (fileUrl, fileName = "attachment") => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const getFileBadgeColor = (fileType) => {
    switch (fileType) {
      case 'image':
        return "border-green-300 text-green-700 bg-green-50";
      case 'video':
        return "border-purple-300 text-purple-700 bg-purple-50";
      default:
        return "border-blue-300 text-blue-700 bg-blue-50";
    }
  };

  const renderFilePreview = (attachmentUrl, fileType, fileName, isEdit = false) => {
    if (!attachmentUrl) return null;

    const baseClass = "w-full rounded-lg border border-gray-200";
    
    switch (fileType) {
      case 'image':
        return (
          <div className="space-y-3">
            <img 
              src={attachmentUrl} 
              alt={fileName || "Attachment"} 
              className={`${baseClass} max-h-64 object-cover`}
            />
            <p className="text-sm text-gray-600 text-center">{fileName}</p>
          </div>
        );
      case 'video':
        return (
          <div className="space-y-3">
            <video 
              controls 
              className={`${baseClass} max-h-64`}
              poster={attachmentUrl} // You can add a thumbnail later
            >
              <source src={attachmentUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="text-sm text-gray-600 text-center">{fileName}</p>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <File className="w-8 h-8 text-gray-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{fileName || "File Attachment"}</p>
              <p className="text-sm text-gray-600">Click to download</p>
            </div>
          </div>
        );
    }
  };

  const renderExistingFilePreview = (post) => {
    if (!post.attachmentUrl) return null;

    // Determine file type from URL or use attachmentType
    const fileType = post.attachmentType || 
      (post.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 
       post.attachmentUrl.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? 'video' : 'file');

    const baseClass = "w-full rounded-lg border border-gray-200";
    
    switch (fileType) {
      case 'image':
        return (
          <div className="space-y-3">
            <img 
              src={post.attachmentUrl} 
              alt="Attachment" 
              className={`${baseClass} max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity`}
              onClick={() => window.open(post.attachmentUrl, '_blank')}
            />
          </div>
        );
      case 'video':
        return (
          <div className="space-y-3">
            <video 
              controls 
              className={`${baseClass} max-h-64`}
            >
              <source src={post.attachmentUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      default:
        return (
          <div 
            className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => window.open(post.attachmentUrl, '_blank')}
          >
            <File className="w-8 h-8 text-gray-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900">File Attachment</p>
              <p className="text-sm text-gray-600">Click to view/download</p>
            </div>
          </div>
        );
    }
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVisibilityBadge = (visible) => {
    return visible ? (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-sm font-semibold px-3 py-1.5 rounded-lg">
        <Eye className="w-3 h-3 mr-1" />
        Published
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-sm font-semibold px-3 py-1.5 rounded-lg">
        <EyeOff className="w-3 h-3 mr-1" />
        Hidden
      </Badge>
    );
  };

  const getPostFileType = (post) => {
    return post.attachmentType || 
      (post.attachmentUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? 'image' : 
       post.attachmentUrl?.match(/\.(mp4|mov|avi|mkv|webm)$/i) ? 'video' : 'file');
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-gray-700 text-lg font-medium">
            Loading Manager Panel...
          </span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Manager Posts
            </h1>
            <p className="text-gray-600 mt-3 text-base sm:text-lg max-w-2xl">
              Create and manage posts with images, videos, and file attachments
            </p>
          </div>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 px-8 py-3 rounded-xl font-semibold"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create Post
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Posts
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {posts.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Published
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {posts.filter((p) => p.visible).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Images
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {posts.filter((p) => getPostFileType(p) === 'image').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Image className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    With Videos
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {posts.filter((p) => getPostFileType(p) === 'video').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Video className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Post Form */}
        {showForm && (
          <Card className="mb-8 border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white text-2xl">
                    Create New Post
                  </CardTitle>
                  <CardDescription className="text-blue-100 text-base">
                    Add post content with images, videos, or file attachments
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label
                    htmlFor="title"
                    className="text-gray-700 font-semibold text-sm"
                  >
                    Post Title *
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="Enter post title"
                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label
                    htmlFor="description"
                    className="text-gray-700 font-semibold text-sm"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Enter post description"
                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-32 text-base rounded-xl resize-vertical"
                    rows={6}
                  />
                </div>

                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label
                    htmlFor="fileAttachments"
                    className="text-gray-700 font-semibold text-sm flex items-center gap-2"
                  >
                    <FileText className="w-5 h-5 text-blue-600" />
                    Attachment (Image, Video, or File)
                  </Label>
                  <Input
                    id="fileAttachments"
                    type="file"
                    onChange={(e) => handleFileUpload(e)}
                    className="rounded-xl border-gray-300 h-12"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  />
                  
                  {/* File Preview */}
                  {formData.attachmentUrl && (
                    <div className="space-y-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            {getFileIcon(formData.fileType)}
                          </div>
                          <div>
                            <p className="font-semibold text-green-800">
                              {formData.fileName || 'Attachment'}
                            </p>
                            <p className="text-sm text-green-600">
                              {formData.fileType === 'image' ? 'Image' : formData.fileType === 'video' ? 'Video' : 'File'} ready to upload
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeFileAttachment(false)}
                          className="rounded-lg border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                      
                      {/* Preview */}
                      {renderFilePreview(formData.attachmentUrl, formData.fileType, formData.fileName)}
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Supported: Images (JPEG, PNG, GIF), Videos (MP4, MOV), Documents (PDF, DOC, XLS) - Max 50MB
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating Post...
                      </>
                    ) : (
                      "Create Post"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="py-3 rounded-xl font-semibold text-base border-gray-300 text-gray-700 hover:bg-gray-50"
                    size="lg"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Posts List */}
        <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 border-b border-gray-200/50 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Posts
                </CardTitle>
                <CardDescription className="text-gray-600 text-base mt-2">
                  {posts.length} post{posts.length !== 1 ? "s" : ""} created
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search posts, descriptions..."
                  className="pl-12 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl bg-white/80"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-3 text-gray-600">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-lg font-medium">Loading posts...</span>
                </div>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <FileText className="w-24 h-24 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {posts.length === 0 ? "No posts yet" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                  {posts.length === 0
                    ? "Get started by creating your first post."
                    : "Try adjusting your search terms to find what you're looking for."}
                </p>
                {posts.length === 0 && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create First Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent border-b border-gray-200/50">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Post Details
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Attachment
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Status
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Created
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4 px-6 whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPosts.map((post) => {
                      const fileType = getPostFileType(post);
                      return (
                        <TableRow
                          key={post._id}
                          className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-300 border-b border-gray-100/50"
                        >
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                  <FileText className="w-6 h-6 text-white" />
                                </div>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200 truncate">
                                  {post.title}
                                </div>
                                <div className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {post.description || "No description"}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {post.attachmentUrl ? (
                              <Badge
                                variant="outline"
                                className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg ${getFileBadgeColor(fileType)}`}
                              >
                                {getFileIcon(fileType)}
                                {fileType === 'image' ? 'Image' : fileType === 'video' ? 'Video' : 'File'}
                              </Badge>
                            ) : (
                              <span className="text-sm text-gray-500 italic">No attachment</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {getVisibilityBadge(post.visible)}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-3 text-gray-600">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <span className="text-sm font-semibold">
                                {formatDate(post.createdAt)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVisibilityToggle(post._id, post.visible)}
                                className={`${
                                  post.visible 
                                    ? "border-orange-300 text-orange-700 hover:bg-orange-50" 
                                    : "border-green-300 text-green-700 hover:bg-green-50"
                                } rounded-lg font-semibold`}
                              >
                                {post.visible ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                                {post.visible ? "Hide" : "Publish"}
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100"
                                  >
                                    <MoreVertical className="h-5 w-5 text-gray-600" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-lg w-48"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleView(post)}
                                    className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                                  >
                                    <Eye className="w-4 h-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleEdit(post)}
                                    className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3"
                                  >
                                    <Pencil className="w-4 h-4" />
                                    Edit Post
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDelete(post._id)}
                                    className="text-red-600 cursor-pointer text-sm px-4 py-3 hover:bg-red-50 rounded-lg flex items-center gap-3"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Post Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-bold text-white">
                  Edit Post
                </DialogTitle>
                <DialogDescription className="text-blue-100 text-base mt-1">
                  Update post details and attachments
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditDialogOpen(false)}
                className="h-9 w-9 text-white hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6 p-6">
            {/* Basic Information */}
            <div className="space-y-3">
              <Label
                htmlFor="editTitle"
                className="text-gray-700 font-semibold text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Post Title *
              </Label>
              <Input
                id="editTitle"
                value={editFormData.title}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
                placeholder="Enter post title"
                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl border-gray-300"
                required
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="editDescription"
                className="text-gray-700 font-semibold text-sm flex items-center gap-2"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                Description
              </Label>
              <Textarea
                id="editDescription"
                value={editFormData.description}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, description: e.target.value })
                }
                placeholder="Enter post description"
                className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 min-h-32 text-base rounded-xl resize-vertical"
                rows={6}
              />
            </div>

            {/* Visibility Toggle */}
            <div className="space-y-3">
              <Label className="text-gray-700 font-semibold text-sm flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                Visibility
              </Label>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div
                  className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                    editFormData.visible
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-gray-300 bg-white"
                  }`}
                  onClick={() => setEditFormData(prev => ({ ...prev, visible: !prev.visible }))}
                >
                  {editFormData.visible && <Check className="w-4 h-4" />}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {editFormData.visible ? "Published" : "Hidden"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {editFormData.visible 
                      ? "This post is visible to users" 
                      : "This post is hidden from users"}
                  </p>
                </div>
              </div>
            </div>

            {/* File Upload for Edit */}
            <div className="space-y-3">
              <Label
                htmlFor="editFileAttachments"
                className="text-gray-700 font-semibold text-base flex items-center gap-3"
              >
                <FileText className="w-5 h-5 text-blue-600" />
                Attachment
                {editFormData.attachmentUrl && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-green-50 text-green-700 border-green-200 text-xs"
                  >
                    📎 New File Attached
                  </Badge>
                )}
                {selectedPost?.attachmentUrl && !editFormData.attachmentUrl && (
                  <Badge
                    variant="outline"
                    className="ml-2 bg-blue-50 text-blue-700 border-blue-200 text-xs"
                  >
                    📎 Existing File
                  </Badge>
                )}
              </Label>

              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-blue-50/30">
                <Input
                  id="editFileAttachments"
                  type="file"
                  onChange={(e) => handleFileUpload(e, true)}
                  className="rounded-xl border-gray-300 h-12 mb-4"
                  accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                />

                {/* Existing File Display */}
                {selectedPost?.attachmentUrl && !editFormData.attachmentUrl && (
                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(getPostFileType(selectedPost))}
                        </div>
                        <div>
                          <p className="font-semibold text-blue-800 text-base">
                            Current Attachment
                          </p>
                          <p className="text-blue-600 text-sm">
                            Upload a new file to replace this attachment
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => downloadFile(selectedPost.attachmentUrl, "attachment")}
                          className="rounded-lg border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(selectedPost.attachmentUrl, "_blank")}
                          className="rounded-lg border-green-300 text-green-700 hover:bg-green-50 font-semibold"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                    {renderExistingFilePreview(selectedPost)}
                  </div>
                )}

                {/* New File Display */}
                {editFormData.attachmentUrl && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          {getFileIcon(editFormData.fileType)}
                        </div>
                        <div>
                          <p className="font-semibold text-green-800 text-base">
                            New File Attached
                          </p>
                          <p className="text-green-600 text-sm">
                            {editFormData.fileName}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => removeFileAttachment(true)}
                        className="rounded-lg border-red-300 text-red-600 hover:bg-red-50 font-semibold"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                    {renderFilePreview(editFormData.attachmentUrl, editFormData.fileType, editFormData.fileName, true)}
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Supported: Images, Videos, Documents (Max 50MB). New files will replace existing ones.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 rounded-xl font-semibold text-base transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50 shadow-lg shadow-blue-500/25"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Updating Post...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5 mr-2" />
                    Update Post
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
                className="py-3 rounded-xl font-semibold text-base border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                size="lg"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Post Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl bg-white text-gray-900 max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Post Details
            </DialogTitle>
          </DialogHeader>

          {selectedPost && (
            <div className="space-y-6 p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm lg:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <FileText className="w-6 h-6 text-blue-600" />
                      Post Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Title
                      </Label>
                      <p className="font-semibold text-gray-900 text-xl mt-1">
                        {selectedPost.title}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Description
                      </Label>
                      <p className="text-gray-900 text-base mt-1 whitespace-pre-wrap">
                        {selectedPost.description || "No description provided"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      <Eye className="w-6 h-6 text-blue-600" />
                      Post Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Visibility
                      </Label>
                      <div className="mt-1">
                        {getVisibilityBadge(selectedPost.visible)}
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Created Date
                      </Label>
                      <p className="font-semibold text-gray-900 text-base mt-1">
                        {formatDate(selectedPost.createdAt)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-sm font-medium">
                        Last Updated
                      </Label>
                      <p className="font-semibold text-gray-900 text-base mt-1">
                        {formatDate(selectedPost.updatedAt)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Attachment Section */}
              {selectedPost.attachmentUrl && (
                <Card className="bg-white border border-gray-200 rounded-xl shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50 p-6 border-b">
                    <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                      {getFileIcon(getPostFileType(selectedPost))}
                      <span>
                        {getPostFileType(selectedPost) === 'image' ? 'Image' : 
                         getPostFileType(selectedPost) === 'video' ? 'Video' : 'File'} Attachment
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {renderExistingFilePreview(selectedPost)}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => window.open(selectedPost.attachmentUrl, "_blank")}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 font-semibold"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          {getPostFileType(selectedPost) === 'video' ? 'Play' : 'View'} Attachment
                        </Button>
                        <Button
                          onClick={() => downloadFile(selectedPost.attachmentUrl, `post_${selectedPost.title}_attachment`)}
                          variant="outline"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl px-6 py-3 font-semibold"
                        >
                          <Download className="w-5 h-5 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setViewDialogOpen(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white rounded-xl px-8 py-3 font-semibold"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}