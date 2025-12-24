// components/employee/EmployeeFeedbackSystem.jsx
"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
  MoreVertical,
  Loader2,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

export default function EmployeeFeedbackSystem({
  taskId,
  feedbacks,
  teamLeads,
  currentEmployee,
  onFeedbackAdded,
}) {
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [expandedReplies, setExpandedReplies] = useState({});
  const [submittingReply, setSubmittingReply] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState(null);

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
    if (!dateString) return "";
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
    return teamLeads.find(tl => tl._id === teamLeadId) || {};
  };

  const handleReplySubmit = async (feedbackId) => {
    if (!replyText.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await axios.put(`/api/employee/tasks/${taskId}/feedback/reply`, {
        feedbackId,
        reply: replyText,
        repliedBy: "employee",
        repliedByName: `${currentEmployee.firstName} ${currentEmployee.lastName}`
      });

      if (response.status === 200) {
        toast.success("Reply added successfully!");
        setReplyText("");
        setReplyingTo(null);
        setShowReplyDialog(false);
        setSelectedFeedback(null);
        onFeedbackAdded(); // Refresh data
      }
    } catch (error) {
      console.error("Add reply error:", error);
      toast.error(error.response?.data?.error || "Failed to add reply");
    } finally {
      setSubmittingReply(false);
    }
  };

  const toggleReplies = (feedbackId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [feedbackId]: !prev[feedbackId]
    }));
  };

  const openReplyDialog = (feedback) => {
    setSelectedFeedback(feedback);
    setReplyText("");
    setShowReplyDialog(true);
  };

  const getReplyAuthorInfo = (reply) => {
    if (reply.repliedByModel === "Employee") {
      return {
        name: "You",
        role: "Employee",
        color: "from-green-500 to-emerald-600",
        textColor: "text-green-700"
      };
    } else if (reply.repliedByModel === "TeamLead") {
      const teamLead = getTeamLeadById(reply.repliedBy);
      return {
        name: teamLead.firstName ? `${teamLead.firstName} ${teamLead.lastName}` : "Team Lead",
        role: "Team Lead",
        color: "from-orange-500 to-amber-600",
        textColor: "text-orange-700"
      };
    } else if (reply.repliedByModel === "Manager") {
      return {
        name: "Manager",
        role: "Manager",
        color: "from-purple-500 to-pink-600",
        textColor: "text-purple-700"
      };
    }
    return {
      name: "Unknown",
      role: "User",
      color: "from-gray-500 to-gray-600",
      textColor: "text-gray-700"
    };
  };

  const hasEmployeeReplied = (feedback) => {
    return feedback.replies?.some(reply => reply.repliedByModel === "Employee");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Team Lead Feedback</h2>
          <p className="text-gray-600 text-sm">
            View feedback from your team leads and reply to them
          </p>
        </div>
        <Badge className="bg-indigo-100 text-indigo-800">
          {feedbacks.length} feedback{feedbacks.length !== 1 ? 's' : ''}
        </Badge>
      </div>

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
              Your team lead hasn't provided any feedback yet.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-left">
                  <p className="font-medium text-blue-900">Tips for employees:</p>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Team leads provide feedback to guide your work</li>
                    <li>• You can reply to ask questions or provide updates</li>
                    <li>• Feedback helps improve your performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbacks.map((feedback) => {
            const teamLead = getTeamLeadById(feedback.teamLeadId);
            const isExpanded = expandedReplies[feedback._id];
            const employeeHasReplied = hasEmployeeReplied(feedback);

            return (
              <Card key={feedback._id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  {/* Feedback Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white shadow">
                        <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-600 text-white">
                          {teamLead.firstName?.[0]}
                          {teamLead.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">
                            {teamLead.firstName} {teamLead.lastName}
                          </p>
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            Team Lead
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativeDate(feedback.submittedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {employeeHasReplied && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          <ThumbsUp className="w-3 h-3 mr-1" />
                          Replied
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="mb-4">
                    <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-4">
                      {feedback.feedback}
                    </p>
                  </div>

                  {/* Replies Section */}
                  {feedback.replies && feedback.replies.length > 0 && (
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
                          {feedback.replies.map((reply, index) => {
                            const authorInfo = getReplyAuthorInfo(reply);
                            const isEmployeeReply = reply.repliedByModel === "Employee";

                            return (
                              <div
                                key={index}
                                className={`flex gap-3 p-3 rounded-lg ${
                                  isEmployeeReply 
                                    ? "bg-green-50 border border-green-200" 
                                    : "bg-gray-50 border border-gray-200"
                                }`}
                              >
                                <Avatar className="w-8 h-8">
                                  <AvatarFallback className={`bg-gradient-to-r ${authorInfo.color} text-white text-xs`}>
                                    {authorInfo.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-sm font-medium ${authorInfo.textColor}`}>
                                        {authorInfo.name}
                                      </span>
                                      <Badge className={`text-xs ${
                                        isEmployeeReply 
                                          ? "bg-green-100 text-green-800" 
                                          : "bg-blue-100 text-blue-800"
                                      }`}>
                                        {authorInfo.role}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                      {formatRelativeDate(reply.repliedAt)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-700 mt-1">
                                    {reply.reply}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reply Button */}
                  <div className="mt-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openReplyDialog(feedback)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                    >
                      <Reply className="w-4 h-4 mr-2" />
                      {employeeHasReplied ? "Reply Again" : "Reply to Feedback"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="max-w-lg bg-white text-gray-900 border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
              <Reply className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
              Reply to Feedback
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm md:text-base">
              Your reply will be visible to the team lead and manager.
            </DialogDescription>
          </DialogHeader>

          {selectedFeedback && (
            <div className="space-y-4">
              {/* Original Feedback Preview */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="bg-gradient-to-r from-orange-500 to-amber-600 text-white text-xs">
                      {getTeamLeadById(selectedFeedback.teamLeadId).firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-gray-900">
                    {getTeamLeadById(selectedFeedback.teamLeadId).firstName} {getTeamLeadById(selectedFeedback.teamLeadId).lastName}
                  </span>
                  <Badge className="text-xs bg-orange-100 text-orange-800">Team Lead</Badge>
                </div>
                <p className="text-sm text-gray-600 italic">
                  "{selectedFeedback.feedback.slice(0, 200)}..."
                </p>
              </div>

              {/* Reply Textarea */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Your Reply</Label>
                <Textarea
                  placeholder="Type your reply here... Ask questions, provide updates, or clarify anything."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 min-h-[120px]"
                />
                <p className="text-xs text-gray-500">
                  Your reply will be sent to the team lead and manager.
                </p>
              </div>

              {/* Tips */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <ThumbsUp className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900 text-sm">Tips for effective replies:</p>
                    <ul className="mt-1 text-xs text-green-700 space-y-1">
                      <li>• Be clear and specific in your response</li>
                      <li>• Ask questions if you need clarification</li>
                      <li>• Provide updates on your progress</li>
                      <li>• Show appreciation for constructive feedback</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => {
                setShowReplyDialog(false);
                setSelectedFeedback(null);
                setReplyText("");
              }}
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleReplySubmit(selectedFeedback._id)}
              disabled={submittingReply || !replyText.trim()}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg w-full sm:w-auto"
            >
              {submittingReply ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}