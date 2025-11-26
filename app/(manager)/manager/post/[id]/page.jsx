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
import { Label } from "@/components/ui/label";
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
  EyeClosedIcon,
  Smile,
  Calendar,
  User,
  Send,
  MoreVertical,
  Trash2,
} from "lucide-react";
import axios from "axios";

const reactionTypes = [
  { type: "like", icon: ThumbsUp, label: "Like", color: "text-blue-500" },
  { type: "love", icon: HeartIcon, label: "Love", color: "text-red-500" },
  { type: "care", icon: Smile, label: "Care", color: "text-yellow-500" },
  { type: "haha", icon: Laugh, label: "Haha", color: "text-yellow-500" },
  { type: "EyeClosedIcon", icon: EyeClosedIcon, label: "EyeClosedIcon", color: "text-yellow-500" },
  { type: "sad", icon: Frown, label: "Sad", color: "text-yellow-500" },
  { type: "angry", icon: Angry, label: "Angry", color: "text-red-500" },
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
      const currentReaction = post.reactions.find(
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
    if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
    if (url.match(/\.(mp4|mov|avi|mkv|webm)$/i)) return 'video';
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

  const renderFilePreview = () => {
    if (!post?.attachmentUrl) return null;

    const fileType = getFileType(post.attachmentUrl);
    
    switch (fileType) {
      case 'image':
        return (
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <img 
              src={post.attachmentUrl} 
              alt="Post attachment" 
              className="w-full max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(post.attachmentUrl, '_blank')}
            />
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white backdrop-blur-sm"
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
          <div className="relative rounded-xl overflow-hidden border border-gray-200">
            <video 
              controls 
              className="w-full max-h-96"
              poster={post.attachmentUrl}
            >
              <source src={post.attachmentUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute top-4 right-4">
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/90 hover:bg-white backdrop-blur-sm"
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
            className="flex items-center gap-4 p-6 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => window.open(post.attachmentUrl, '_blank')}
          >
            <File className="w-12 h-12 text-gray-600" />
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-lg">File Attachment</p>
              <p className="text-gray-600">Click to view/download the attached file</p>
            </div>
            <Button
              variant="outline"
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
        className={`flex items-center gap-2 ${isActive ? reaction.color : 'text-gray-600'} hover:${reaction.color} hover:bg-gray-100`}
        onClick={() => handleReaction(reaction.type)}
        disabled={reacting}
      >
        <ReactionIcon className="w-4 h-4" />
        <span>{count}</span>
      </Button>
    );
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center gap-3 bg-white p-6 rounded-2xl shadow-lg">
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
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h2>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
          <Button onClick={() => router.push('/manager/posts')}>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/manager/posts')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Posts
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
            Post Details
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Post Card */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-2xl mb-2">
                      {post.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-blue-100">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-semibold">
                          {post.submmittedBy?.firstName} {post.submmittedBy?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
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

              <CardContent className="p-6 space-y-6">
                {/* Description */}
                {post.description && (
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {post.description}
                    </p>
                  </div>
                )}

                {/* Attachment */}
                {post.attachmentUrl && renderFilePreview()}

                {/* Stats and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-6">
                    {/* Views */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                      onClick={() => setShowViewsDialog(true)}
                    >
                      <Eye className="w-4 h-4" />
                      <span>{post.views?.length || 0} views</span>
                    </Button>

                    {/* Comments Count */}
                    <div className="flex items-center gap-2 text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments?.length || 0} comments</span>
                    </div>
                  </div>

                  {/* Reactions */}
                  <div className="flex items-center gap-2">
                    {totalReactions > 0 && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {Object.entries(reactionCounts)
                          .filter(([_, count]) => count > 0)
                          .map(([type, count]) => {
                            const reaction = reactionTypes.find(r => r.type === type);
                            const ReactionIcon = reaction?.icon;
                            return ReactionIcon ? (
                              <ReactionIcon key={type} className={`w-3 h-3 ${reaction.color}`} />
                            ) : null;
                          })
                        }
                        <span>{totalReactions}</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-4 border-t border-gray-200 pt-4">
                  {/* Reaction Button */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      className={`flex items-center gap-2 ${
                        currentUserReaction ? reactionTypes.find(r => r.type === currentUserReaction.reactionType)?.color : 'text-gray-600'
                      }`}
                      onClick={() => setShowReactions(!showReactions)}
                    >
                      <Heart className="w-5 h-5" />
                      React
                    </Button>

                    {showReactions && (
                      <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-2 flex gap-1 z-10">
                        {reactionTypes.map((reaction) => {
                          const ReactionIcon = reaction.icon;
                          return (
                            <Button
                              key={reaction.type}
                              variant="ghost"
                              size="sm"
                              className={`p-2 hover:scale-110 transition-transform ${reaction.color}`}
                              onClick={() => handleReaction(reaction.type)}
                              title={reaction.label}
                            >
                              <ReactionIcon className="w-5 h-5" />
                            </Button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
                    <MessageCircle className="w-5 h-5" />
                    Comment
                  </Button>

                  <Button variant="ghost" className="flex items-center gap-2 text-gray-600">
                    <Share className="w-5 h-5" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-xl flex items-center gap-3">
                  <MessageCircle className="w-6 h-6 text-blue-600" />
                  Comments ({post.comments?.length || 0})
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                {/* Add Comment */}
                <div className="flex gap-4 mb-6">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={session.user.profilePic} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {session.user.firstName?.[0]}{session.user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="min-h-20 resize-vertical rounded-xl border-gray-300 focus:border-blue-500"
                    />
                    <div className="flex justify-end">
                      <Button
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || addingComment}
                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6"
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
                      <div key={comment._id} className="flex gap-4 group">
                        <Avatar className="w-10 h-10 flex-shrink-0">
                          <AvatarImage src={comment.userId.profilePic} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                            {comment.userId.firstName?.[0]}{comment.userId.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {comment.userId.firstName} {comment.userId.lastName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-gray-700">{comment.comment}</p>
                          </div>
                          
                          {/* Comment Actions */}
                          <div className="flex items-center gap-4 mt-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`flex items-center gap-1 text-sm ${
                                isLiked ? 'text-blue-600' : 'text-gray-600'
                              }`}
                              onClick={() => handleLikeComment(comment._id)}
                            >
                              <ThumbsUp className="w-4 h-4" />
                              Like ({comment.likes?.length || 0})
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {(!post.comments || post.comments.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No comments yet. Be the first to comment!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Reactions Summary */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Heart className="w-5 h-5 text-red-500" />
                  Reactions ({totalReactions})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {reactionTypes.map((reaction) => {
                    const count = reactionCounts[reaction.type] || 0;
                    if (count === 0) return null;
                    
                    const ReactionIcon = reaction.icon;
                    return (
                      <div key={reaction.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ReactionIcon className={`w-5 h-5 ${reaction.color}`} />
                          <span className="font-medium text-gray-700">{reaction.label}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                  
                  {totalReactions === 0 && (
                    <p className="text-gray-500 text-center py-4">No reactions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Viewers */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm rounded-2xl">
              <CardHeader className="p-6 border-b border-gray-200">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Recent Viewers ({post.views?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {post.views?.slice(0, 5).map((view, index) => (
                    <div key={view._id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={view.userId.profilePic} />
                        <AvatarFallback className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                          {view.userId.firstName?.[0]}{view.userId.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {view.userId.firstName} {view.userId.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {view.userId.email}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {view.userModel}
                      </Badge>
                    </div>
                  ))}
                  
                  {post.views?.length > 5 && (
                    <Button
                      variant="ghost"
                      className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={() => setShowViewsDialog(true)}
                    >
                      View all {post.views.length} viewers
                    </Button>
                  )}
                  
                  {(!post.views || post.views.length === 0) && (
                    <p className="text-gray-500 text-center py-4">No viewers yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Views Dialog */}
      <Dialog open={showViewsDialog} onOpenChange={setShowViewsDialog}>
        <DialogContent className="max-w-2xl bg-white text-gray-900 max-h-[80vh] overflow-y-auto rounded-2xl">
          <DialogHeader className="p-6 border-b border-gray-200">
            <DialogTitle className="text-xl flex items-center gap-3">
              <Eye className="w-6 h-6 text-blue-600" />
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
                className="rounded-xl border-gray-300 focus:border-blue-500"
              />
            </div>

            {/* Viewers List */}
            <div className="space-y-4">
              {filteredViews.map((view) => (
                <div key={view._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={view.userId.profilePic} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                      {view.userId.firstName?.[0]}{view.userId.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-lg">
                      {view.userId.firstName} {view.userId.lastName}
                    </p>
                    <p className="text-gray-600 text-sm">{view.userId.email}</p>
                    <p className="text-gray-500 text-xs mt-1">
                      Viewed on {new Date(view.viewedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {view.userModel}
                  </Badge>
                </div>
              ))}

              {filteredViews.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No viewers found</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}