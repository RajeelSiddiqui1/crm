// components/employee/TaskInteractionPanel.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Building,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Reply,
  ThumbsUp,
  Eye,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Users,
} from "lucide-react";
import { format } from "date-fns";

const TaskInteractionPanel = ({ task, onRefresh }) => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("teamlead");
  const [loading, setLoading] = useState(false);
  const [interactionData, setInteractionData] = useState(null);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [commentText, setCommentText] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [expandedFeedback, setExpandedFeedback] = useState({});

  useEffect(() => {
    if (task?._id) {
      fetchInteractionData();
    }
  }, [task?._id]);

  const fetchInteractionData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/employee/tasks/${task._id}/interaction`);
      if (response.data) {
        setInteractionData(response.data);
        // Pre-fill reply if exists
        setReplyText(response.data.employeeReply || "");
      }
    } catch (error) {
      console.error("Error fetching interaction data:", error);
      toast.error("Failed to load interaction data");
    } finally {
      setLoading(false);
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      toast.error("Please enter your reply");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/employee/tasks/${task._id}/interaction`, {
        action: "reply_to_teamlead",
        data: { reply: replyText }
      });

      if (response.data.success) {
        toast.success("Reply submitted successfully!");
        setShowReplyDialog(false);
        fetchInteractionData();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error(error.response?.data?.error || "Failed to submit reply");
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || !selectedEmployee) {
      toast.error("Please enter comment and select employee");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`/api/employee/tasks/${task._id}/interaction`, {
        action: "comment_on_feedback",
        data: {
          comment: commentText,
          employeeId: selectedEmployee.id,
          feedbackId: selectedEmployee.feedbackId
        }
      });

      if (response.data.success) {
        toast.success("Comment added successfully!");
        setShowCommentDialog(false);
        setCommentText("");
        setSelectedEmployee(null);
        fetchInteractionData();
        if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.response?.data?.error || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  const toggleFeedbackExpansion = (feedbackId) => {
    setExpandedFeedback(prev => ({
      ...prev,
      [feedbackId]: !prev[feedbackId]
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "PPpp");
  };

  if (loading && !interactionData) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="teamlead" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Team Lead
          </TabsTrigger>
          <TabsTrigger value="feedbacks" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            All Feedbacks
          </TabsTrigger>
          <TabsTrigger value="comments" className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Comments
          </TabsTrigger>
        </TabsList>

        {/* Team Lead Tab */}
        <TabsContent value="teamlead" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-500" />
                Team Lead Feedback
              </CardTitle>
              {task.assignedTo?.length > 0 && (
                <CardDescription>
                  From: {task.assignedTo[0]?.firstName} {task.assignedTo[0]?.lastName}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {task.teamLeadFeedback ? (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-orange-800 italic">
                      "{task.teamLeadFeedback}"
                    </p>
                    <div className="text-xs text-orange-600 mt-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      {task.status2 === "approved" ? "Approved" : "Feedback provided"}
                    </div>
                  </div>

                  {/* Employee's Reply */}
                  {interactionData?.employeeReply ? (
                    <div className="ml-8">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          Your Reply
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatDate(interactionData.employeeRepliedAt)}
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800">{interactionData.employeeReply}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-blue-600"
                        onClick={() => setShowReplyDialog(true)}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Edit Reply
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowReplyDialog(true)}
                      className="bg-orange-500 hover:bg-orange-600 text-white"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Reply to Team Lead
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No feedback from team lead yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Feedbacks Tab */}
        <TabsContent value="feedbacks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                All Employees' Feedback
              </CardTitle>
              <CardDescription>
                {interactionData?.allFeedbacks?.length || 0} feedbacks submitted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interactionData?.allFeedbacks?.length > 0 ? (
                <div className="space-y-4">
                  {interactionData.allFeedbacks.map((feedback) => (
                    <div
                      key={feedback.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                              {feedback.employeeName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-gray-900">
                                {feedback.employeeName}
                              </h4>
                              {feedback.isOwnFeedback && (
                                <Badge variant="outline" className="text-xs">
                                  You
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="w-3 h-3" />
                              {feedback.employeeDepartment}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {formatDate(feedback.submittedAt)}
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowCommentDialog(true)}
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Comment
                        </Button>
                      </div>

                      <div className="mt-3">
                        <p className={`text-gray-700 ${!expandedFeedback[feedback.id] && 'line-clamp-2'}`}>
                          {feedback.feedback}
                        </p>
                        {feedback.feedback.length > 150 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto text-blue-600"
                            onClick={() => toggleFeedbackExpansion(feedback.id)}
                          >
                            {expandedFeedback[feedback.id] ? (
                              <>
                                Show less <ChevronUp className="w-4 h-4 ml-1" />
                              </>
                            ) : (
                              <>
                                Read more <ChevronDown className="w-4 h-4 ml-1" />
                              </>
                            )}
                          </Button>
                        )}
                      </div>

                      {/* Comments on this feedback */}
                      {interactionData.comments
                        ?.filter(comment => comment.feedbackId === feedback.id)
                        .map(comment => (
                          <div key={comment.id} className="ml-8 mt-3 pt-3 border-t">
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-xs">
                                  {comment.commentBy.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{comment.commentBy.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {comment.commentBy.role}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 ml-8">{comment.comment}</p>
                          </div>
                        ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No feedback submitted by employees yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Comments Tab */}
        <TabsContent value="comments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                Comments on Feedback
              </CardTitle>
              <CardDescription>
                {interactionData?.comments?.length || 0} comments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {interactionData?.comments?.length > 0 ? (
                <div className="space-y-4">
                  {interactionData.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-green-200 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs">
                              {comment.commentBy.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-gray-900">
                                {comment.commentBy.name}
                              </h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  comment.commentBy.role === "Manager"
                                    ? "border-purple-200 text-purple-700"
                                    : comment.commentBy.role === "TeamLead"
                                    ? "border-orange-200 text-orange-700"
                                    : "border-blue-200 text-blue-700"
                                }`}
                              >
                                {comment.commentBy.role}
                              </Badge>
                            </div>
                            <div className="text-xs text-gray-500">
                              Commented on {comment.commentOnEmployee.name}'s feedback
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 ml-11">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    No comments on feedback yet.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setActiveTab("feedbacks")}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Feedback to Comment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reply to Team Lead Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="w-5 h-5 text-orange-500" />
              Reply to Team Lead Feedback
            </DialogTitle>
            <DialogDescription>
              Respond to team lead's feedback for task: {task.clinetName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Team Lead's Feedback:</h4>
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <p className="text-orange-800 italic">"{task.teamLeadFeedback}"</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Your Reply:</h4>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply here..."
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowReplyDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReplySubmit}
                disabled={loading || !replyText.trim()}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Send className="w-4 h-4 mr-2" />
                Submit Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Comment on Feedback Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Comment on Feedback
            </DialogTitle>
            <DialogDescription>
              Add a comment to employee's feedback
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Select Employee:</h4>
              <div className="grid grid-cols-1 gap-2">
                {interactionData?.allFeedbacks
                  ?.filter(fb => !fb.isOwnFeedback)
                  .map(feedback => (
                    <Button
                      key={feedback.id}
                      variant={selectedEmployee?.id === feedback.id ? "default" : "outline"}
                      className="justify-start h-auto py-3"
                      onClick={() => {
                        setSelectedEmployee({
                          id: feedback.employeeId,
                          name: feedback.employeeName,
                          feedbackId: feedback.id
                        });
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">{feedback.employeeName}</div>
                        <div className="text-xs text-gray-500 truncate">
                          {feedback.feedback.substring(0, 50)}...
                        </div>
                      </div>
                    </Button>
                  ))}
              </div>
            </div>

            {selectedEmployee && (
              <>
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Comment on {selectedEmployee.name}'s feedback:
                  </h4>
                  <Textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Type your comment here..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCommentDialog(false);
                      setSelectedEmployee(null);
                      setCommentText("");
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCommentSubmit}
                    disabled={loading || !commentText.trim()}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Send className="w-4 h-4 mr-2" />
                    Post Comment
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TaskInteractionPanel;