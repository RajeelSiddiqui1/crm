"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, FileText, User, Mail, Calendar, Users, Truck, Cpu, Building } from "lucide-react";
import axios from "axios";
import Link from "next/link";

export default function TeamLeadOperationTaskDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const taskId = params.id;

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [assignForm, setAssignForm] = useState({
    sharedOperationEmployee: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "TeamLead") {
      router.push("/login");
      return;
    }
    fetchTaskDetails();
    fetchEmployees();
  }, [session, status, router, taskId]);

  const fetchTaskDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/teamlead/operation-tasks/${taskId}`);
      if (response.data.success) {
        setTask(response.data.sharedTask);
      }
    } catch (error) {
      console.error("Error fetching task details:", error);
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get("/api/teamlead/employees");
      if (response.data.success) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleAssignToEmployee = async () => {
    if (!assignForm.sharedOperationEmployee) {
      toast.error("Please select an Employee");
      return;
    }

    setAssigning(true);
    try {
      const response = await axios.patch(
        `/api/teamlead/operation-tasks/${taskId}`,
        {
          sharedOperationEmployee: assignForm.sharedOperationEmployee,
        }
      );

      if (response.data.success) {
        toast.success("Task assigned to Employee successfully");
        setShowAssignDialog(false);
        setAssignForm({ sharedOperationEmployee: "" });
        fetchTaskDetails();
      }
    } catch (error) {
      console.error("Error assigning task:", error);
      const errorMessage = error.response?.data?.message || "Failed to assign task";
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const openAssignDialog = () => {
    setAssignForm({
      sharedOperationEmployee: task?.sharedOperationEmployee?._id || "",
    });
    setShowAssignDialog(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      signed: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      not_avaiable: "bg-red-100 text-red-800",
      not_intrested: "bg-pink-100 text-pink-800",
      re_shedule: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getVendorStatusColor = (status) => {
    const colors = {
      approved: "bg-green-100 text-green-800",
      not_approved: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getMachineStatusColor = (status) => {
    const colors = {
      deployed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          <p className="text-gray-700">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "TeamLead") return null;
  if (!task) return <div>Task not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/teamlead/operation-tasks">
              <Button variant="outline" size="icon">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{task.taskTitle}</h1>
              <p className="text-gray-600">Task ID: {task.originalTaskId}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Task Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-gray-600">{task.taskDescription || "No description"}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">{formatDate(task.dueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Priority</p>
                    <Badge>{task.priority}</Badge>
                  </div>
                </div>

                {task.notes && (
                  <div>
                    <h3 className="font-semibold mb-2">Notes</h3>
                    <p className="text-gray-600">{task.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Form Data */}
            {task.formId && (
              <Card>
                <CardHeader>
                  <CardTitle>Form Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p><strong>Form Title:</strong> {task.formId.title}</p>
                    {/* Add more form data fields as needed */}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assignment Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Assignment */}
                <div>
                  <h4 className="font-semibold mb-2">Assigned to</h4>
                  {task.sharedOperationEmployee ? (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="font-semibold">
                        {task.sharedOperationEmployee.firstName} {task.sharedOperationEmployee.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{task.sharedOperationEmployee.email}</p>
                    </div>
                  ) : (
                    <div className="bg-yellow-50 p-3 rounded-lg text-center">
                      <p className="text-yellow-800">Not assigned to employee</p>
                      <Button onClick={openAssignDialog} className="mt-2" size="sm">
                        Assign Employee
                      </Button>
                    </div>
                  )}
                </div>

                {/* Assign Button */}
                {!task.sharedOperationEmployee && (
                  <Button onClick={openAssignDialog} className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Assign to Employee
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Vendor Status</span>
                  <Badge className={getVendorStatusColor(task.VendorStatus)}>
                    {task.VendorStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Machine Status</span>
                  <Badge className={getMachineStatusColor(task.MachineStatus)}>
                    {task.MachineStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Overall Status</span>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Assign Employee Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Employee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Employee</label>
              <Select
                value={assignForm.sharedOperationEmployee}
                onValueChange={(value) => setAssignForm({ sharedOperationEmployee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee._id} value={employee._id}>
                      {employee.firstName} {employee.lastName} - {employee.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAssignToEmployee} disabled={assigning}>
                {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}