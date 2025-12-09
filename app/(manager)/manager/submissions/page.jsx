"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
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
  Filter,
  Download,
  RefreshCw,
  Users,
  MessageCircle,
  Building,
  FolderOpen,
  BarChart3,
  Zap,
  Crown,
  UserCheck,
  UserX,
  TrendingUp,
  Target,
  Award,
  Shield,
  Sparkles,
  Rocket,
  Bell,
  ClipboardCheck,
  Check,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import axios from "axios";

export default function ManagerSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editingSubmission, setEditingSubmission] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState({
    status: "",
    managerComments: "",
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [depIdFilter, setdepIdFilter] = useState("all");
  const fileInputRefs = useRef({});

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchSubmissions();
  }, [session, status, router]);

  const fetchSubmissions = async () => {
    try {
      setFetching(true);
      const response = await axios.get(`/api/manager/submissions`);
      if (response.status === 200) {
        setSubmissions(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast.error("Failed to fetch submissions");
    } finally {
      setFetching(false);
    }
  };

  const canManagerUpdateStatus = (submission) => {
    return submission.status2 === "approved";
  };

  const getAvailableStatusOptions = (submission) => {
    if (!canManagerUpdateStatus(submission)) {
      return ["in_progress"];
    }
    return ["approved", "rejected", "in_progress", "pending", "completed"];
  };

  const handleStatusUpdate = async (submissionId, newStatus, comments = "") => {
    setLoading(true);

    try {
      const submission = submissions.find((s) => s._id === submissionId);
      if (!submission) {
        toast.error("Submission not found");
        return;
      }

      if (!canManagerUpdateStatus(submission) && newStatus !== "in_progress") {
        toast.error("Cannot update status until team lead approves");
        return;
      }

      const updateData = {
        submissionId: submissionId,
        status: newStatus,
        managerComments: comments,
      };

      const response = await axios.put("/api/manager/submissions", updateData);

      if (response.status === 200) {
        toast.success("Status updated successfully!");
        fetchSubmissions();
        setShowDetails(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatusUpdate = async (submissionId, newStatus) => {
    const submission = submissions.find((s) => s._id === submissionId);
    if (!submission) return;

    if (!canManagerUpdateStatus(submission) && newStatus !== "in_progress") {
      toast.error("Cannot update status until team lead approves");
      return;
    }

    await handleStatusUpdate(
      submissionId,
      newStatus,
      "Status updated via quick action"
    );
  };

  const handleEditSubmission = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.put(
        `/api/manager/submissions/${editingSubmission._id}`,
        {
          formData: editingSubmission.formData,
          managerComments: editingSubmission.managerComments,
        }
      );

      if (response.status === 200) {
        toast.success("Submission updated successfully!");
        setShowEditForm(false);
        setEditingSubmission(null);
        fetchSubmissions();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update submission");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
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
        fetchSubmissions();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete submission");
    }
  };

  const viewSubmissionDetails = (submission) => {
    setSelectedSubmission(submission);
    setStatusUpdate({
      status: submission.status,
      managerComments: submission.managerComments || "",
    });
    setShowDetails(true);
  };

  const editSubmission = (submission) => {
    setEditingSubmission({
      ...submission,
      formData: { ...submission.formData },
    });
    setShowEditForm(true);
    setShowPasswords({});
  };

  const handleEditFieldChange = (fieldName, value) => {
    setEditingSubmission((prev) => ({
      ...prev,
      formData: {
        ...prev.formData,
        [fieldName]: value,
      },
    }));
  };

  const togglePasswordVisibility = (fieldName) => {
    setShowPasswords((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const handleFileUploadClick = (fieldName) => {
    if (fileInputRefs.current[fieldName]) {
      fileInputRefs.current[fieldName].click();
    }
  };

  const handleFileChange = (fieldName, event) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleEditFieldChange(fieldName, files);
      toast.success(`File selected: ${files[0].name}`);
    }
  };

  const getTeamLeadFullName = (teamLead) => {
    if (!teamLead) return "Unassigned";

    if (teamLead.firstName && teamLead.lastName) {
      return `${teamLead.firstName} ${teamLead.lastName}`;
    }

    if (teamLead.name) {
      return teamLead.name;
    }

    return teamLead.email || "Unknown Team Lead";
  };

  const getTeamLeadEmail = (teamLead) => {
    if (!teamLead) return "";
    return teamLead.email || "";
  };

  const isTaskClaimed = (submission) => {
    return submission.assignedTo && submission.claimedAt;
  };

  const getClaimStatus = (submission) => {
    if (isTaskClaimed(submission)) {
      return {
        status: "claimed",
        message: `Claimed by ${getTeamLeadFullName(submission.assignedTo)}`,
        icon: Crown,
        color:
          "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200",
      };
    }

    if (
      submission.multipleTeamLeadAssigned &&
      submission.multipleTeamLeadAssigned.length > 0
    ) {
      return {
        status: "available",
        message: `Available for ${submission.multipleTeamLeadAssigned.length} team leads`,
        icon: Users,
        color:
          "bg-green-100 text-green-800 border-green-200 hover:bg-green-200",
      };
    }

    return {
      status: "single",
      message: "Assigned to single team lead",
      icon: User,
      color: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200",
    };
  };

  const formatFieldValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-gray-500 italic">Not provided</span>;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      if (value.email || value.firstName || value.lastName) {
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs">
                {value.firstName?.charAt(0) || value.email?.charAt(0) || "T"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">
                {getTeamLeadFullName(value)}
              </div>
              <div className="text-xs text-gray-500">{value.email}</div>
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-2 text-sm">
          {Object.entries(value).map(([key, val]) => (
            <div key={key} className="flex items-start">
              <span className="font-medium capitalize w-20 text-gray-700">
                {key}:
              </span>
              <span className="text-gray-900 flex-1">{val || "N/A"}</span>
            </div>
          ))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length > 0 && (value[0].email || value[0].firstName)) {
        return (
          <div className="space-y-2">
            {value.map((teamLead, index) => (
              <div
                key={teamLead._id || index}
                className="flex items-center gap-2 p-2 border rounded-lg"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                    {teamLead.firstName?.charAt(0) ||
                      teamLead.email?.charAt(0) ||
                      "T"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium text-sm">
                    {getTeamLeadFullName(teamLead)}
                  </div>
                  <div className="text-xs text-gray-500">{teamLead.email}</div>
                </div>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {item}
            </Badge>
          ))}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    }

    return <span className="text-gray-900">{value.toString()}</span>;
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

  const getEmployeeFullName = (employee) => {
    if (!employee) return "Unknown Employee";

    if (employee.firstName && employee.lastName) {
      return `${employee.firstName} ${employee.lastName}`;
    }

    if (employee.name) {
      return employee.name;
    }

    if (employee.email) {
      return employee.email.split("@")[0];
    }

    return "Unknown Employee";
  };
  // Updated function to get department info
  const getSubmissionDepartment = (submission) => {
    // Check if depId is populated with department object
    if (submission.formId?.depId?.name) {
      return {
        id: submission.formId.depId._id,
        name: submission.formId.depId.name,
        fullObject: submission.formId.depId,
      };
    }

    // If depId is just an ObjectId string
    if (submission.formId?.depId) {
      return {
        id: submission.formId.depId.toString(),
        name: submission.formId.depId.toString(),
        fullObject: null,
      };
    }

    // Fallback
    return {
      id: "unknown",
      name: "Unknown Department",
      fullObject: null,
    };
  };

  // For backward compatibility
  const getSubmissiondepId = (submission) => {
    const dept = getSubmissionDepartment(submission);
    return dept.name;
  };
  const renderEditFormField = (fieldConfig, fieldName, fieldValue) => {
    if (!fieldConfig) {
      return (
        <Input
          value={fieldValue || ""}
          onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
          className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
        />
      );
    }

    switch (fieldConfig.type) {
      case "text":
      case "email":
      case "number":
      case "tel":
      case "url":
        return (
          <Input
            type={fieldConfig.type}
            value={fieldValue || ""}
            onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
            placeholder={
              fieldConfig.placeholder ||
              `Enter ${fieldConfig.label.toLowerCase()}`
            }
            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
          />
        );
      case "password":
        return (
          <div className="relative">
            <Input
              type={showPasswords[fieldName] ? "text" : "password"}
              value={fieldValue || ""}
              onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
              placeholder={
                fieldConfig.placeholder ||
                `Enter ${fieldConfig.label.toLowerCase()}`
              }
              className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pr-10"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(fieldName)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPasswords[fieldName] ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        );
      case "textarea":
        return (
          <Textarea
            value={fieldValue || ""}
            onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
            placeholder={
              fieldConfig.placeholder ||
              `Enter ${fieldConfig.label.toLowerCase()}`
            }
            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 min-h-[100px] resize-vertical"
            rows={4}
          />
        );
      case "select":
        return (
          <Select
            value={fieldValue || ""}
            onValueChange={(value) => handleEditFieldChange(fieldName, value)}
          >
            <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
              <SelectValue
                placeholder={
                  fieldConfig.placeholder ||
                  `Select ${fieldConfig.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options?.map((option, index) => (
                <SelectItem key={index} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "date":
        return (
          <Input
            type="date"
            value={fieldValue || ""}
            onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
          />
        );
      case "checkbox":
        return (
          <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg bg-white">
            <input
              type="checkbox"
              checked={!!fieldValue}
              onChange={(e) =>
                handleEditFieldChange(fieldName, e.target.checked)
              }
              className="rounded border-gray-300 bg-white w-5 h-5 text-blue-600 focus:ring-blue-500"
            />
            <Label className="text-gray-700 font-medium">
              {fieldConfig.label}
            </Label>
          </div>
        );
      case "radio":
        return (
          <div className="space-y-3">
            {fieldConfig.options?.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-3 p-2">
                <input
                  type="radio"
                  name={fieldName}
                  value={option}
                  checked={fieldValue === option}
                  onChange={(e) =>
                    handleEditFieldChange(fieldName, e.target.value)
                  }
                  className="rounded-full border-gray-300 bg-white w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <Label className="text-gray-700">{option}</Label>
              </div>
            ))}
          </div>
        );
      case "file":
        return (
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white cursor-pointer hover:border-blue-400 transition-all duration-200 group"
            onClick={() => handleFileUploadClick(fieldName)}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
            <p className="text-sm text-gray-600 group-hover:text-gray-700">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {fieldConfig.accept || "Any file type"}
            </p>
            <Input
              ref={(el) => (fileInputRefs.current[fieldName] = el)}
              type="file"
              onChange={(e) => handleFileChange(fieldName, e)}
              className="hidden"
              accept={fieldConfig.accept}
            />
            {fieldValue && (
              <p className="text-sm text-green-600 mt-2 font-medium">
                {fieldValue.name || "File selected"}
              </p>
            )}
          </div>
        );
      default:
        return (
          <Input
            value={fieldValue || ""}
            onChange={(e) => handleEditFieldChange(fieldName, e.target.value)}
            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
          />
        );
    }
  };

  const renderTeamInformationCell = (submission) => {
    const claimStatus = getClaimStatus(submission);
    const StatusIcon = claimStatus.icon;
    const dept = getSubmissionDepartment(submission);

    return (
      <TableCell className="py-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
           
          </div>

          <div className="flex items-center gap-2">
            <StatusIcon className="w-4 h-4" />
            <Badge className={`${claimStatus.color} border text-xs px-2 py-1`}>
              {claimStatus.message}
            </Badge>
          </div>

          {isTaskClaimed(submission) && submission.assignedTo && (
            <div className="flex items-center gap-2 bg-purple-50 p-2 rounded-lg border border-purple-200">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {getTeamLeadFullName(submission.assignedTo)}
                </div>
                <div className="text-xs text-gray-500">
                  Claimed on {formatDate(submission.claimedAt)}
                </div>
              </div>
            </div>
          )}

          {!isTaskClaimed(submission) &&
            submission.multipleTeamLeadAssigned &&
            submission.multipleTeamLeadAssigned.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs text-gray-600 font-medium">
                  Available for:
                </div>
                <div className="flex flex-wrap gap-1">
                  {submission.multipleTeamLeadAssigned
                    .slice(0, 3)
                    .map((teamLead, idx) => (
                      <Badge
                        key={teamLead._id || idx}
                        variant="outline"
                        className="text-xs text-gray-700"
                      >
                        {teamLead.firstName?.charAt(0) ||
                          teamLead.email?.charAt(0) ||
                          "T"}
                      </Badge>
                    ))}
                  {submission.multipleTeamLeadAssigned.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="text-xs text-gray-700"
                    >
                      +{submission.multipleTeamLeadAssigned.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

          {!isTaskClaimed(submission) &&
            submission.assignedTo &&
            (!submission.multipleTeamLeadAssigned ||
              submission.multipleTeamLeadAssigned.length === 0) && (
              <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-lg border border-blue-200">
                <User className="w-4 h-4 text-blue-600" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {getTeamLeadFullName(submission.assignedTo)}
                  </div>
                  <div className="text-xs text-gray-500">Directly assigned</div>
                </div>
              </div>
            )}

          {submission.assignedEmployees &&
            submission.assignedEmployees.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-700">
                  {submission.assignedEmployees.length} employee
                  {submission.assignedEmployees.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
        </div>
      </TableCell>
    );
  };

  const renderTeamLeadSection = (submission) => {
    const claimStatus = getClaimStatus(submission);
    const StatusIcon = claimStatus.icon;

    return (
      <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-2xl p-6 border border-purple-100 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Team Lead Assignment
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center gap-2">
              <StatusIcon className="w-4 h-4" />
              <span className="font-medium text-gray-900">Status:</span>
            </div>
            <Badge className={`${claimStatus.color} border`}>
              {claimStatus.message}
            </Badge>
          </div>

          {isTaskClaimed(submission) && submission.assignedTo && (
            <div className="bg-white rounded-lg border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-orange-900" />
                  <span className="font-medium text-gray-900">Claimed By:</span>
                </div>
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Claimed
                </Badge>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <Avatar className="h-10 w-10 ring-2 ring-yellow-200">
                  <AvatarFallback className="bg-yellow-100 text-yellow-600 font-semibold">
                    {submission.assignedTo.firstName?.charAt(0) ||
                      submission.assignedTo.email?.charAt(0) ||
                      "T"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">
                    {getTeamLeadFullName(submission.assignedTo)}
                  </div>
                  <div className="text-sm text-gray-600 truncate">
                    {submission.assignedTo.email}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <Clock className="w-3 h-3 inline mr-1" />
                    Claimed on {formatDate(submission.claimedAt)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {submission.multipleTeamLeadAssigned &&
            submission.multipleTeamLeadAssigned.length > 0 && (
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-900">
                      Available for {submission.multipleTeamLeadAssigned.length}{" "}
                      Team Leads
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-green-700 border-green-300"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Multiple
                  </Badge>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {submission.multipleTeamLeadAssigned.map((teamLead) => (
                    <div
                      key={teamLead._id}
                      className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors ${
                        isTaskClaimed(submission) &&
                        submission.assignedTo?._id === teamLead._id
                          ? "border-yellow-300 bg-yellow-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback
                            className={`text-xs ${
                              isTaskClaimed(submission) &&
                              submission.assignedTo?._id === teamLead._id
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-green-100 text-green-600"
                            }`}
                          >
                            {teamLead.firstName?.charAt(0) ||
                              teamLead.email?.charAt(0) ||
                              "T"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {getTeamLeadFullName(teamLead)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {teamLead.email}
                          </div>
                        </div>
                      </div>
                      {isTaskClaimed(submission) &&
                        submission.assignedTo?._id === teamLead._id && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2 whitespace-nowrap">
                            <Crown className="w-3 h-3 mr-1" />
                            Claimed
                          </Badge>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          {!isTaskClaimed(submission) &&
            submission.assignedTo &&
            (!submission.multipleTeamLeadAssigned ||
              submission.multipleTeamLeadAssigned.length === 0) && (
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-gray-900">
                      Directly Assigned To:
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-blue-700 border-blue-300"
                  >
                    <Target className="w-3 h-3 mr-1" />
                    Single
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-blue-200">
                    <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                      {submission.assignedTo.firstName?.charAt(0) ||
                        submission.assignedTo.email?.charAt(0) ||
                        "T"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate">
                      {getTeamLeadFullName(submission.assignedTo)}
                    </div>
                    <div className="text-sm text-gray-600 truncate">
                      {submission.assignedTo.email}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <UserCheck className="w-3 h-3 inline mr-1" />
                      Direct assignment
                    </div>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    );
  };

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.formId?.title
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.assignedTo?.email
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSubmissionDepartment(submission)
        .name.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (submission.multipleTeamLeadAssigned &&
        submission.multipleTeamLeadAssigned.some(
          (tl) =>
            tl.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tl.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tl.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
        ));

    const matchesStatus =
      statusFilter === "all" || submission.status === statusFilter;

    const matchesdepId =
      depIdFilter === "all" ||
      getSubmissionDepartment(submission).name === depIdFilter;

    return matchesSearch && matchesStatus && matchesdepId;
  });

  // Update the depIds extraction
  const depIds = [
    ...new Set(
      submissions.map((sub) => {
        const dept = getSubmissionDepartment(sub);
        return dept.name;
      })
    ),
  ].filter(Boolean);

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

  const statusStats = {
    total: submissions.length,
    approved: submissions.filter((s) => s.status === "approved").length,
    pending: submissions.filter((s) => s.status === "pending").length,
    in_progress: submissions.filter((s) => s.status === "in_progress").length,
    rejected: submissions.filter((s) => s.status === "rejected").length,
    completed: submissions.filter((s) => s.status === "completed").length,
  };

  const claimStats = {
    claimed: submissions.filter((s) => isTaskClaimed(s)).length,
    available: submissions.filter(
      (s) =>
        s.multipleTeamLeadAssigned &&
        s.multipleTeamLeadAssigned.length > 0 &&
        !isTaskClaimed(s)
    ).length,
    single: submissions.filter(
      (s) =>
        s.assignedTo &&
        (!s.multipleTeamLeadAssigned || s.multipleTeamLeadAssigned.length === 0)
    ).length,
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4 p-8 bg-white rounded-2xl shadow-lg border border-blue-100">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
            <div className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping"></div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Loading Dashboard
            </h3>
            <p className="text-gray-600">Preparing your submissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 lg:p-6">
      <Toaster position="top-right" richColors />

      <Button
        onClick={() => router.push("/manager/forms")}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-full p-5 shadow-2xl shadow-blue-500/30 hover:shadow-blue-600/40 transition-all duration-300 transform hover:scale-110 z-50 group"
        size="lg"
      >
        <FileText className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
        Add Form
        <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:opacity-10 transition-opacity"></div>
      </Button>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-white rounded-2xl shadow-lg border border-blue-100">
                <FolderOpen className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  My Submissions
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Track and manage your form submissions
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <Button
              onClick={fetchSubmissions}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
              disabled={fetching}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${fetching ? "animate-spin" : ""}`}
              />
              {fetching ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-8 gap-4 mb-8">
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 col-span-2">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {statusStats.total}
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Total Submissions
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {claimStats.claimed}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Crown className="w-4 h-4" />
                Claimed
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {claimStats.available}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Users className="w-4 h-4" />
                Available
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {claimStats.single}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <User className="w-4 h-4" />
                Single
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {statusStats.approved}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Approved
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {statusStats.in_progress}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <Clock className="w-4 h-4" />
                In Progress
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {statusStats.pending}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Pending
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {statusStats.rejected}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <XCircle className="w-4 h-4" />
                Rejected
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <ClipboardCheck className="w-7 h-7 text-blue-600" />
                  Submission Management
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {filteredSubmissions.length} submission
                  {filteredSubmissions.length !== 1 ? "s" : ""} found •
                  <span className="ml-2 text-green-600 font-medium">
                    {claimStats.available} available for claiming
                  </span>
                </CardDescription>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    placeholder="Search submissions..."
                    className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11 text-base text-gray-900 bg-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={depIdFilter} onValueChange={setdepIdFilter}>
                  <SelectTrigger className="w-full sm:w-48 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white">
                    <Building className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter depId" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    <SelectItem value="all">All Departments</SelectItem>
                    {depIds.map((deptName) => (
                      <SelectItem key={deptName} value={deptName}>
                        {deptName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex flex-col items-center gap-4 text-gray-600">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  <span className="text-lg">Loading submissions...</span>
                </div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <FileText className="w-24 h-24 mx-auto opacity-50" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {submissions.length === 0
                    ? "No submissions yet"
                    : "No matches found"}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                  {submissions.length === 0
                    ? "Your form submissions will appear here once you create and submit forms."
                    : "Try adjusting your search terms or filters to find what you're looking for."}
                </p>
                {submissions.length === 0 && (
                  <Button
                    onClick={() => router.push("/manager/forms")}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Create Your First Form
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent border-b border-gray-200">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">
                        Form Details
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">
                        Team Assignment
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">
                        Status Hierarchy
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">
                        Quick Actions
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubmissions.map((submission) => (
                      <TableRow
                        key={submission._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-5">
                          <div className="flex items-center gap-4">
                            <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-600/30 transition-all duration-300 size-12">
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-sm">
                                <FileText className="w-5 h-5" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200 truncate">
                                {submission.formId?.title || "Untitled Form"}
                              </div>
                              <div className="text-sm text-gray-600 line-clamp-2">
                                {submission.formId?.description ||
                                  "No description provided"}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {formatDate(submission.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>

                        {renderTeamInformationCell(submission)}

                        <TableCell className="py-5">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-blue-600" />
                              <Badge
                                className={`${getStatusVariant(
                                  submission.status
                                )} border flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors`}
                              >
                                {getStatusIcon(submission.status)}
                                Manager: {submission.status.replace("_", " ")}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-green-600" />
                              <Badge
                                className={`${getStatusVariant(
                                  submission.status2
                                )} border flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors`}
                              >
                                {getStatusIcon(submission.status2)}
                                Team Lead:{" "}
                                {submission.status2.replace("_", " ")}
                              </Badge>
                            </div>
                            {submission.assignedEmployees?.map((emp, index) => (
                              <div
                                key={emp.employeeId?._id || index}
                                className="flex items-center gap-2"
                              >
                                <Users className="w-4 h-4 text-purple-600" />
                                <Badge
                                  className={`${getStatusVariant(
                                    emp.status
                                  )} border flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors`}
                                >
                                  {getStatusIcon(emp.status)}
                                  {getEmployeeFullName(emp.employeeId)}:{" "}
                                  {emp.status.replace("_", " ")}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>

                        <TableCell className="py-5">
                          <div className="flex flex-col gap-2">
                            {canManagerUpdateStatus(submission) ? (
                              <>
                                <Button
                                  onClick={() =>
                                    handleQuickStatusUpdate(
                                      submission._id,
                                      "approved"
                                    )
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 hover:text-green-800 transition-all duration-200"
                                  disabled={loading}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  onClick={() =>
                                    handleQuickStatusUpdate(
                                      submission._id,
                                      "rejected"
                                    )
                                  }
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 text-xs border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 transition-all duration-200"
                                  disabled={loading}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 rounded px-3 py-2 text-center">
                                <Clock className="w-3 h-3 inline mr-1" />
                                Wait for Team Lead
                              </div>
                            )}
                            <Button
                              onClick={() =>
                                handleQuickStatusUpdate(
                                  submission._id,
                                  "in_progress"
                                )
                              }
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200"
                              disabled={loading}
                            >
                              <Clock className="w-3 h-3 mr-1" />
                              In Progress
                            </Button>
                            {isTaskClaimed(submission) && (
                              <div className="text-xs text-purple-600 bg-purple-50 border border-purple-200 rounded px-3 py-2 text-center">
                                <Crown className="w-3 h-3 inline mr-1" />
                                Task Claimed
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="py-5">
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => viewSubmissionDetails(submission)}
                              variant="outline"
                              size="sm"
                              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-800 transition-all duration-200 justify-start"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                            <Button
                              onClick={() =>
                                router.push(
                                  `/manager/submissions/${submission._id}`
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 hover:text-green-800 transition-all duration-200 justify-start"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              onClick={() =>
                                router.push(
                                  `/group-chat?submissionId=${submission._id}`
                                )
                              }
                              variant="outline"
                              size="sm"
                              className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-800 transition-all duration-200 justify-start"
                            >
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Group Chat
                            </Button>
                            <Button
                              onClick={() =>
                                handleDeleteSubmission(submission._id)
                              }
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 hover:text-red-800 transition-all duration-200 justify-start"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {showDetails && selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
            <Card className="w-full max-w-6xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl flex flex-col animate-in fade-in-90 zoom-in-95">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-2xl">
                        {selectedSubmission.formId?.title ||
                          "Submission Details"}
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        {getSubmissiondepId(selectedSubmission)} •{" "}
                        {formatDate(selectedSubmission.createdAt)}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedSubmission(null);
                    }}
                    className="h-9 w-9 text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 overflow-y-auto flex-1 custom-scrollbar">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-blue-600" />
                        Submission Information
                      </h3>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                          <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                            <Label className="text-gray-600 font-medium text-sm">
                              Assigned To
                            </Label>
                            <div className="mt-2 space-y-2">
                              {selectedSubmission.assignedTo && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-900 font-semibold text-sm">
                                    Team Lead:
                                  </span>
                                  <span className="text-purple-700 font-semibold">
                                    {getTeamLeadFullName(
                                      selectedSubmission.assignedTo
                                    )}
                                  </span>
                                </div>
                              )}
                              {selectedSubmission.multipleTeamLeadAssigned &&
                                selectedSubmission.multipleTeamLeadAssigned
                                  .length > 0 && (
                                  <div className="text-sm text-gray-600">
                                    {
                                      selectedSubmission
                                        .multipleTeamLeadAssigned.length
                                    }{" "}
                                    team leads assigned
                                  </div>
                                )}
                            </div>
                          </div>

                          <div>
                            <Label className="text-gray-700 font-medium text-sm">
                              Submission Date
                            </Label>
                            <p className="text-gray-900 font-semibold mt-1">
                              {formatDate(selectedSubmission.createdAt)}
                            </p>
                          </div>

                          {selectedSubmission.completedAt && (
                            <div>
                              <Label className="text-gray-700 font-medium text-sm">
                                Completed Date
                              </Label>
                              <p className="text-gray-900 font-semibold mt-1">
                                {formatDate(selectedSubmission.completedAt)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-md">
                      <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-green-600" />
                        Status Hierarchy
                      </h3>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 transition">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <span className="text-gray-800 font-medium text-sm">
                              Manager
                            </span>
                          </div>

                          <Badge
                            className={`${getStatusVariant(
                              selectedSubmission.status
                            )} border text-sm flex items-center gap-1 px-3 py-1 font-medium`}
                          >
                            {getStatusIcon(selectedSubmission.status)}
                            {selectedSubmission.status.replace("_", " ")}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl border border-green-200 bg-green-50/70 hover:bg-green-100 transition">
                          <div className="flex items-center gap-3">
                            <User className="w-5 h-5 text-green-600" />
                            <span className="text-gray-800 font-medium text-sm">
                              Team Lead
                            </span>
                          </div>

                          <Badge
                            className={`${getStatusVariant(
                              selectedSubmission.status2
                            )} border text-sm flex items-center gap-1 px-3 py-1 font-medium`}
                          >
                            {getStatusIcon(selectedSubmission.status2)}
                            {selectedSubmission.status2.replace("_", " ")}
                          </Badge>
                        </div>

                        {selectedSubmission.assignedEmployees?.map(
                          (emp, index) => (
                            <div
                              key={emp.employeeId?._id || index}
                              className="flex items-center justify-between p-4 rounded-xl border border-purple-200 bg-purple-50/70 hover:bg-purple-100 transition"
                            >
                              <div className="flex items-center gap-3">
                                <Users className="w-5 h-5 text-purple-600" />

                                <div className="flex flex-col">
                                  <span className="text-gray-800 font-medium text-sm">
                                    Employee
                                  </span>

                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-gray-600 text-xs font-medium">
                                      {getEmployeeFullName(emp.employeeId)}
                                    </span>

                                    <Badge className="bg-green-700 text-white px-2 py-0.5 rounded-md text-[10px]">
                                      {emp.email}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <Badge
                                className={`${getStatusVariant(
                                  emp.status
                                )} border text-sm flex items-center gap-1 px-3 py-1 font-medium`}
                              >
                                {getStatusIcon(emp.status)}
                                {emp.status.replace("_", " ")}
                              </Badge>
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    {renderTeamLeadSection(selectedSubmission)}

                    <div className="space-y-4">
                      {selectedSubmission.teamLeadFeedback && (
                        <div className="bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
                          <Label className="text-gray-700 font-medium text-sm">
                            Team Lead Feedback
                          </Label>
                          <p className="text-gray-900 mt-2 bg-white p-3 rounded-lg border border-yellow-100">
                            {selectedSubmission.teamLeadFeedback}
                          </p>
                        </div>
                      )}

                      {selectedSubmission.managerComments && (
                        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
                          <Label className="text-gray-700 font-medium text-sm">
                            Your Comments
                          </Label>
                          <p className="text-gray-900 mt-2 bg-white p-3 rounded-lg border border-blue-100">
                            {selectedSubmission.managerComments}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Form Data
                      </h3>

                      <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedSubmission.formData &&
                          Object.entries(selectedSubmission.formData).map(
                            ([key, value]) => {
                              const fieldConfig =
                                selectedSubmission.formId?.fields?.find(
                                  (f) => f.name === key
                                );
                              const IconComponent = fieldConfig
                                ? getFieldIcon(fieldConfig.type)
                                : FileText;

                              return (
                                <div
                                  key={key}
                                  className="border border-gray-200 rounded-xl p-4 bg-white hover:border-gray-300 transition-colors duration-200"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                                      <IconComponent className="w-4 h-4" />
                                    </div>
                                    <Label className="text-gray-800 font-semibold capitalize text-sm">
                                      {key.replace(/([A-Z])/g, " $1").trim()}
                                    </Label>
                                  </div>
                                  <div className="text-gray-900">
                                    {formatFieldValue(value)}
                                  </div>
                                </div>
                              );
                            }
                          )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 border border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Edit className="w-5 h-5 text-blue-600" />
                        Update Status
                      </h3>
                      {!canManagerUpdateStatus(selectedSubmission) && (
                        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 text-yellow-800">
                            <AlertCircle className="w-4 h-4" />
                            <span className="font-medium">
                              Waiting for Team Lead approval
                            </span>
                          </div>
                          <p className="text-yellow-700 text-sm mt-1">
                            You can only set status to "In Progress" until the
                            Team Lead approves this submission.
                          </p>
                        </div>
                      )}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleStatusUpdate(
                            selectedSubmission._id,
                            statusUpdate.status,
                            statusUpdate.managerComments
                          );
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 gap-4">
                          <div className="space-y-3">
                            <Label
                              htmlFor="status"
                              className="text-gray-800 font-semibold"
                            >
                              Status *
                            </Label>
                            <Select
                              value={statusUpdate.status}
                              onValueChange={(value) =>
                                setStatusUpdate((prev) => ({
                                  ...prev,
                                  status: value,
                                }))
                              }
                              disabled={
                                !canManagerUpdateStatus(selectedSubmission) &&
                                statusUpdate.status !== "in_progress"
                              }
                            >
                              <SelectTrigger className="w-full focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 bg-white">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent className="bg-white text-black">
                                {canManagerUpdateStatus(selectedSubmission) ? (
                                  <>
                                    <SelectItem value="approved">
                                      Approved
                                    </SelectItem>
                                    <SelectItem value="rejected">
                                      Rejected
                                    </SelectItem>
                                    <SelectItem value="in_progress">
                                      In Progress
                                    </SelectItem>
                                    <SelectItem value="pending">
                                      Pending
                                    </SelectItem>
                                    <SelectItem value="completed">
                                      Completed
                                    </SelectItem>
                                  </>
                                ) : (
                                  <SelectItem value="in_progress">
                                    In Progress
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            {!canManagerUpdateStatus(selectedSubmission) && (
                              <p className="text-xs text-yellow-600">
                                Only "In Progress" available until Team Lead
                                approves
                              </p>
                            )}
                          </div>

                          <div className="space-y-3">
                            <Label
                              htmlFor="managerComments"
                              className="text-gray-800 font-semibold"
                            >
                              Your Comments
                            </Label>
                            <Textarea
                              value={statusUpdate.managerComments}
                              onChange={(e) =>
                                setStatusUpdate((prev) => ({
                                  ...prev,
                                  managerComments: e.target.value,
                                }))
                              }
                              placeholder="Add your comments or feedback..."
                              className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 min-h-[100px] resize-vertical bg-white"
                              rows={4}
                            />
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            type="submit"
                            disabled={
                              loading ||
                              (!canManagerUpdateStatus(selectedSubmission) &&
                                statusUpdate.status !== "in_progress")
                            }
                            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-2.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              "Update Status"
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setShowDetails(false);
                              setSelectedSubmission(null);
                            }}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-2.5 transition-all duration-200 shadow-sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {showEditForm && editingSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-4xl max-h-[95vh] overflow-hidden bg-white border-0 shadow-2xl flex flex-col animate-in fade-in-90 zoom-in-95">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-700 text-white flex-shrink-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Edit className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-white text-2xl">
                        Edit Submission
                      </CardTitle>
                      <CardDescription className="text-green-100">
                        Update form data and comments
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowEditForm(false);
                      setEditingSubmission(null);
                    }}
                    className="h-9 w-9 text-white hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6 overflow-y-auto flex-1 custom-scrollbar">
                <form onSubmit={handleEditSubmission} className="space-y-6">
                  <div className="grid grid-cols-1 gap-8">
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        Form Data
                      </h3>

                      <div className="space-y-4 max-h-96 overflow-y-auto p-4 border border-gray-200 rounded-xl bg-gray-50/50 pr-2 custom-scrollbar">
                        {editingSubmission.formData &&
                          Object.entries(editingSubmission.formData).map(
                            ([fieldName, fieldValue]) => {
                              const fieldConfig =
                                editingSubmission.formId?.fields?.find(
                                  (f) => f.name === fieldName
                                );
                              const IconComponent = fieldConfig
                                ? getFieldIcon(fieldConfig.type)
                                : FileText;

                              return (
                                <div
                                  key={fieldName}
                                  className="space-y-3 p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-colors duration-200"
                                >
                                  <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                      <IconComponent className="w-4 h-4" />
                                    </div>
                                    <Label className="text-gray-800 font-semibold text-base capitalize">
                                      {fieldName
                                        .replace(/([A-Z])/g, " $1")
                                        .trim()}
                                      {fieldConfig?.required && (
                                        <span className="text-red-500 ml-1">
                                          *
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                  {renderEditFormField(
                                    fieldConfig,
                                    fieldName,
                                    fieldValue
                                  )}
                                  {fieldConfig?.placeholder && (
                                    <p className="text-xs text-gray-500 mt-2">
                                      {fieldConfig.placeholder}
                                    </p>
                                  )}
                                </div>
                              );
                            }
                          )}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-green-600" />
                        Manager Comments
                      </h3>

                      <div className="space-y-4">
                        <div className="space-y-3">
                          <Label
                            htmlFor="managerComments"
                            className="text-gray-800 font-semibold"
                          >
                            Your Comments
                          </Label>
                          <Textarea
                            value={editingSubmission.managerComments || ""}
                            onChange={(e) =>
                              setEditingSubmission((prev) => ({
                                ...prev,
                                managerComments: e.target.value,
                              }))
                            }
                            placeholder="Add your comments, feedback, or notes about this submission..."
                            className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 min-h-[120px] resize-vertical bg-white"
                            rows={6}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t border-gray-200">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-8 py-2.5 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Update Submission
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingSubmission(null);
                      }}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-2.5 transition-all duration-200 shadow-sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
