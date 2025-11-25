"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Filter,
  Eye,
  MessageCircle,
  ThumbsUp,
  Share2,
  Calendar,
  User,
  Building,
  Video,
  Image as ImageIcon,
  FileText,
  File,
  Heart
} from "lucide-react";
import Link from "next/link";

const reactionEmojis = {
  like: "👍",
  love: "❤️",
  care: "🥰",
  haha: "😂",
  wow: "😮",
  sad: "😢",
  angry: "😡"
};

export default function PostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/login");
      return;
    }

    fetchPosts();
  }, [session, status, router, filter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts?filter=${filter}`);
      const data = await response.json();

      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
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
        setPosts(posts.map(post => 
          post._id === postId ? data.post : post
        ));
      }
    } catch (error) {
      console.error("Error adding reaction:", error);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent mb-4">
            Company Posts
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Stay updated with the latest announcements and updates from management
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 mb-8 items-start lg:items-center justify-between">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              placeholder="Search posts by title or description..."
              className="pl-10 pr-4 py-3 rounded-xl border-gray-300 focus:border-blue-500 bg-white shadow-sm text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Tabs value={filter} onValueChange={setFilter} className="w-full lg:w-auto">
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-white p-1 shadow-sm border">
              <TabsTrigger value="all" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-900 transition-all">All Posts</TabsTrigger>
              <TabsTrigger value="admin" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-900 transition-all">Admin</TabsTrigger>
              <TabsTrigger value="manager" className="rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white text-gray-900 transition-all">Manager</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              session={session}
              onReaction={handleReaction}
            />
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border">
            <div className="text-gray-300 mb-4">
              <MessageCircle className="w-24 h-24 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No posts found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? "Try adjusting your search terms" : "No posts available yet"}
            </p>
            {searchTerm && (
              <Button 
                onClick={() => setSearchTerm("")}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PostCard({ post, session, onReaction }) {
  const router = useRouter();
  const [showReactions, setShowReactions] = useState(false);
  const [currentReaction, setCurrentReaction] = useState(null);

  const postType = post.submmittedBy ? "manager" : "admin";
  const userReaction = post.reactions?.find(reaction => 
    reaction.userId._id === session?.user?.id
  );

  useEffect(() => {
    if (userReaction) {
      setCurrentReaction(userReaction.reactionType);
    }
  }, [userReaction]);

  const getAuthorInfo = () => {
    if (postType === 'admin') {
      return {
        name: "Administrator",
        role: "Admin",
        avatar: "A",
        bgColor: "from-blue-500 to-blue-600"
      };
    } else {
      return {
        name: `${post.submmittedBy?.firstName} ${post.submmittedBy?.lastName}`,
        role: "Manager",
        department: post.submmittedBy?.department,
        avatar: `${post.submmittedBy?.firstName?.[0] || 'M'}${post.submmittedBy?.lastName?.[0] || ''}`,
        bgColor: "from-purple-500 to-purple-600"
      };
    }
  };

  const author = getAuthorInfo();

  const getAttachmentIcon = () => {
    if (!post.attachmentUrl) return null;
    
    if (post.attachmentType === 'video' || post.attachmentUrl.includes('video')) {
      return <Video className="w-4 h-4" />;
    } else if (post.attachmentType === 'image' || post.attachmentUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return <ImageIcon className="w-4 h-4" />;
    } else {
      return <FileText className="w-4 h-4" />;
    }
  };

  const handleReactionClick = (reactionType) => {
    onReaction(post._id, reactionType);
    setCurrentReaction(reactionType);
    setShowReactions(false);
  };

  const reactionCounts = post.reactions?.reduce((acc, reaction) => {
    acc[reaction.reactionType] = (acc[reaction.reactionType] || 0) + 1;
    return acc;
  }, {});

  const totalReactions = post.reactions?.length || 0;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 border border-gray-200 shadow-sm rounded-2xl overflow-hidden bg-white hover:border-blue-200">
      <CardHeader className="pb-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className={`w-12 h-12 bg-gradient-to-r ${author.bgColor} shadow-md`}>
              <AvatarFallback className="text-white font-semibold text-sm">
                {author.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-base">{author.name}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge 
                  variant={postType === 'admin' ? 'default' : 'secondary'}
                  className={`text-xs font-medium ${
                    postType === 'admin' 
                      ? "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200" 
                      : "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200"
                  }`}
                >
                  {author.role}
                </Badge>
                {author.department && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    {author.department}
                  </span>
                )}
              </div>
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

        <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-700 transition-colors">
          {post.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-6">
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed text-sm">
          {post.description}
        </p>

        {post.attachmentUrl && (
          <div className="mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              {getAttachmentIcon()}
              <span>Attachment</span>
            </div>
            {post.attachmentType === 'image' && (
              <div 
                className="w-full h-48 bg-gray-100 rounded-lg cursor-pointer overflow-hidden group/image"
                onClick={() => router.push(`/post/${post._id}`)}
              >
                <img
                  src={post.attachmentUrl}
                  alt="Post attachment"
                  className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-300"
                />
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
              <Eye className="w-4 h-4" />
              <span className="font-medium text-gray-900">{post.views?.length || 0}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium text-gray-900">{post.comments?.length || 0}</span>
            </div>
          </div>
          
          {totalReactions > 0 && (
            <div 
              className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowReactions(!showReactions)}
            >
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

        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200 ${
                currentReaction 
                  ? 'bg-blue-50 text-blue-600 border border-blue-200' 
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
              <div className="absolute bottom-full mb-2 left-0 bg-white rounded-full shadow-lg border border-gray-200 p-2 z-10">
                <div className="flex items-center gap-1">
                  {Object.entries(reactionEmojis).map(([type, emoji]) => (
                    <button
                      key={type}
                      onClick={() => handleReactionClick(type)}
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
              onClick={() => router.push(`/post/${post._id}`)}
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
          <div className="mt-3 text-sm text-gray-900 bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
            <div className="flex items-center gap-2">
              <span className="text-lg">{reactionEmojis[currentReaction]}</span>
              <span>You reacted with <strong className="text-gray-900">{currentReaction}</strong></span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}