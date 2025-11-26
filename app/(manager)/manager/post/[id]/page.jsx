"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Download,
  Play,
  Image as ImageIcon,
  Video,
  File,
  ThumbsUp,
  Heart as HeartIcon,
  Laugh,
  Frown,
  Angry,
  Smile,
  Calendar,
  User,
  Send,
  MoreVertical,
  Trash2,
  X,
  Users,
  Clock
} from "lucide-react";
import axios from "axios";

const reactionTypes = [
  { type: "like", icon: ThumbsUp, label: "Like", color: "text-blue-500", bgColor: "bg-blue-500" },
  { type: "love", icon: HeartIcon, label: "Love", color: "text-red-500", bgColor: "bg-red-500" },
  { type: "care", icon: Smile, label: "Care", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  { type: "haha", icon: Laugh, label: "Haha", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  { type: "sad", icon: Frown, label: "Sad", color: "text-yellow-500", bgColor: "bg-yellow-500" },
  { type: "angry", icon: Angry, label: "Angry", color: "text-red-500", bgColor: "bg-red-500" },
];

export default function PostDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const postId = params.id;

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [addingComment, setAddingComment] = useState(false);
  const [reacting, setReacting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showViewsDialog, setShowViewsDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchPostDetails();
  }, [session, status, router, postId]);

  const fetchPostDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/manager/manager-posts/${postId}`);
      if (response.data.success) {
        setPost(response.data.post);
      } else {
        toast.error("Failed to fetch post details");
      }
    } catch (error) {
      console.error("Error fetching post details:", error);
      toast.error("Failed to load post details");
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType) => {
    if (!post || reacting) return;
    setReacting(true);
    try {
      const currentReaction = post.reactions?.find(
        r => r.userId._id.toString() === session.user.id
      );

      let response;
      if (currentReaction && currentReaction.reactionType === reactionType) {
        response = await axios.post(`/api/manager/manager-posts/${postId}`, {
          action: 'remove_reaction',
          data: {}
        });
      } else {
        response = await axios.post(`/api/manager/manager-posts/${postId}`, {
          action: 'add_reaction',
          data: { reactionType }
        });
      }

      if (response.data.success) {
        setPost(response.data.post);
        setShowReactions(false);
      }
    } catch (error) {
      toast.error("Failed to update reaction");
    } finally {
      setReacting(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || addingComment) return;
    setAddingComment(true);
    try {
      const response = await axios.post(`/api/manager/manager-posts/${postId}`, {
        action: 'add_comment',
        data: { comment: commentText.trim() }
      });

      if (response.data.success) {
        setPost(response.data.post);
        setCommentText("");
        toast.success("Comment added successfully");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setAddingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await axios.post(`/api/manager/manager-posts/${postId}`, {
        action: 'like_comment',
        data: { commentId }
      });

      if (response.data.success) {
        setPost(response.data.post);
      }
    } catch (error) {
      toast.error("Failed to like comment");
    }
  };

  const getFileType = (url) => {
    if (!url) return 'file';
    if (url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) return 'image';
    if (url.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv)$/i)) return 'video';
    return 'file';
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

  const openMediaDialog = (mediaUrl) => {
    setSelectedMedia(mediaUrl);
    setMediaDialogOpen(true);
  };

  const renderFilePreview = () => {
    if (!post?.attachmentUrl) return null;

    const fileType = getFileType(post.attachmentUrl);
    
    switch (fileType) {
      case 'image':
        return (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black">
            <img 
              src={post.attachmentUrl} 
              alt="Post attachment" 
              className="w-full max-h-96 object-contain cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => openMediaDialog(post.attachmentUrl)}
              onError={() => setImageError(true)}
            />
            {!imageError && (
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                <div className="opacity-0 hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3">
                  <ImageIcon className="w-6 h-6 text-gray-900" />
                </div>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-900 backdrop-blur-sm border-0 shadow-lg"
                onClick={() => downloadFile(post.attachmentUrl, `post_${post.title}_image`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        );
      case 'video':
        return (
          <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black">
            <video 
              className="w-full max-h-96 object-contain cursor-pointer"
              onClick={() => openMediaDialog(post.attachmentUrl)}
              onError={() => setVideoError(true)}
            >
              <source src={post.attachmentUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            {!videoError && (
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center hover:bg-opacity-20 transition-all duration-300 cursor-pointer">
                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                  <Play className="w-8 h-8 text-gray-900 ml-1" />
                </div>
              </div>
            )}
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                className="bg-white/90 hover:bg-white text-gray-900 backdrop-blur-sm border-0 shadow-lg"
                onClick={() => downloadFile(post.attachmentUrl, `post_${post.title}_video`)}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div 
            className="flex items-center gap-4 p-6 bg-gray-50 border border-gray-200 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors group"
            onClick={() => window.open(post.attachmentUrl, '_blank')}
          >
            <File className="w-12 h-12 text-gray-600 group-hover:text-gray-700" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">File Attachment</p>
              <p className="text-gray-600">Click to view/download the attached file</p>
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white border-0"
              onClick={(e) => {
                e.stopPropagation();
                downloadFile(post.attachmentUrl, `post_${post.title}_file`);
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        );
    }
  };

  const getReactionCounts = () => {
    if (!post?.reactions) return {};
    return post.reactions.reduce((acc, reaction) => {
      acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
      return acc;
    }, {});
  };

  const getCurrentUserReaction = () => {
    if (!post?.reactions || !session) return null;
    return post.reactions.find(r => r.userId._id.toString() === session.user.id);
  };

  const filteredViews = post?.views?.filter(view => 
    view.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    view.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    view.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const ReactionButton = ({ reaction }) => {
    const ReactionIcon = reaction.icon;
    const reactionCounts = getReactionCounts();
    const count = reactionCounts[reaction.type] || 0;
    const currentUserReaction = getCurrentUserReaction();
    const isActive = currentUserReaction?.reactionType === reaction.type;

    return (
      <Button
        variant="ghost"
        size="sm"
        className={`flex items-center gap-2 rounded-xl transition-all duration-200 ${
          isActive 
            ? `${reaction.color} bg-gray-100 border border-gray-200` 
            : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
        }`}
        onClick={() => handleReaction(reaction.type)}
        disabled={reacting}
      >
        <ReactionIcon className={`w-4 h-4 ${isActive ? 'fill-current' : ''}`} />
        <span className="font-medium">{count}</span>
      </Button>
    );
  };

  const ReactionUsers = ({ reactionType }) => {
    const users = post?.reactions
      ?.filter(r => r.reactionType === reactionType)
      .map(r => r.userId) || [];
    
    const reaction = reactionTypes.find(r => r.type === reactionType);
    
    return (
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${reaction.bgColor} text-white`}>
          <reaction.icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-900">{reaction.label}</p>
          <p className="text-sm text-gray-600">
            {users.slice(0, 3).map(user => 
              `${user.firstName} ${user.lastName}`
            ).join(', ')}
            {users.length > 3 && ` and ${users.length - 3} more`}
          </p>
        </div>
        <Badge variant="secondary" className="bg-white text-gray-700 border border-gray-300">
          {users.length}
        </Badge>
      </div>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-700 text-lg font-medium">
            Loading post details...
          </span>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
          <Button 
            onClick={() => router.push('/manager/posts')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Posts
          </Button>
        </div>
      </div>
    );
  }

  const currentUserReaction = getCurrentUserReaction();
  const reactionCounts = getReactionCounts();
  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <Toaster position="top-right" />
      
      {/* Media Dialog */}
      <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0 rounded-lg overflow-hidden">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full"
              onClick={() => setMediaDialogOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            {selectedMedia && getFileType(selectedMedia) === 'image' && (
              <img
                src={selectedMedia}
                alt="Post attachment"
                className="w-full max-h-[80vh] object-contain"
              />
            )}
            {selectedMedia && getFileType(selectedMedia) === 'video' && (
              <video
                src={selectedMedia}
                controls
                autoPlay
                className="w-full max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/manager/posts')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Posts
            </Button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Post Details
            </h1>
          </div>
          
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-sm px-3 py-1">
            {post.submmittedBy?.role || 'Manager'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Post Card */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-3xl font-bold mb-4 leading-tight">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-6 text-blue-100 flex-wrap">
                      <div className="flex items-center gap-3 bg-white/20 px-3 py-2 rounded-xl">
                        <User className="w-5 h-5" />
                        <span className="font-semibold text-white">
                          {post.submmittedBy?.firstName} {post.submmittedBy?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 bg-white/20 px-3 py-2 rounded-xl">
                        <Calendar className="w-5 h-5" />
                        <span className="text-white">
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-8 space-y-8">
                {/* Description */}
                {post.description && (
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-lg">
                      {post.description}
                    </p>
                  </div>
                )}

                {/* Attachment */}
                {post.attachmentUrl && renderFilePreview()}

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-8">
                    {/* Views */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-3 text-gray-700 hover:text-gray-900 border-gray-300 hover:border-gray-400 rounded-xl px-4 py-2"
                      onClick={() => setShowViewsDialog(true)}
                    >
                      <Eye className="w-5 h-5" />
                      <span className="font-semibold">{post.views?.length || 0} views</span>
                    </Button>

                    {/* Comments Count */}
                    <div className="flex items-center gap-3 text-gray-700 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-semibold">{post.comments?.length || 0} comments</span>
                    </div>
                  </div>

                  {/* Reactions Summary */}
                  {totalReactions > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-2 bg-green-100 text-green-800 border-green-200 px-3 py-1">
                        {Object.entries(reactionCounts)
                          .filter(([_, count]) => count > 0)
                          .slice(0, 3)
                          .map(([type, count]) => {
                            const reaction = reactionTypes.find(r => r.type === type);
                            const ReactionIcon = reaction?.icon;
                            return ReactionIcon ? (
                              <ReactionIcon key={type} className={`w-4 h-4 ${reaction.color}`} />
                            ) : null;
                          })
                        }
                        <span className="font-semibold">{totalReactions}</span>
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 border-t border-gray-200 pt-6">
                  {/* Reaction Button */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      className={`flex items-center gap-3 rounded-xl px-4 py-2 border transition-all duration-200 ${
                        currentUserReaction 
                          ? 'border-blue-200 bg-blue-50 text-blue-600' 
                          : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900'
                      }`}
                      onClick={() => setShowReactions(!showReactions)}
                    >
                      <Heart className={`w-5 h-5 ${currentUserReaction ? 'fill-current' : ''}`} />
                      <span className="font-semibold">React</span>
                    </Button>

                    {showReactions && (
                      <div className="absolute bottom-full mb-3 left-0 bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 flex gap-2 z-10 animate-in fade-in-0 zoom-in-95">
                        {reactionTypes.map((reaction) => {
                          const ReactionIcon = reaction.icon;
                          const currentUserReaction = getCurrentUserReaction();
                          const isActive = currentUserReaction?.reactionType === reaction.type;
                          
                          return (
                            <Button
                              key={reaction.type}
                              variant="ghost"
                              size="sm"
                              className={`p-3 hover:scale-110 transition-all duration-200 rounded-xl ${
                                isActive ? reaction.color : 'text-gray-600 hover:' + reaction.color
                              }`}
                              onClick={() => handleReaction(reaction.type)}
                              title={reaction.label}
                            >
                              <ReactionIcon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button variant="outline" className="flex items-center gap-3 rounded-xl px-4 py-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900">
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-semibold">Comment</span>
                  </Button>

                  <Button variant="outline" className="flex items-center gap-3 rounded-xl px-4 py-2 border-gray-300 text-gray-700 hover:border-gray-400 hover:text-gray-900">
                    <Share className="w-5 h-5" />
                    <span className="font-semibold">Share</span>
                  </Button>
                </div>

                {/* Individual Reaction Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {reactionTypes.map((reaction) => (
                    <ReactionButton key={reaction.type} reaction={reaction} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="p-8 border-b border-gray-200">
                <CardTitle className="text-2xl flex items-center gap-4 text-gray-900">
                  <MessageCircle className="w-7 h-7 text-blue-600" />
                  Comments ({post.comments?.length || 0})
                </CardTitle>
              </CardHeader>

              <CardContent className="p-8">
                {/* Add Comment */}
                <div className="flex gap-4 mb-8">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                    <AvatarImage src={session.user.profilePic} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                      {session.user.firstName?.[0]}{session.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-4">
                    <Textarea
                      placeholder="Share your thoughts..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-24 resize-vertical rounded-2xl border-gray-300 focus:border-blue-500 text-gray-900 text-lg p-4"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          handleAddComment();
                        }
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        Press Ctrl+Enter to post
                      </span>
                      <Button
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || addingComment}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-2 shadow-lg transition-all duration-200"
                      >
                        {addingComment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Posting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Post Comment
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                  {post.comments?.map((comment) => {
                    const isLiked = comment.likes?.some(
                      like => like.userId._id.toString() === session.user.id
                    );
                    
                    return (
                      <div key={comment._id} className="flex gap-4 group hover:bg-gray-50 p-4 rounded-2xl transition-all duration-200">
                        <Avatar className="w-12 h-12 border-2 border-white shadow-lg flex-shrink-0">
                          <AvatarImage src={comment.userId.profilePic} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                            {comment.userId.firstName?.[0]}{comment.userId.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-wrap">
                                <p className="font-bold text-gray-900 text-lg">
                                  {comment.userId.firstName} {comment.userId.lastName}
                                </p>
                                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                  {comment.userId.role}
                                </Badge>
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-gray-700 text-lg leading-relaxed">{comment.comment}</p>
                          </div>
                          
                          {/* Comment Actions */}
                          <div className="flex items-center gap-6 mt-3 ml-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex items-center gap-2 text-sm rounded-xl px-3 py-2 ${
                                isLiked 
                                  ? 'text-blue-600 bg-blue-50 border border-blue-200' 
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                              }`}
                              onClick={() => handleLikeComment(comment._id)}
                            >
                              <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                              <span className="font-semibold">Like ({comment.likes?.length || 0})</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl px-3 py-2"
                            >
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(!post.comments || post.comments.length === 0) && (
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-xl font-semibold text-gray-400 mb-2">No comments yet</p>
                      <p className="text-gray-400">Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reactions Summary */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                  <Heart className="w-5 h-5 text-red-500" />
                  Reactions ({totalReactions})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {reactionTypes.map((reaction) => {
                    const count = reactionCounts[reaction.type] || 0;
                    if (count === 0) return null;
                    
                    return (
                      <ReactionUsers key={reaction.type} reactionType={reaction.type} />
                    );
                  })}
                  
                  {totalReactions === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-gray-400">No reactions yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Viewers */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-lg flex items-center gap-3 text-gray-900">
                  <Users className="w-5 h-5 text-blue-500" />
                  Recent Viewers ({post.views?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {post.views?.slice(0, 5).map((view, index) => (
                    <div key={view._id} className="flex items-center gap-3 group hover:bg-gray-50 p-3 rounded-xl transition-all duration-200">
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarImage src={view.userId.profilePic} />
                        <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium">
                          {view.userId.firstName?.[0]}{view.userId.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {view.userId.firstName} {view.userId.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {view.userId.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">
                        {view.userModel}
                      </Badge>
                    </div>
                  ))}
                  
                  {post.views?.length > 5 && (
                    <Button
                      variant="outline"
                      className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 rounded-xl"
                      onClick={() => setShowViewsDialog(true)}
                    >
                      View all {post.views.length} viewers
                    </Button>
                  )}
                  
                  {(!post.views || post.views.length === 0) && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                      <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-gray-400">No viewers yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Views Dialog */}
      <Dialog open={showViewsDialog} onOpenChange={setShowViewsDialog}>
        <DialogContent className="max-w-2xl bg-white text-gray-900 max-h-[80vh] overflow-y-auto rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="text-xl flex items-center gap-3 text-gray-900">
              <Users className="w-6 h-6 text-blue-600" />
              Post Viewers ({post.views?.length || 0})
            </DialogTitle>
          </DialogHeader>

          <div className="p-6">
            {/* Search */}
            <div className="mb-6">
              <Input
                placeholder="Search viewers by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl border-gray-300 focus:border-blue-500 text-gray-900"
              />
            </div>

            {/* Viewers List */}
            <div className="space-y-4">
              {filteredViews.map((view) => (
                <div key={view._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-white hover:shadow-sm transition-all duration-200">
                  <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarImage src={view.userId.profilePic} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium">
                      {view.userId.firstName?.[0]}{view.userId.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-lg">
                      {view.userId.firstName} {view.userId.lastName}
                    </p>
                    <p className="text-gray-600 text-sm">{view.userId.email}</p>
                    <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Viewed on {new Date(view.viewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-sm">
                    {view.userModel}
                  </Badge>
                </div>
              ))}

              {filteredViews.length === 0 && (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-gray-400">No viewers found</p>
                </div> 
                
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}