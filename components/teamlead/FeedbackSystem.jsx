// components/teamlead/FeedbackSystem.jsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Send,
  User,
  Clock,
  Reply,
  Edit,
  Trash2,
  MoreVertical,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function FeedbackSystem({
  taskId,
  feedbacks,
  teamLeads,
  currentTeamLead,
  onFeedbackAdded,
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [editingFeedback, setEditingFeedback] = useState(null);
  const [editText, setEditText] = useState("");
  const [deletingFeedback, setDeletingFeedback] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [submittingReply, setSubmittingReply] = useState(false);
  const [submittingEdit, setSubmittingEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatRelativeDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  const getTeamLeadById = (teamLeadId) => {
    // If teamLeadId is already populated as an object
    if (teamLeadId && typeof teamLeadId === 'object' && teamLeadId._id) {
      return teamLeadId;
    }
    return teamLeads.find(tl => (tl._id?.toString() || tl._id) === (teamLeadId?.toString() || teamLeadId)) || {};
  };

  const handleReplySubmit = async (feedbackId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await axios.put(`/api/teamlead/tasks/${taskId}/feedback`, {
        feedbackId,
        reply: replyText
      });

      if (response.status === 200) {
        toast.success("Reply added successfully!");
        setReplyText("");
        setReplyingTo(null);
        onFeedbackAdded(); // Refresh data
      }
    } catch (error) {
      console.error("Add reply error:", error);
      toast.error(error.response?.data?.error || "Failed to add reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditSubmit = async (feedbackId) => {
    if (!editText.trim()) {
      toast.error("Please enter feedback");
      return;
    }

    setSubmittingEdit(true);
    try {
      const response = await axios.put(`/api/teamlead/tasks/${taskId}/feedback/${feedbackId}`, {
        feedback: editText
      });

      if (response.status === 200) {
        toast.success("Feedback updated successfully!");
        setEditText("");
        setEditingFeedback(null);
        onFeedbackAdded(); // Refresh data
      }
    } catch (error) {
      console.error("Edit feedback error:", error);
      toast.error(error.response?.data?.error || "Failed to update feedback");
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteFeedback = async () => {
    if (!deletingFeedback) return;

    setDeleting(true);
    try {
      const response = await axios.delete(
        `/api/teamlead/tasks/${taskId}/feedback?feedbackId=${deletingFeedback._id}`
      );

      if (response.status === 200) {
        toast.success("Feedback deleted successfully!");
        setShowDeleteDialog(false);
        setDeletingFeedback(null);
        onFeedbackAdded(); // Refresh data
      }
    } catch (error) {
      console.error("Delete feedback error:", error);
      toast.error(error.response?.data?.error || "Failed to delete feedback");
    } finally {
      setDeleting(false);
    }
  };

  const toggleReplies = (feedbackId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [feedbackId]: !prev[feedbackId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Feedback List */}
      {feedbacks.length === 0 ? (
        <Card className="border-0 shadow-sm bg-white">
          <CardContent className="text-center py-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
              <MessageSquare className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Feedback Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Be the first to add feedback for this task.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const teamLead = getTeamLeadById(feedback.teamLeadId);
            const isAuthor = currentTeamLead?._id === feedback.teamLeadId;
            const isExpanded = expandedReplies[feedback._id];

            return (
              <Card key={feedback._id} className="border-0 shadow-sm bg-white">
                <CardContent className="p-6">
                  {/* Feedback Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow">
                        {teamLead.profilePic && (
                          <AvatarImage src={teamLead.profilePic} alt={`${teamLead.firstName} ${teamLead.lastName}`} />
                        )}
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                          {teamLead.firstName?.[0]}
                          {teamLead.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {teamLead.firstName} {teamLead.lastName}
                          </p>
                          {isAuthor && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                              You
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeDate(feedback.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {isAuthor && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingFeedback(feedback);
                            setEditText(feedback.feedback);
                          }}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setDeletingFeedback(feedback);
                              setShowDeleteDialog(true);
                            }}
                            className="text-rose-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Feedback Content */}
                  {editingFeedback?._id === feedback._id ? (
                    <div className="space-y-3 mb-4">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleEditSubmit(feedback._id)}
                          disabled={submittingEdit}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {submittingEdit ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingFeedback(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {feedback.feedback}
                      </p>
                    </div>
                  )}

                  {/* Replies Section */}
                  {feedback.replies?.length > 0 && (
                    <div className="mt-4 border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-700">
                            {feedback.replies.length} repl
                            {feedback.replies.length === 1 ? 'y' : 'ies'}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleReplies(feedback._id)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="space-y-3 mt-3">
                          {feedback.replies.map((reply, index) => (
                            <div
                              key={index}
                              className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                            >
                              <Avatar className="w-8 h-8">
                                {reply.repliedBy?.profilePic && (
                                  <AvatarImage src={reply.repliedBy.profilePic} alt={reply.repliedBy.firstName} />
                                )}
                                <AvatarFallback className="bg-gradient-to-r from-gray-500 to-gray-600 text-white text-xs">
                                  {reply.repliedBy?.firstName?.[0] || (reply.repliedByModel === 'TeamLead' ? 'TL' : 
                                   reply.repliedByModel === 'Manager' ? 'M' : 'E')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-gray-900">
                                    {reply.repliedBy?.firstName ? `${reply.repliedBy.firstName} ${reply.repliedBy.lastName}` : reply.repliedByModel}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] h-4 px-1 bg-gray-600">
                                    {reply.repliedByModel}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatRelativeDate(reply.repliedAt)}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mt-1">
                                  {reply.reply}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Form */}
                  {replyingTo === feedback._id ? (
                    <div className="mt-4 space-y-3">
                      <Textarea
                        placeholder="Write your reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        rows={2}
                        className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleReplySubmit(feedback._id)}
                          disabled={submittingReply}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {submittingReply ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4 mr-2" />
                          )}
                          Post Reply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(feedback._id)}
                      className="mt-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md bg-white text-gray-900 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 text-rose-600" />
              Delete Feedback
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              Are you sure you want to delete this feedback? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletingFeedback(null);
              }}
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteFeedback}
              disabled={deleting}
              className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white shadow-lg w-full sm:w-auto"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Feedback
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}