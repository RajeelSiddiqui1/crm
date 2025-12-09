"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  User,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Eye,
  Loader2,
  Edit,
  Trash2,
  EyeOff,
  Star,
  Upload,
  MapPin,
  CreditCard,
  Phone,
  Link,
  CheckSquare,
  Radio,
  SlidersHorizontal,
  ToggleLeft,
  Mail,
  Hash,
  List,
  Lock,
  X,
  Download,
  Users,
  Building,
  Volume2,
  Play,
  Pause,
  ArrowLeft,
  Save,
  Shield,
  Target,
  ClipboardCheck,
  MessageSquare,
  BarChart3,
  Users2,
  RefreshCw,
  Info,
  CheckCheck,
  AlertTriangle,
} from "lucide-react";
import axios from "axios";

export default function ManagerEditSubmissionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const submissionId = params.id;

  const [submission, setSubmission] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);
  const [availableTeamLeads, setAvailableTeamLeads] = useState([]);
  const [adminTask, setAdminTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [updatingTeamLead, setUpdatingTeamLead] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [audioPlaying, setAudioPlaying] = useState(null);
  const [selectedTeamLead, setSelectedTeamLead] = useState("");
  const [allTeamLeadsAssigned, setAllTeamLeadsAssigned] = useState(false);
  const [previouslyAssignedTeamLeads, setPreviouslyAssignedTeamLeads] = useState([]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchSubmissionDetails();
    fetchTeamLeads();
  }, [session, status, router, submissionId]);

  const fetchSubmissionDetails = async () => {
    try {
      setFetching(true);
      const response = await axios.get(
        `/api/manager/submissions/${submissionId}`
      );
      if (response.status === 200) {
        const submissionData = response.data;
        setSubmission(submissionData);
        setSelectedTeamLead(submissionData.assignedTo?._id || "");

        // Get previously assigned team leads (from multipleTeamLeadAssigned)
        if (submissionData.multipleTeamLeadAssigned) {
          const prevAssigned = submissionData.multipleTeamLeadAssigned
            .filter(tl => tl._id)
            .map(tl => ({
              id: tl._id,
              name: `${tl.firstName} ${tl.lastName}`,
              initials: `${tl.firstName[0]}${tl.lastName[0]}`,
              email: tl.email
            }));
          setPreviouslyAssignedTeamLeads(prevAssigned);
        }

        if (submissionData.adminTask) {
          fetchAdminTask(submissionData.adminTask);
        }
      }
    } catch (error) {
      console.error("Error fetching submission details:", error);
      toast.error("Failed to fetch submission details");
    } finally {
      setFetching(false);
    }
  };

  const fetchTeamLeads = async () => {
    try {
      const response = await axios.get("/api/manager/teamlead");
      if (response.status === 200) {
        const data = response.data;
        const leads = Array.isArray(data) ? data : data.teamLeads || [];
        setTeamLeads(leads);
        
        // Check if all team leads are already assigned
        checkAllTeamLeadsAssigned(leads);
      }
    } catch (error) {
      console.error("Error fetching team leads:", error);
      toast.error("Failed to load team leads");
    }
  };

  const checkAllTeamLeadsAssigned = (allLeads) => {
    if (!submission || !allLeads.length) return;

    const allLeadIds = allLeads.map(tl => tl._id);
    const assignedLeadIds = [
      submission.assignedTo?._id,
      ...(submission.multipleTeamLeadAssigned?.map(tl => tl._id) || [])
    ].filter(Boolean);

    // Check if all team leads are already assigned
    const allAssigned = allLeadIds.every(leadId => 
      assignedLeadIds.some(assignedId => assignedId === leadId)
    );

    setAllTeamLeadsAssigned(allAssigned);

    // Set available team leads (excluding current and previously assigned)
    const available = allLeads.filter(lead => 
      !assignedLeadIds.includes(lead._id)
    );
    setAvailableTeamLeads(available);
  };

  useEffect(() => {
    if (teamLeads.length > 0 && submission) {
      checkAllTeamLeadsAssigned(teamLeads);
    }
  }, [teamLeads, submission]);

  const fetchAdminTask = async (adminTaskId) => {
    try {
      const response = await axios.get(`/api/admin/tasks/${adminTaskId}`);
      if (response.status === 200) {
        setAdminTask(response.data);
      }
    } catch (error) {
      console.error("Error fetching admin task:", error);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setSubmission((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [fieldName]: value,
      },
    }));
  };

  const handleManagerCommentsChange = (value) => {
    setSubmission((prev) => ({
      ...prev,
      managerComments: value,
    }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleTeamLeadChange = async () => {
    if (!selectedTeamLead) {
      toast.error("Please select a team lead");
      return;
    }

    if (selectedTeamLead === submission.assignedTo?._id) {
      toast.info("Team lead is already assigned");
      return;
    }

    // Check if the selected team lead is already in previously assigned
    const isPreviouslyAssigned = previouslyAssignedTeamLeads.some(
      tl => tl.id === selectedTeamLead
    );
    
    if (isPreviouslyAssigned) {
      toast.warning("This team lead was previously assigned. Consider selecting a new team lead.");
    }

    try {
      setUpdatingTeamLead(true);
      const response = await axios.put(
        `/api/manager/submissions/${submissionId}`,
        {
          assignedTeamLeadId: selectedTeamLead,
          formData: submission.formData,
          managerComments: submission.managerComments,
        }
      );

      if (response.status === 200) {
        toast.success("Team lead reassigned successfully!");
        fetchSubmissionDetails(); // Refresh data
        fetchTeamLeads(); // Refresh team leads list
      }
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Failed to reassign team lead"
      );
    } finally {
      setUpdatingTeamLead(false);
    }
  };

  const playAudio = (audioUrl) => {
    if (audioPlaying) {
      const audio = document.getElementById("admin-task-audio");
      if (audio) {
        audio.pause();
      }
      setAudioPlaying(null);
    } else {
      const audio = document.getElementById("admin-task-audio");
      if (audio) {
        audio.play();
        audio.onended = () => setAudioPlaying(null);
        setAudioPlaying(true);
      }
    }
  };

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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20";
      case "medium":
        return "bg-yellow-500/10 text-yellow-700 border-yellow-200 hover:bg-yellow-500/20";
      case "low":
        return "bg-green-500/10 text-green-700 border-green-200 hover:bg-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-700 border-gray-200 hover:bg-gray-500/20";
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      case "in_progress":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200 hover:bg-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
      case "approved":
        return <CheckCircle className="w-3 h-3" />;
      case "in_progress":
        return <Clock className="w-3 h-3" />;
      case "pending":
        return <AlertCircle className="w-3 h-3" />;
      case "rejected":
        return <XCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  const getFieldIcon = (fieldType) => {
    const fieldIcons = {
      text: FileText,
      email: Mail,
      number: Hash,
      tel: Phone,
      url: Link,
      password: Lock,
      date: Calendar,
      select: List,
      textarea: FileText,
      checkbox: CheckSquare,
      radio: Radio,
      range: SlidersHorizontal,
      file: Upload,
      rating: Star,
      toggle: ToggleLeft,
      address: MapPin,
      creditCard: CreditCard,
    };
    return fieldIcons[fieldType] || FileText;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `/api/manager/submissions/${submissionId}`,
        {
          formData: submission.formData,
          managerComments: submission.managerComments,
        }
      );

      if (response.status === 200) {
        toast.success("Submission updated successfully!");
        router.push("/manager/submissions");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update submission");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this submission? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/manager/submissions/${submissionId}`
      );

      if (response.status === 200) {
        toast.success("Submission deleted successfully!");
        router.push("/manager/submissions");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete submission");
    }
  };

  if (status === "loading" || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg border border-blue-100">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Loading Submission
            </h3>
            <p className="text-gray-600">Preparing your editing workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200 max-w-md">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Submission Not Found
          </h2>
          <p className="text-gray-700 mb-6">
            The submission you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <Button
            onClick={() => router.push("/manager/submissions")}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-2.5"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Submissions
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4 sm:p-6">
      <Toaster position="top-right" richColors />

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/manager/submissions")}
              className="rounded-xl border-blue-200 bg-white hover:bg-blue-50 text-blue-700 hover:text-blue-800 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Submissions
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-blue-100">
                <Edit className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  Edit Submission
                </h1>
                <p className="text-gray-700 mt-2 text-lg font-medium">
                  {submission.formId?.title || "Submission Details"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => router.push("/manager/dashboard")}
              variant="outline"
              className="border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button
              onClick={() =>
                router.push(`/group-chat?submissionId=${submissionId}`)
              }
              variant="outline"
              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Group Chat
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Side - Admin Task & Submission Info */}
          <div className="space-y-6">
            {/* Team Lead Assignment Card */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-amber-700 rounded-xl flex items-center justify-center">
                      <Users2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-xl font-bold">
                        Assign Team Lead
                      </CardTitle>
                      <CardDescription className="text-gray-700 font-medium">
                        Override current assignment
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Current Team Lead */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white">
                        <AvatarFallback className="bg-blue-600 text-white font-bold">
                          {submission.assignedTo?.firstName?.[0] || "T"}
                          {submission.assignedTo?.lastName?.[0] || "L"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-gray-900 font-bold text-sm">
                          {submission.assignedTo
                            ? `${submission.assignedTo.firstName} ${submission.assignedTo.lastName}`
                            : "Not Assigned"}
                        </span>
                        <p className="text-gray-600 text-xs">
                          {submission.assignedTo?.email ||
                            "No team lead assigned"}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 font-medium">
                      Current
                    </Badge>
                  </div>

                  {/* Warning Message if All Team Leads Assigned */}
                  {allTeamLeadsAssigned ? (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-yellow-800 text-sm">
                            All Team Leads Already Assigned
                          </h4>
                          <p className="text-yellow-700 text-xs mt-1">
                            Every team lead in your department has been assigned to this submission at some point. 
                            Consider contacting administrators for additional support.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Label className="text-gray-800 font-semibold">
                        Assign New Team Lead
                      </Label>
                      <div className="flex gap-3">
                        <Select
                          value={selectedTeamLead}
                          onValueChange={setSelectedTeamLead}
                          disabled={updatingTeamLead || allTeamLeadsAssigned}
                        >
                          <SelectTrigger className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                            <SelectValue placeholder={
                              availableTeamLeads.length > 0 
                                ? "Select a team lead" 
                                : "No available team leads"
                            } />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTeamLeads.length > 0 ? (
                              availableTeamLeads.map((teamLead) => (
                                <SelectItem key={teamLead._id} value={teamLead._id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs bg-green-100 text-green-800">
                                        {teamLead.firstName[0]}
                                        {teamLead.lastName[0]}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <span className="text-gray-900 font-medium">
                                        {teamLead.firstName} {teamLead.lastName}
                                      </span>
                                      {teamLead.designation && (
                                        <p className="text-gray-600 text-xs">
                                          {teamLead.designation}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                No team leads available for assignment
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleTeamLeadChange}
                          disabled={
                            !selectedTeamLead ||
                            selectedTeamLead === submission.assignedTo?._id ||
                            updatingTeamLead ||
                            allTeamLeadsAssigned
                          }
                          className="bg-gradient-to-r from-orange-600 to-amber-700 hover:from-orange-700 hover:to-amber-800 text-white whitespace-nowrap"
                        >
                          {updatingTeamLead ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Assigning...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Reassign
                            </>
                          )}
                        </Button>
                      </div>
                      {availableTeamLeads.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Info className="w-3 h-3" />
                          <span>
                            {availableTeamLeads.length} team lead{availableTeamLeads.length !== 1 ? 's' : ''} available for assignment
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previously Assigned Team Leads */}
                  {previouslyAssignedTeamLeads.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <Label className="text-gray-800 font-semibold text-sm">
                          Previously Assigned Team Leads
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {previouslyAssignedTeamLeads.length} total
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {previouslyAssignedTeamLeads.map((teamLead) => (
                          <Badge
                            key={teamLead.id}
                            variant="outline"
                            className={`rounded-full px-3 py-1.5 gap-1.5 ${
                              teamLead.id === submission.assignedTo?._id
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-gray-50 text-gray-700 border-gray-200"
                            }`}
                          >
                            <Avatar className="w-4 h-4">
                              <AvatarFallback className={`text-xs ${
                                teamLead.id === submission.assignedTo?._id
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-gray-200 text-gray-800"
                              }`}>
                                {teamLead.initials}
                              </AvatarFallback>
                            </Avatar>
                            {teamLead.name}
                          </Badge>
                        ))}
                      </div>
                      {allTeamLeadsAssigned && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded-lg">
                          <CheckCheck className="w-4 h-4 text-blue-600" />
                          <span className="text-xs text-blue-700">
                            All {teamLeads.length} team leads have been assigned at some point
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Team Leads Statistics */}
                  {teamLeads.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-200">
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xl font-bold text-gray-900">
                          {teamLeads.length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Total Team Leads
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xl font-bold text-green-600">
                          {availableTeamLeads.length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Available
                        </div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                        <div className="text-xl font-bold text-orange-600">
                          {previouslyAssignedTeamLeads.length}
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Previously Assigned
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Rest of the code remains the same... */}
            {/* Admin Task Reference */}
            {adminTask && (
              <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                      <Target className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-900 text-xl font-bold">
                        Admin Task Reference
                      </CardTitle>
                      <CardDescription className="text-gray-700 font-medium">
                        Original task details
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <h3 className="font-bold text-gray-900 text-lg mb-2">
                        {adminTask.title}
                      </h3>
                      <p className="text-gray-700 text-sm font-medium">
                        {adminTask.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-blue-600" />
                          <Label className="text-sm font-semibold text-gray-700">
                            Client
                          </Label>
                        </div>
                        <p className="text-gray-900 font-bold text-sm">
                          {adminTask.clientName || "No client specified"}
                        </p>
                      </div>
                      <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-600" />
                          <Label className="text-sm font-semibold text-gray-700">
                            Priority
                          </Label>
                        </div>
                        <Badge
                          className={`${getPriorityColor(
                            adminTask.priority
                          )} capitalize text-xs font-bold`}
                        >
                          {adminTask.priority}
                        </Badge>
                      </div>
                    </div>

                    {adminTask.audioUrl && (
                      <div className="p-4 bg-white rounded-xl border border-gray-200">
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-blue-600" />
                          Voice Instructions
                        </Label>
                        <div className="flex items-center gap-3">
                          <Button
                            onClick={() => playAudio(adminTask.audioUrl)}
                            variant="outline"
                            className={`rounded-xl border-blue-600 ${
                              audioPlaying
                                ? "text-white bg-blue-600"
                                : "text-blue-700"
                            }`}
                          >
                            {audioPlaying ? (
                              <Pause className="w-4 h-4 mr-2" />
                            ) : (
                              <Play className="w-4 h-4 mr-2" />
                            )}
                            {audioPlaying ? "Pause Audio" : "Play Instructions"}
                          </Button>
                          <audio
                            id="admin-task-audio"
                            src={adminTask.audioUrl}
                            onEnded={() => setAudioPlaying(null)}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submission Information */}
            <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-700 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-gray-900 text-xl font-bold">
                      Submission Information
                    </CardTitle>
                    <CardDescription className="text-gray-700 font-medium">
                      Team hierarchy and timeline
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200">
                      <Label className="text-sm font-semibold text-gray-700">
                        Submission Date
                      </Label>
                      <p className="text-gray-900 font-bold">
                        {formatDate(submission.createdAt)}
                      </p>
                    </div>
                    <div className="space-y-2 p-4 bg-white rounded-xl border border-gray-200">
                      <Label className="text-sm font-semibold text-gray-700">
                        Last Updated
                      </Label>
                      <p className="text-gray-900 font-bold">
                        {formatDate(submission.updatedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-gray-700">
                      Status Hierarchy
                    </Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarFallback className="bg-blue-600 text-white text-sm font-bold">
                              M
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-gray-700 font-medium">
                              Manager
                            </span>
                            <p className="text-gray-500 text-xs">You</p>
                          </div>
                        </div>
                        <Badge
                          className={`${getStatusVariant(
                            submission.status
                          )} border flex items-center gap-1 px-3 py-1 font-medium`}
                        >
                          {getStatusIcon(submission.status)}
                          {submission.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8 border-2 border-white">
                            <AvatarFallback className="bg-green-600 text-white text-sm font-bold">
                              TL
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-gray-700 font-medium">
                              Team Lead
                            </span>
                            <p className="text-gray-500 text-xs">Reviewer</p>
                          </div>
                        </div>
                        <Badge
                          className={`${getStatusVariant(
                            submission.status2
                          )} border flex items-center gap-1 px-3 py-1 font-medium`}
                        >
                          {getStatusIcon(submission.status2)}
                          {submission.status2.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {submission.teamLeadFeedback && (
                    <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                      <Label className="text-sm font-semibold text-gray-700">
                        Team Lead Feedback
                      </Label>
                      <p className="text-gray-900 font-medium mt-2 bg-white p-3 rounded-lg border border-yellow-100">
                        {submission.teamLeadFeedback}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Edit Form */}
          <Card className="border-0 shadow-2xl bg-white rounded-2xl overflow-hidden border border-blue-100">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50/50 border-b border-blue-100 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Edit className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900 text-xl font-bold">
                    Edit Form Data
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    Update submission details
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Data Fields */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Form Data
                  </h3>

                  <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50/50">
                    {submission.formData &&
                      Object.entries(submission.formData).map(
                        ([fieldName, fieldValue]) => {
                          const fieldConfig = submission.formId?.fields?.find(
                            (f) => f.name === fieldName
                          );
                          const IconComponent = fieldConfig
                            ? getFieldIcon(fieldConfig.type)
                            : FileText;

                          return (
                            <div
                              key={fieldName}
                              className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white"
                            >
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <Label className="text-gray-800 font-semibold text-base capitalize">
                                  {fieldName.replace(/([A-Z])/g, " $1").trim()}
                                  {fieldConfig?.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </Label>
                              </div>

                              {fieldConfig?.type === "password" ? (
                                <div className="relative">
                                  <Input
                                    type={
                                      showPasswords[fieldName]
                                        ? "text"
                                        : "password"
                                    }
                                    value={fieldValue || ""}
                                    onChange={(e) =>
                                      handleFieldChange(
                                        fieldName,
                                        e.target.value
                                      )
                                    }
                                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white pr-10"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      togglePasswordVisibility(fieldName)
                                    }
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                  >
                                    {showPasswords[fieldName] ? (
                                      <EyeOff className="w-4 h-4" />
                                    ) : (
                                      <Eye className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              ) : fieldConfig?.type === "textarea" ? (
                                <Textarea
                                  value={fieldValue || ""}
                                  onChange={(e) =>
                                    handleFieldChange(fieldName, e.target.value)
                                  }
                                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white min-h-[100px]"
                                  rows={4}
                                />
                              ) : (
                                <Input
                                  value={fieldValue || ""}
                                  onChange={(e) =>
                                    handleFieldChange(fieldName, e.target.value)
                                  }
                                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white"
                                />
                              )}
                            </div>
                          );
                        }
                      )}
                  </div>
                </div>

                {/* Manager Comments */}
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    Your Comments & Feedback
                  </h3>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label
                        htmlFor="managerComments"
                        className="text-gray-800 font-semibold"
                      >
                        Comments
                      </Label>
                      <Textarea
                        value={submission.managerComments || ""}
                        onChange={(e) =>
                          handleManagerCommentsChange(e.target.value)
                        }
                        placeholder="Add your comments, feedback, or approval notes..."
                        className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 border-gray-300 text-gray-900 bg-white min-h-[120px]"
                        rows={6}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-2.5 flex-1 font-bold"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Update Submission"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDelete}
                    className="border-red-600 text-red-700 bg-white hover:bg-red-600 hover:text-white px-6 py-2.5"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}