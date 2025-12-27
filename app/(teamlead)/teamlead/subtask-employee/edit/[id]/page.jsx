"use client";
import React, { useState, useEffect, useMemo } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Save,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Loader2,
  AlertCircle,
  Users,
  UserRound,
  Phone,
  Target,
  Eye,
  Pencil,
  CheckCircle,
  XCircle,
  Building,
  UserCog,
} from "lucide-react";
import axios from "axios";
import { format } from "date-fns";

export default function EditSubtaskPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const subtaskId = params.id;

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fetchingEmployees, setFetchingEmployees] = useState(true);
  const [fetchingManagers, setFetchingManagers] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [subtask, setSubtask] = useState(null);
  const [originalSubtask, setOriginalSubtask] = useState(null);
  const [activeTab, setActiveTab] = useState("employees"); // "employees" or "managers"

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    priority: "medium",
    totalLeadsRequired: "1", // Updated field name
  });

  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);

  // Check if current team lead has the specific depId
  const shouldShowLeadsField = useMemo(() => {
    if (!session?.user?.depId) return false;
    return session.user.depId === "694161a12ab0b6a3ab0e0788";
  }, [session]);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "TeamLead") {
      router.push("/teamleadlogin");
      return;
    }

    fetchSubtask();
    fetchEmployees();
    fetchManagers();
  }, [session, status, router]);

  const fetchSubtask = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/teamlead/subtasks/${subtaskId}`);

      if (response.status === 200) {
        const subtaskData = response.data.subtask;
        setSubtask(subtaskData);
        setOriginalSubtask(subtaskData);

        // Format dates for input fields
        const formattedStartDate = format(
          new Date(subtaskData.startDate),
          "yyyy-MM-dd"
        );
        const formattedEndDate = format(
          new Date(subtaskData.endDate),
          "yyyy-MM-dd"
        );
        const formattedStartTime = subtaskData.startTime
          ? subtaskData.startTime.substring(0, 5)
          : "09:00";
        const formattedEndTime = subtaskData.endTime
          ? subtaskData.endTime.substring(0, 5)
          : "17:00";

        // Use lead field for totalLeadsRequired only if leads field should be shown
        let totalLeadsRequired = "1";
        if (shouldShowLeadsField) {
          totalLeadsRequired =
            subtaskData.totalLeadsRequired?.toString() ||
            subtaskData.lead ||
            "1";
        }

        setFormData({
          title: subtaskData.title || "",
          description: subtaskData.description || "",
          startDate: formattedStartDate,
          endDate: formattedEndDate,
          startTime: formattedStartTime,
          endTime: formattedEndTime,
          priority: subtaskData.priority || "medium",
          totalLeadsRequired: totalLeadsRequired,
        });

        // Set already assigned employees
        if (subtaskData.assignedEmployees) {
          const employeeAssignments = subtaskData.assignedEmployees.map(
            (emp) => ({
              employeeId:
                emp.employeeId?._id?.toString() || emp.employeeId.toString(),
              email: emp.email || "",
              name:
                emp.name ||
                `${emp.employeeId?.firstName || ""} ${
                  emp.employeeId?.lastName || ""
                }`.trim(),
            })
          );
          setSelectedEmployees(employeeAssignments);
        }

        // Set already assigned managers
        if (subtaskData.assignedManagers) {
          const managerAssignments = subtaskData.assignedManagers.map(
            (mgr) => ({
              managerId:
                mgr.managerId?._id?.toString() || mgr.managerId.toString(),
              email: mgr.email || "",
              name:
                mgr.name ||
                `${mgr.managerId?.firstName || ""} ${
                  mgr.managerId?.lastName || ""
                }`.trim(),
            })
          );
          setSelectedManagers(managerAssignments);
        }
      }
    } catch (error) {
      console.error("Error fetching subtask:", error);
      toast.error("Failed to load subtask details");
      router.push("/teamlead/subtasks");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const response = await axios.get("/api/teamlead/employees");

      if (response.status === 200) {
        setEmployees(response.data.employees || response.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setFetchingEmployees(false);
    }
  };

  const fetchManagers = async () => {
    try {
      setFetchingManagers(true);
      const response = await axios.get("/api/teamlead/managers");

      if (response.status === 200) {
        setManagers(response.data.managers || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to load managers");
    } finally {
      setFetchingManagers(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEmployeeSelect = (employeeId) => {
    if (
      employeeId &&
      !selectedEmployees.find((emp) => emp.employeeId === employeeId)
    ) {
      const employee = employees.find((emp) => emp._id === employeeId);
      if (employee) {
        setSelectedEmployees([
          ...selectedEmployees,
          {
            employeeId,
            email: employee.email,
            name: `${employee.firstName} ${employee.lastName}`.trim(),
          },
        ]);
      }
    }
  };

  const handleManagerSelect = (managerId) => {
    if (
      managerId &&
      !selectedManagers.find((mgr) => mgr.managerId === managerId)
    ) {
      const manager = managers.find((mgr) => mgr._id === managerId);
      if (manager) {
        setSelectedManagers([
          ...selectedManagers,
          {
            managerId,
            email: manager.email,
            name: `${manager.firstName} ${manager.lastName}`.trim(),
          },
        ]);
      }
    }
  };

  const removeEmployee = (employeeId) => {
    setSelectedEmployees(
      selectedEmployees.filter((emp) => emp.employeeId !== employeeId)
    );
  };

  const removeManager = (managerId) => {
    setSelectedManagers(
      selectedManagers.filter((mgr) => mgr.managerId !== managerId)
    );
  };

  const getEmployeeDetails = (employeeId) => {
    return employees.find((emp) => emp._id === employeeId);
  };

  const getManagerDetails = (managerId) => {
    return managers.find((mgr) => mgr._id === managerId);
  };

  const getEmployeeProgress = (employeeId) => {
    if (!subtask?.assignedEmployees)
      return { completed: 0, assigned: 0, status: "pending" };

    const assignment = subtask.assignedEmployees.find((emp) => {
      const empId =
        emp.employeeId?._id?.toString() || emp.employeeId.toString();
      return empId === employeeId;
    });

    return {
      completed: assignment?.leadsCompleted || 0,
      assigned: assignment?.leadsAssigned || 0,
      status: assignment?.status || "pending",
    };
  };

  const getManagerProgress = (managerId) => {
    if (!subtask?.assignedManagers)
      return { completed: 0, assigned: 0, status: "pending" };

    const assignment = subtask.assignedManagers.find((mgr) => {
      const mgrId = mgr.managerId?._id?.toString() || mgr.managerId.toString();
      return mgrId === managerId;
    });

    return {
      completed: assignment?.leadsCompleted || 0,
      assigned: assignment?.leadsAssigned || 0,
      status: assignment?.status || "pending",
    };
  };

  const hasChanges = () => {
    if (!originalSubtask) return false;

    // Compare original with current form data
    const originalLeads =
      originalSubtask.totalLeadsRequired?.toString() ||
      originalSubtask.lead ||
      "1";

    // Get original employee assignments
    const originalEmployeeAssignments =
      originalSubtask.assignedEmployees?.map((emp) => ({
        employeeId:
          emp.employeeId?._id?.toString() || emp.employeeId.toString(),
        email: emp.email || "",
        name: emp.name || "",
      })) || [];

    // Get original manager assignments
    const originalManagerAssignments =
      originalSubtask.assignedManagers?.map((mgr) => ({
        managerId: mgr.managerId?._id?.toString() || mgr.managerId.toString(),
        email: mgr.email || "",
        name: mgr.name || "",
      })) || [];

    // Check if leads changed (only if leads field should be shown)
    if (shouldShowLeadsField && formData.totalLeadsRequired !== originalLeads)
      return true;

    // Check if employees changed
    const currentEmployeeIds = selectedEmployees
      .map((emp) => emp.employeeId)
      .sort();
    const originalEmployeeIds = originalEmployeeAssignments
      .map((emp) => emp.employeeId)
      .sort();
    if (
      JSON.stringify(currentEmployeeIds) !== JSON.stringify(originalEmployeeIds)
    ) {
      return true;
    }

    // Check if managers changed
    const currentManagerIds = selectedManagers
      .map((mgr) => mgr.managerId)
      .sort();
    const originalManagerIds = originalManagerAssignments
      .map((mgr) => mgr.managerId)
      .sort();
    if (
      JSON.stringify(currentManagerIds) !== JSON.stringify(originalManagerIds)
    ) {
      return true;
    }

    // Check other fields
    const originalFormattedStartDate = format(
      new Date(originalSubtask.startDate),
      "yyyy-MM-dd"
    );
    const originalFormattedEndDate = format(
      new Date(originalSubtask.endDate),
      "yyyy-MM-dd"
    );
    const originalStartTime = originalSubtask.startTime
      ? originalSubtask.startTime.substring(0, 5)
      : "09:00";
    const originalEndTime = originalSubtask.endTime
      ? originalSubtask.endTime.substring(0, 5)
      : "17:00";

    const changedFields = [
      ["title", originalSubtask.title],
      ["description", originalSubtask.description],
      ["startDate", originalFormattedStartDate],
      ["endDate", originalFormattedEndDate],
      ["startTime", originalStartTime],
      ["endTime", originalEndTime],
      ["priority", originalSubtask.priority],
    ];

    for (const [field, originalValue] of changedFields) {
      if (formData[field] !== originalValue) return true;
    }

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) {
      toast.error("Please wait, submission in progress...");
      return;
    }

    // Basic validation
    if (!formData.title.trim()) {
      toast.error("Please enter subtask title");
      return;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter subtask description");
      return;
    }

    if (!formData.startDate) {
      toast.error("Please select start date");
      return;
    }

    if (!formData.endDate) {
      toast.error("Please select end date");
      return;
    }

    if (!formData.startTime) {
      toast.error("Please select start time");
      return;
    }

    if (!formData.endTime) {
      toast.error("Please select end time");
      return;
    }

    // Additional validation for leads field if visible
    if (shouldShowLeadsField) {
      if (!formData.totalLeadsRequired) {
        toast.error("Please enter number of leads required");
        return;
      }

      const leadsRequired = parseInt(formData.totalLeadsRequired);
      if (leadsRequired <= 0) {
        toast.error("Please enter a valid number of leads (greater than 0)");
        return;
      }
    }

    // Date validation
    const startDateTime = new Date(
      `${formData.startDate}T${formData.startTime}`
    );
    const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

    if (startDateTime >= endDateTime) {
      toast.error("End date/time must be after start date/time");
      return;
    }

    // At least one assignee validation
    if (selectedEmployees.length === 0 && selectedManagers.length === 0) {
      toast.error("Please select at least one employee or manager");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare data for API
      const subtaskData = {
        ...formData,
        teamLeadId: session.user.id,
        teamLeadName:
          session.user.name ||
          `${session.user.firstName} ${session.user.lastName}`,
        teamLeadDepId: session.user.depId,
        assignedEmployees: selectedEmployees,
        assignedManagers: selectedManagers,
        hasLeadsTarget: shouldShowLeadsField && formData.totalLeadsRequired > 0,
        totalLeadsRequired: shouldShowLeadsField
          ? parseInt(formData.totalLeadsRequired)
          : 0,
      };

      console.log("Updating subtask with data:", subtaskData);

      const response = await axios.put(
        `/api/teamlead/subtasks/${subtaskId}`,
        subtaskData
      );

      if (response.status === 200) {
        toast.success("Subtask updated successfully!");
        setTimeout(() => {
          router.push("/teamlead/subtasks");
        }, 1000);
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
      if (error.response?.status === 409) {
        toast.error("Subtask with this title already exists");
      } else {
        toast.error(error.response?.data?.error || "Failed to update subtask");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const response = await axios.delete(
        `/api/teamlead/subtasks/${subtaskId}`
      );

      if (response.status === 200) {
        toast.success("Subtask deleted successfully!");
        setTimeout(() => {
          router.push("/teamlead/subtasks");
        }, 1000);
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
      toast.error(error.response?.data?.error || "Failed to delete subtask");
      setIsDeleting(false);
    }
  };

  const leadsRequired = parseInt(formData.totalLeadsRequired) || 1;
  const totalAssignees = selectedEmployees.length + selectedManagers.length;
  const leadsPerAssignee =
    shouldShowLeadsField && totalAssignees > 0
      ? Math.ceil(leadsRequired / totalAssignees)
      : 0;

  const getEmployeeDisplayName = (employeeId) => {
    const employee = getEmployeeDetails(employeeId);
    if (!employee) {
      // Try to find in existing subtask assignments
      const existingAssignment = subtask?.assignedEmployees?.find((emp) => {
        const existingEmpId =
          emp.employeeId?._id?.toString() || emp.employeeId.toString();
        return existingEmpId === employeeId;
      });
      if (existingAssignment) {
        return existingAssignment.name || "Unknown Employee";
      }
      return "Unknown Employee";
    }
    return employee.name || `${employee.firstName} ${employee.lastName}`.trim();
  };

  const getManagerDisplayName = (managerId) => {
    const manager = getManagerDetails(managerId);
    if (!manager) {
      // Try to find in existing subtask assignments
      const existingAssignment = subtask?.assignedManagers?.find((mgr) => {
        const existingMgrId =
          mgr.managerId?._id?.toString() || mgr.managerId.toString();
        return existingMgrId === managerId;
      });
      if (existingAssignment) {
        return existingAssignment.name || "Unknown Manager";
      }
      return "Unknown Manager";
    }
    return manager.name || `${manager.firstName} ${manager.lastName}`.trim();
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-900">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You need to be logged in as TeamLead to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!subtask) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Subtask Not Found
          </h2>
          <Button onClick={() => router.push("/teamlead/subtasks")}>
            Go Back to Subtasks
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                Edit Subtask
              </h1>
              <p className="text-gray-800 mt-2">
                {shouldShowLeadsField
                  ? "Update subtask details and lead assignments"
                  : "Update subtask details"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {shouldShowLeadsField && (
              <Badge className="bg-green-100 text-green-800 border-green-200 mr-2">
                <Target className="w-3 h-3 mr-1" />
                Lead Tracking Enabled
              </Badge>
            )}

            <Button
              variant="outline"
              onClick={() =>
                router.push(`/teamlead/subtask-employee/view/${subtaskId}`)
              }
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Eye className="w-4 h-4 mr-2" />
              View
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader className="text-gray-900">
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the subtask and remove all associated data including
                    employee and manager assignments. All assigned users will be
                    notified.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel
                    disabled={isDeleting}
                    className="text-gray-900"
                  >
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Subtask"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  Edit Subtask
                </CardTitle>
                <CardDescription className="text-gray-700">
                  Update the details below
                </CardDescription>
              </div>
              {hasChanges() && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  <Pencil className="w-3 h-3 mr-1" />
                  Unsaved Changes
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-gray-800 font-semibold">
                  Title *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter subtask title"
                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-gray-800 font-semibold"
                >
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter detailed description of the subtask"
                  className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 min-h-[120px]"
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Leads Required Field - Only show for specific depId */}
              {shouldShowLeadsField && (
                <div className="space-y-2">
                  <Label
                    htmlFor="totalLeadsRequired"
                    className="text-gray-800 font-semibold"
                  >
                    Number of Leads Required *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="totalLeadsRequired"
                      type="number"
                      min="1"
                      max="10000"
                      value={formData.totalLeadsRequired}
                      onChange={(e) =>
                        handleInputChange("totalLeadsRequired", e.target.value)
                      }
                      placeholder="Enter total number of leads/calls/targets"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total leads target</span>
                    <span
                      className={`font-medium ${
                        leadsRequired > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {leadsRequired} lead{leadsRequired !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Current completion: {subtask.leadsCompleted || 0} /{" "}
                    {subtask.totalLeadsRequired || leadsRequired} leads
                  </p>
                </div>
              )}

              {/* Assignees Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-800 font-semibold">
                    Assign To *
                  </Label>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {totalAssignees} total assignee
                      {totalAssignees !== 1 ? "s" : ""}
                    </Badge>
                    {hasChanges() && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        Changes in assignment
                      </Badge>
                    )}
                  </div>
                </div>

                <Tabs
                  defaultValue="employees"
                  value={activeTab}
                  onValueChange={setActiveTab}
                >
                  <TabsList className="grid w-full grid-cols-2 bg-white p-1 rounded-xl shadow-sm">
                    <TabsTrigger
                      value="employees"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-600
               data-[state=active]:bg-indigo-600
               data-[state=active]:text-white
               data-[state=active]:shadow
               transition-all duration-200"
                    >
                      <Users className="w-4 h-4" />
                      Employees ({selectedEmployees.length})
                    </TabsTrigger>

                    <TabsTrigger
                      value="managers"
                      className="flex items-center justify-center gap-2 rounded-lg text-gray-600
               data-[state=active]:bg-rose-600
               data-[state=active]:text-white
               data-[state=active]:shadow
               transition-all duration-200"
                    >
                      <Building className="w-4 h-4" />
                      Managers ({selectedManagers.length})
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="employees" className="space-y-4 mt-4">
                    <Select
                      onValueChange={handleEmployeeSelect}
                      disabled={isSubmitting || employees.length === 0}
                    >
                      <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                        <SelectValue placeholder="Select employees to assign" />
                      </SelectTrigger>
                      <SelectContent className="text-black bg-white max-h-60">
                        {employees.map((employee) => (
                          <SelectItem
                            key={employee._id}
                            value={employee._id}
                            disabled={selectedEmployees.find(
                              (emp) => emp.employeeId === employee._id
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                  {employee.firstName?.[0]}
                                  {employee.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {employee.firstName} {employee.lastName}
                                <span className="text-gray-500 text-xs ml-2">
                                  ({employee.email})
                                </span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {employees.length === 0 && (
                          <div className="px-2 py-4 text-center text-gray-500 text-sm">
                            No employees available
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {selectedEmployees.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-800 font-semibold">
                          Selected Employees ({selectedEmployees.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedEmployees.map((emp) => {
                            const employeeName = getEmployeeDisplayName(
                              emp.employeeId
                            );
                            const progress = getEmployeeProgress(
                              emp.employeeId
                            );
                            const isExisting = subtask.assignedEmployees?.some(
                              (existingEmp) => {
                                const existingEmpId =
                                  existingEmp.employeeId?._id?.toString() ||
                                  existingEmp.employeeId.toString();
                                return existingEmpId === emp.employeeId;
                              }
                            );

                            return (
                              <div
                                key={emp.employeeId}
                                className={`flex items-center justify-between p-3 border rounded-lg ${
                                  isExisting
                                    ? "bg-green-50 border-green-200"
                                    : "bg-blue-50/50 border-blue-200"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback
                                      className={
                                        isExisting
                                          ? "bg-green-100 text-green-600"
                                          : "bg-blue-100 text-blue-600"
                                      }
                                    >
                                      {employeeName[0]}
                                      {employeeName.split(" ")[1]?.[0] || ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900">
                                        {employeeName}
                                      </p>
                                      {isExisting ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                          Currently assigned
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                                          New assignment
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <div className="text-xs text-gray-500">
                                        {emp.email}
                                      </div>
                                      {isExisting &&
                                        shouldShowLeadsField &&
                                        progress.completed > 0 && (
                                          <div className="flex items-center gap-1 text-xs">
                                            <span className="text-gray-600">
                                              Progress:
                                            </span>
                                            <span
                                              className={`font-medium ${
                                                progress.status === "completed"
                                                  ? "text-green-600"
                                                  : "text-blue-600"
                                              }`}
                                            >
                                              {progress.completed}/
                                              {progress.assigned}
                                            </span>
                                            <span
                                              className={`${
                                                progress.status === "completed"
                                                  ? "text-green-600"
                                                  : progress.status ===
                                                    "in_progress"
                                                  ? "text-blue-600"
                                                  : "text-yellow-600"
                                              }`}
                                            >
                                              ({progress.status})
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExisting &&
                                    progress.status !== "pending" && (
                                      <Badge
                                        className={`${
                                          progress.status === "completed"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-blue-100 text-blue-800"
                                        }`}
                                      >
                                        {progress.status === "completed" ? (
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                        ) : (
                                          <Clock className="w-3 h-3 mr-1" />
                                        )}
                                        {progress.status.replace("_", "-")}
                                      </Badge>
                                    )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeEmployee(emp.employeeId)
                                    }
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={isSubmitting}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="managers" className="space-y-4 mt-4">
                    <Select
                      onValueChange={handleManagerSelect}
                      disabled={isSubmitting || managers.length === 0}
                    >
                      <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                        <SelectValue placeholder="Select managers to assign" />
                      </SelectTrigger>
                      <SelectContent className="text-black bg-white max-h-60">
                        {managers.map((manager) => (
                          <SelectItem
                            key={manager._id}
                            value={manager._id}
                            disabled={selectedManagers.find(
                              (mgr) => mgr.managerId === manager._id
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-purple-100 text-purple-600">
                                  {manager.firstName?.[0]}
                                  {manager.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {manager.firstName} {manager.lastName}
                                <span className="text-gray-500 text-xs ml-2">
                                  ({manager.email})
                                </span>
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                        {managers.length === 0 && (
                          <div className="px-2 py-4 text-center text-gray-500 text-sm">
                            No managers available
                          </div>
                        )}
                      </SelectContent>
                    </Select>

                    {selectedManagers.length > 0 && (
                      <div className="space-y-3">
                        <Label className="text-gray-800 font-semibold">
                          Selected Managers ({selectedManagers.length})
                        </Label>
                        <div className="space-y-2">
                          {selectedManagers.map((mgr) => {
                            const managerName = getManagerDisplayName(
                              mgr.managerId
                            );
                            const progress = getManagerProgress(mgr.managerId);
                            const isExisting = subtask.assignedManagers?.some(
                              (existingMgr) => {
                                const existingMgrId =
                                  existingMgr.managerId?._id?.toString() ||
                                  existingMgr.managerId.toString();
                                return existingMgrId === mgr.managerId;
                              }
                            );

                            return (
                              <div
                                key={mgr.managerId}
                                className={`flex items-center justify-between p-3 border rounded-lg ${
                                  isExisting
                                    ? "bg-green-50 border-green-200"
                                    : "bg-purple-50/50 border-purple-200"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="w-8 h-8">
                                    <AvatarFallback
                                      className={
                                        isExisting
                                          ? "bg-green-100 text-green-600"
                                          : "bg-purple-100 text-purple-600"
                                      }
                                    >
                                      {managerName[0]}
                                      {managerName.split(" ")[1]?.[0] || ""}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-900">
                                        {managerName}
                                      </p>
                                      {isExisting ? (
                                        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                                          Currently assigned
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                                          New assignment
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1">
                                      <div className="text-xs text-gray-500">
                                        {mgr.email}
                                      </div>
                                      {isExisting &&
                                        shouldShowLeadsField &&
                                        progress.completed > 0 && (
                                          <div className="flex items-center gap-1 text-xs">
                                            <span className="text-gray-600">
                                              Progress:
                                            </span>
                                            <span
                                              className={`font-medium ${
                                                progress.status === "completed"
                                                  ? "text-green-600"
                                                  : "text-purple-600"
                                              }`}
                                            >
                                              {progress.completed}/
                                              {progress.assigned}
                                            </span>
                                            <span
                                              className={`${
                                                progress.status === "completed"
                                                  ? "text-green-600"
                                                  : progress.status ===
                                                    "in_progress"
                                                  ? "text-purple-600"
                                                  : "text-yellow-600"
                                              }`}
                                            >
                                              ({progress.status})
                                            </span>
                                          </div>
                                        )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isExisting &&
                                    progress.status !== "pending" && (
                                      <Badge
                                        className={`${
                                          progress.status === "completed"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-purple-100 text-purple-800"
                                        }`}
                                      >
                                        {progress.status === "completed" ? (
                                          <CheckCircle className="w-3 h-3 mr-1" />
                                        ) : (
                                          <Clock className="w-3 h-3 mr-1" />
                                        )}
                                        {progress.status.replace("_", "-")}
                                      </Badge>
                                    )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeManager(mgr.managerId)}
                                    className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    disabled={isSubmitting}
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {shouldShowLeadsField &&
                  leadsRequired > 0 &&
                  totalAssignees > 0 && (
                    <div className="text-sm text-gray-700 bg-green-50 p-3 rounded-md border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Lead Distribution:</span>
                      </div>
                      <p className="text-sm">
                        <span className="font-semibold">
                          {leadsRequired} total leads
                        </span>{" "}
                        will be distributed among{" "}
                        <span className="font-semibold">
                          {totalAssignees} assignee
                          {totalAssignees > 1 ? "s" : ""}
                        </span>{" "}
                        ({selectedEmployees.length} employees,{" "}
                        {selectedManagers.length} managers)
                      </p>
                      <p className="text-sm mt-1">
                        Each assignee will be assigned approximately{" "}
                        <span className="font-semibold">
                          {leadsPerAssignee} lead
                          {leadsPerAssignee > 1 ? "s" : ""}
                        </span>
                      </p>
                    </div>
                  )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="startDate"
                    className="text-gray-800 font-semibold"
                  >
                    Start Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        handleInputChange("startDate", e.target.value)
                      }
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="endDate"
                    className="text-gray-800 font-semibold"
                  >
                    End Date *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        handleInputChange("endDate", e.target.value)
                      }
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="startTime"
                    className="text-gray-800 font-semibold"
                  >
                    Start Time *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        handleInputChange("startTime", e.target.value)
                      }
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="endTime"
                    className="text-gray-800 font-semibold"
                  >
                    End Time *
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) =>
                        handleInputChange("endTime", e.target.value)
                      }
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="priority"
                  className="text-gray-800 font-semibold"
                >
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    handleInputChange("priority", value)
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent className="text-black bg-white">
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Low
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        Medium
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        High
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-800 font-semibold">
                  Team Lead Info
                </Label>
                <div className="relative">
                  <UserCog className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    value={
                      session.user.name ||
                      `${session.user.firstName} ${session.user.lastName}`
                    }
                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-gray-900 pl-10 bg-gray-50"
                    readOnly
                    disabled
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>Department ID: {session.user.depId}</span>
                  {shouldShowLeadsField && (
                    <Badge
                      variant="outline"
                      className="ml-2 bg-green-50 text-green-700 border-green-200"
                    >
                      Lead Tracking Active
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-800 font-semibold">
                  Last Updated
                </Label>
                <div className="text-sm text-gray-600">
                  {subtask.updatedAt
                    ? format(new Date(subtask.updatedAt), "PPPpp")
                    : "Not updated yet"}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    !hasChanges() ||
                    totalAssignees === 0 ||
                    (shouldShowLeadsField && leadsRequired <= 0)
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Subtask
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Summary Card */}
        <div className="mt-6">
          <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
              <CardTitle className="text-lg font-bold text-gray-900">
                Current Status Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">Employees</h3>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">
                      {subtask.assignedEmployees?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Currently assigned
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-gray-800">Managers</h3>
                    </div>
                    <p className="text-3xl font-bold text-purple-700">
                      {subtask.assignedManagers?.length || 0}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Currently assigned
                    </p>
                  </div>

                  {shouldShowLeadsField && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-gray-800">
                          Leads Progress
                        </h3>
                      </div>
                      <p className="text-3xl font-bold text-green-700">
                        {subtask.leadsCompleted || 0} /{" "}
                        {subtask.totalLeadsRequired || leadsRequired}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {subtask.totalLeadsRequired
                          ? Math.round(
                              ((subtask.leadsCompleted || 0) /
                                subtask.totalLeadsRequired) *
                                100
                            )
                          : 0}
                        % completed
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Subtask Information:
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge
                        className={`
                                                ${
                                                  subtask.status === "completed"
                                                    ? "bg-green-100 text-green-800"
                                                    : subtask.status ===
                                                      "in_progress"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-yellow-100 text-yellow-800"
                                                }
                                            `}
                      >
                        {subtask.status?.replace("_", "-") || "pending"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created On:</span>
                      <span className="font-medium">
                        {format(new Date(subtask.createdAt), "PPP")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created By:</span>
                      <span className="font-medium">
                        {subtask.teamLeadName || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
