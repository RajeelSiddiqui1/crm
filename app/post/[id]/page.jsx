"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Eye,
  MessageCircle,
  ThumbsUp,
  Share2,
  Calendar,
  User,
  Video,
  Image as ImageIcon,
  FileText,
  Send,
  ArrowLeft,
  Heart,
  MoreVertical,
  Edit,
  Trash2,
  Download,
  Play,
  X,
  Smile,
  MapPin
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const reactionEmojis = {
  like: "👍",
  love: "❤️",
  care: "🥰",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡"
};

const roleColors = {
  Admin: "bg-red-100 text-red-800 border-red-200",
  Manager: "bg-purple-100 text-purple-800 border-purple-200",
  TeamLead: "bg-blue-100 text-blue-800 border-blue-200",
  Employee: "bg-green-100 text-green-800 border-green-200"
};

const roleGradients = {
  Admin: "from-red-500 to-red-600",
  Manager: "from-purple-500 to-purple-600",
  TeamLead: "from-blue-500 to-blue-600",
  Employee: "from-green-500 to-green-600"
};

export default function PostDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }
    fetchPost();
  }, [session, status, router, params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${params.id}`);
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
        const userReaction = data.post.reactions?.find(reaction => 
          reaction.userId._id === session?.user?.id
        );
        if (userReaction) {
          setCurrentReaction(userReaction.reactionType);
        }
      }
    } catch (error) {
      console.error("Error fetching post:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "reaction",
          data: { reactionType }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
        setCurrentReaction(reactionType);
        setShowReactions(false);
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    try {
      setSubmitting(true);
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "comment",
          data: { comment: comment.trim() }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
        setComment("");
        setCommentsExpanded(true);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "like_comment",
          data: { commentId }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
      }
    } catch (error) {
      console.error("Error liking comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "delete_comment",
          data: { commentId }
        }),
      });
      const data = await response.json();
      if (data.success) {
        setPost(data.post);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const response = await fetch(`/api/posts/${params.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (data.success) {
        router.push('/posts');
      }
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  const canDeletePost = () => {
    if (!session?.user || !post) return false;
    return session.user.role === "Admin" || 
           (session.user.role === "Manager" && post.submmittedBy?._id === session.user.id);
  };

  const canDeleteComment = (comment) => {
    if (!session?.user) return false;
    return session.user.role === "Admin" || 
           comment.userId._id === session.user.id;
  };

  const getAuthorInfo = () => {
    if (!post) return null;
    if (!post.submmittedBy) {
      return {
        name: "Administrator",
        role: "Admin",
        avatar: "A",
        bgColor: roleGradients.Admin
      };
    } else {
      return {
        name: `${post.submmittedBy.firstName} ${post.submmittedBy.lastName}`,
        role: post.submmittedBy.role,
        department: post.submmittedBy.department,
        avatar: `${post.submmittedBy.firstName?.[0] || 'U'}${post.submmittedBy.lastName?.[0] || ''}`,
        bgColor: roleGradients[post.submmittedBy.role] || roleGradients.Employee
      };
    }
  };

  const getAttachmentIcon = () => {
    if (!post?.attachmentUrl) return null;
    if (isVideoFile) {
      return <Video className="w-4 h-4" />;
    } else if (isImageFile) {
      return <ImageIcon className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  const isVideoFile = post?.attachmentUrl && (
    post.attachmentType === 'video' || 
    post.attachmentUrl.includes('video') || 
    post.attachmentUrl.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i)
  );

  const isImageFile = post?.attachmentUrl && (
    post.attachmentType === 'image' || 
    post.attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)
  );

  const openMediaDialog = (mediaUrl) => {
    setSelectedMedia(mediaUrl);
    setMediaDialogOpen(true);
  };

  const reactionCounts = post?.reactions?.reduce((acc, reaction) => {
    acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
    return acc;
  }, {}) || {};

  const totalReactions = post?.reactions?.length || 0;
  const totalComments = post?.comments?.length || 0;
  const displayedComments = commentsExpanded ? post?.comments : (post?.comments?.slice(0, 3) || []);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Post not found</h2>
          <Button onClick={() => router.push('/posts')} className="text-gray-900">
            Back to Posts
          </Button>
        </div>
      </div>
    );
  }

  const author = getAuthorInfo();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/posts')}
            className="flex items-center gap-2 hover:bg-white hover:shadow-sm transition-all duration-200 rounded-xl text-gray-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Posts
          </Button>

          {canDeletePost() && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0 rounded-full text-gray-900">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl text-gray-900">
                <DropdownMenuItem 
                  onClick={handleDeletePost}
                  className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Post
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <Card className="mb-8 border-0 shadow-xl rounded-2xl overflow-hidden bg-white hover:shadow-2xl transition-all duration-300">
          <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <Avatar className={`w-12 h-12 bg-gradient-to-r ${author.bgColor} shadow-md`}>
                  <AvatarFallback className="text-white font-semibold text-lg">
                    {author.avatar}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-semibold text-gray-900 text-lg">{author.name}</p>
                    <Badge 
                      className={`text-xs font-medium ${roleColors[author.role]} border`}
                    >
                      {author.role}
                    </Badge>
                  </div>
                  {author.department && (
                    <p className="text-sm text-gray-500">{author.department}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 flex items-center gap-1 justify-end">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(post.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>

            <CardTitle className="text-2xl font-bold text-gray-900 leading-tight">
              {post.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <p className="text-gray-600 text-lg mb-6 whitespace-pre-wrap leading-relaxed">
              {post.description}
            </p>

            {post.attachmentUrl && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {getAttachmentIcon()}
                    <span>Attachment</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full flex items-center gap-2 text-gray-900"
                    asChild
                  >
                    <a href={post.attachmentUrl} download target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </div>
                
                {isImageFile && !imageError && (
                  <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
                    <DialogTrigger asChild>
                      <div 
                        className="rounded-xl overflow-hidden border border-gray-200 cursor-pointer group relative bg-black"
                        onClick={() => openMediaDialog(post.attachmentUrl)}
                      >
                        <img
                          src={post.attachmentUrl}
                          alt="Post attachment"
                          className="w-full max-h-96 object-contain hover:opacity-95 transition-opacity duration-300"
                          onError={() => setImageError(true)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3">
                            <ImageIcon className="w-6 h-6 text-gray-900" />
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
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
                        <img
                          src={post.attachmentUrl}
                          alt="Post attachment"
                          className="w-full max-h-[80vh] object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {isVideoFile && !videoError && (
                  <Dialog open={mediaDialogOpen} onOpenChange={setMediaDialogOpen}>
                    <DialogTrigger asChild>
                      <div 
                        className="rounded-xl overflow-hidden border border-gray-200 cursor-pointer group relative bg-black"
                        onClick={() => openMediaDialog(post.attachmentUrl)}
                      >
                        <video
                          src={post.attachmentUrl}
                          className="w-full max-h-96 object-cover"
                          onError={() => setVideoError(true)}
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-20 transition-all duration-300">
                          <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <Play className="w-8 h-8 text-gray-900 ml-1" />
                          </div>
                        </div>
                      </div>
                    </DialogTrigger>
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
                        <video
                          src={post.attachmentUrl}
                          controls
                          autoPlay
                          className="w-full max-h-[80vh] object-contain"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {(imageError || videoError) && (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <div className="text-center text-gray-500">
                      <FileText className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm">Preview not available</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2 text-gray-900"
                        onClick={() => window.open(post.attachmentUrl, '_blank')}
                      >
                        Download File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                  <Eye className="w-4 h-4" />
                  <span className="font-medium text-gray-900">{post.views?.length || 0} views</span>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full">
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-medium text-gray-900">{totalComments} comments</span>
                </div>
              </div>
              
              {totalReactions > 0 && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-1">
                    {Object.entries(reactionCounts).slice(0, 3).map(([type, count]) => (
                      <span key={type} className="text-sm transition-transform hover:scale-110">
                        {reactionEmojis[type]}
                      </span>
                    ))}
                  </div>
                  <span className="font-medium text-gray-900">{totalReactions}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-6">
              <div className="relative">
                <button
                  onClick={() => setShowReactions(!showReactions)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                    currentReaction 
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                      : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <Heart 
                    className={`w-4 h-4 ${
                      currentReaction ? 'fill-current text-blue-600' : ''
                    }`} 
                  />
                  <span className="font-medium text-gray-900">Like</span>
                </button>

                {showReactions && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white rounded-full shadow-lg border border-gray-200 p-2 z-10 animate-in fade-in-0 zoom-in-95">
                    <div className="flex items-center gap-1">
                      {Object.entries(reactionEmojis).map(([type, emoji]) => (
                        <button
                          key={type}
                          onClick={() => handleReaction(type)}
                          className={`p-2 rounded-full transition-all duration-200 text-lg hover:scale-125 ${
                            currentReaction === type ? 'bg-blue-50 scale-110' : 'hover:bg-gray-100'
                          }`}
                          title={type.charAt(0).toUpperCase() + type.slice(1)}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-full bg-white hover:bg-gray-50 border-gray-200 text-gray-900 transition-all duration-200 hover:shadow-md"
                  onClick={() => {
                    document.getElementById('comment-input')?.focus();
                    setCommentsExpanded(true);
                  }}
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="font-medium text-gray-900">Comment</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 rounded-full bg-white hover:bg-gray-50 border-gray-200 text-gray-900 transition-all duration-200 hover:shadow-md"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="font-medium text-gray-900">Share</span>
                </Button>
              </div>
            </div>

            {currentReaction && (
              <div className="mb-6 text-sm text-gray-900 bg-blue-50 px-4 py-3 rounded-xl border border-blue-100">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{reactionEmojis[currentReaction]}</span>
                  <span>You reacted with <strong className="capitalize text-gray-900">{currentReaction}</strong></span>
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex gap-3">
                <Avatar className={`w-10 h-10 flex-shrink-0 bg-gradient-to-r ${roleGradients[session.user.role]}`}>
                  <AvatarFallback className="text-white text-sm">
                    {session.user.name?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    id="comment-input"
                    placeholder="Write a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[100px] resize-none rounded-xl border-gray-300 focus:border-blue-500 bg-gray-50 focus:bg-white transition-colors text-gray-900"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleComment();
                      }
                    }}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-900">
                        <Smile className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-900">
                        <MapPin className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        Press Ctrl+Enter to post
                      </span>
                      <Button
                        onClick={handleComment}
                        disabled={!comment.trim() || submitting}
                        className="flex items-center gap-2 rounded-xl bg-blue-500 hover:bg-blue-600 transition-all duration-200 text-white"
                      >
                        <Send className="w-4 h-4" />
                        {submitting ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-gray-900 text-lg">
                  Comments ({totalComments})
                </h3>
                {totalComments > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommentsExpanded(!commentsExpanded)}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                  >
                    {commentsExpanded ? 'Show Less' : `Show All ${totalComments} Comments`}
                  </Button>
                )}
              </div>
              
              {displayedComments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  session={session}
                  onLike={() => handleLikeComment(comment._id)}
                  onDelete={() => handleDeleteComment(comment._id)}
                  canDelete={canDeleteComment(comment)}
                  isLiked={comment.likes?.some(like => like.userId._id === session.user.id)}
                />
              ))}

              {(!post.comments || post.comments.length === 0) && (
                <div className="text-center py-12 text-gray-500 bg-white rounded-xl border-2 border-dashed border-gray-200">
                  <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h4 className="text-lg font-semibold text-gray-400 mb-2">No comments yet</h4>
                  <p className="text-gray-400">Be the first to share your thoughts!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CommentItem({ comment, session, onLike, onDelete, canDelete, isLiked }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div 
      className="flex gap-3 p-4 border rounded-xl bg-white hover:border-gray-300 transition-all duration-200 group"
      onMouseEnter={() => setShowOptions(true)}
      onMouseLeave={() => setShowOptions(false)}
    >
      <Avatar className={`w-10 h-10 flex-shrink-0 bg-gradient-to-r ${roleGradients[comment.userId?.role] || roleGradients.Employee}`}>
        <AvatarFallback className="text-white text-sm">
          {comment.userId?.firstName?.[0] || 'U'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm">
              {comment.userId?.firstName} {comment.userId?.lastName}
            </p>
            <Badge 
              variant="outline" 
              className={`text-xs ${roleColors[comment.userId?.role]}`}
            >
              {comment.userId?.role}
            </Badge>
            <span className="text-xs text-gray-500">
              {new Date(comment.createdAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          {canDelete && showOptions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-6 w-6 p-0 text-gray-900">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-xl text-gray-900">
                <DropdownMenuItem 
                  onClick={onDelete}
                  className="text-red-600 focus:text-red-600 cursor-pointer rounded-lg"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Comment
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-gray-700 mb-3 text-sm leading-relaxed">{comment.comment}</p>
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className={`flex items-center gap-2 px-2 py-1 rounded-full transition-all duration-200 ${
              isLiked 
                ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                : 'bg-gray-50 text-gray-900 hover:bg-gray-100 border border-transparent'
            }`}
          >
            <ThumbsUp className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium text-gray-900">{comment.likes?.length || 0}</span>
          </button>
          <button className="text-xs text-gray-500 hover:text-gray-700 transition-colors">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}