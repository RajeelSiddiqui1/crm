"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Plus,
  Search,
  Mail,
  Calendar,
  User,
  X,
  Loader2,
  Users,
  Building,
  MapPin,
  Phone,
  Clock,
  IdCard,
  Pencil,
  Eye,
  MoreVertical,
} from "lucide-react";
import axios from "axios";

export default function EmployeePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    // password: "",
    // confirmPassword: "",
    depId: "",
  });

  const [editFormData, setEditFormData] = useState({
    depId: "",
    startTime: "09:00 AM",
    endTime: "05:00 PM",
  });

  // Time options for 12-hour format
  const timeOptions = [
    "12:00 AM", "12:30 AM", "01:00 AM", "01:30 AM", "02:00 AM", "02:30 AM",
    "03:00 AM", "03:30 AM", "04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM",
    "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM",
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM",
    "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
  ];

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchEmployees();
    fetchDepartments();
  }, [session, status, router]);

  const fetchEmployees = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/manager/employee");
      if (response.status === 200) {
        setEmployees(response.data.employees || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setFetching(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/manager/department");
      if (response.status === 200) {
        setDepartments(response.data.departments || response.data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }

    if (!formData.depId) {
      toast.error("Please select a department");
      setLoading(false);
      return;
    }

    try {
      const submitData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        depId: formData.depId,
      };

      const response = await axios.post("/api/manager/employee", submitData);

      if (response.status === 201) {
        toast.success("Employee created successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          // password: "",
          // confirmPassword: "",
          depId: "",
        });
        setShowForm(false);
        fetchEmployees();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create employee");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      // password: "",
      // confirmPassword: "",
      depId: "",
    });
    setShowForm(false);
  };

  const handleEdit = (emp) => {
    setSelectedEmployee(emp);
    setEditFormData({
      depId: emp.depId?._id || emp.depId || "",
      startTime: emp.startTime || "09:00 AM",
      endTime: emp.endTime || "05:00 PM",
    });
    setEditDialogOpen(true);
  };

  const handleView = (emp) => {
    setSelectedEmployee(emp);
    setViewDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedEmployee) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/manager/employee/${selectedEmployee._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editFormData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Employee updated successfully!");
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === selectedEmployee._id ? data.employee : emp
          )
        );
        setEditDialogOpen(false);
      } else {
        toast.error(data.message || "Failed to update employee");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update employee");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.depId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-green-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-4 sm:p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              Employee Management
            </h1>
            <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg">
              Manage your team members and their assignments in one place
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
            size="lg"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Add Employee
          </Button>
        </div>

        {/* Add Employee Form */}
        {showForm && (
          <Card className="mb-8 border-0 shadow-xl sm:shadow-2xl shadow-green-500/10 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-600 to-blue-700 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white text-xl sm:text-2xl">
                    Add New Team Member
                  </CardTitle>
                  <CardDescription className="text-green-100 text-sm sm:text-base">
                    Fill in the details to create a new employee account
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  className="h-7 w-7 sm:h-8 sm:w-8 text-white hover:bg-white/20"
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label
                      htmlFor="firstName"
                      className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wide"
                    >
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder="Enter first name"
                      className="focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      required
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label
                      htmlFor="lastName"
                      className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wide"
                    >
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder="Enter last name"
                      className="focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wide"
                  >
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="employee@company.com"
                    className="focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm text-sm sm:text-base"
                    required
                  />
                </div>
{/* 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 sm:space-y-3">
                    <Label
                      htmlFor="password"
                      className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wide"
                    >
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Minimum 6 characters"
                      className="focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-2 sm:space-y-3">
                    <Label
                      htmlFor="confirmPassword"
                      className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wide"
                    >
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Re-enter password"
                      className="focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm text-sm sm:text-base"
                      required
                      minLength={6}
                    />
                  </div>
                </div> */}

                <div className="space-y-2 sm:space-y-3">
                  <Label
                    htmlFor="depId"
                    className="text-gray-700 font-semibold text-xs sm:text-sm uppercase tracking-wide"
                  >
                    Department *
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-gray-400" />
                    <select
                      id="depId"
                      value={formData.depId}
                      onChange={(e) =>
                        setFormData({ ...formData, depId: e.target.value })
                      }
                      className="w-full p-2 sm:p-3 pl-8 sm:pl-10 border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white transition-all duration-200 shadow-sm appearance-none text-black text-sm sm:text-base"
                      required
                    >
                      <option value="" className="text-gray-500">
                        Select a department
                      </option>
                      {departments.map((dept) => (
                        <option
                          key={dept._id}
                          value={dept._id}
                          className="text-black"
                        >
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white px-6 sm:px-8 py-2.5 shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100 text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Employee"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-4 sm:px-6 py-2.5 transition-all duration-200 shadow-sm text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Employees List */}
        <Card className="shadow-xl sm:shadow-2xl shadow-green-500/10 border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Team Members
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  {employees.length} employee{employees.length !== 1 ? "s" : ""}{" "}
                  in your team
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or ID..."
                  className="pl-9 sm:pl-10 pr-4 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm h-10 sm:h-11 text-sm sm:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-12 sm:py-16">
                <div className="flex items-center gap-2 sm:gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-green-600" />
                  <span className="text-sm sm:text-base md:text-lg">
                    Loading team members...
                  </span>
                </div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-300 mb-3 sm:mb-4">
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {employees.length === 0
                    ? "No team members yet"
                    : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto mb-4 sm:mb-6 px-4">
                  {employees.length === 0
                    ? "Get started by adding your first team member to the system."
                    : "Try adjusting your search terms to find what you're looking for."}
                </p>
                {employees.length === 0 && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white shadow-lg shadow-green-500/25 hover:shadow-xl hover:shadow-green-600/30 transition-all duration-300 transform hover:scale-105 px-6 sm:px-8 py-2.5 text-sm sm:text-base"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Add First Employee
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-green-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Team Member
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        Employee ID
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Department
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        Contact
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Join Date
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((emp, index) => (
                      <TableRow
                        key={emp._id}
                        className="group hover:bg-gradient-to-r hover:from-green-50/80 hover:to-blue-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <Avatar className="border-2 border-white shadow-lg shadow-green-500/20 group-hover:shadow-xl group-hover:shadow-green-600/30 transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10">
                              <AvatarImage
                                src={emp.profilePic}
                                alt={`${emp.firstName} ${emp.lastName}`}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-xs sm:text-sm">
                                {emp.firstName?.[0]}
                                {emp.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-green-700 transition-colors duration-200 truncate">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">
                                Employee
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 hidden sm:table-cell">
                          <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-mono text-xs px-2 py-1 sm:px-3 sm:py-1.5 shadow-lg shadow-purple-500/20 whitespace-nowrap">
                            <User className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2" />
                            {emp.userId}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-medium px-2 py-1 sm:px-3 sm:py-1.5 text-xs shadow-lg shadow-green-500/20 whitespace-nowrap">
                            <Building className="w-2 h-2 sm:w-3 sm:h-3 mr-1 sm:mr-2" />
                            {emp.depId?.name || "No Department"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 sm:gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            <span className="text-xs sm:text-sm font-medium truncate">
                              {emp.email}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3 text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                              {formatDate(emp.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                              >
                                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="bg-white text-black"
                            >
                              <DropdownMenuItem
                                onClick={() => handleView(emp)}
                                className="text-black cursor-pointer text-xs sm:text-sm"
                              >
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(emp)}
                                className="text-black cursor-pointer text-xs sm:text-sm"
                              >
                                <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Employee Dialog with Digital Time Inputs */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">
              Edit Employee Schedule
            </DialogTitle>
            <DialogDescription className="text-gray-600 text-sm sm:text-base">
              Update department and work schedule for{" "}
              {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Department Selection */}
            <div className="space-y-2">
              <Label
                htmlFor="editDepId"
                className="text-black text-sm sm:text-base"
              >
                <Building className="w-4 h-4 inline mr-2" />
                Department
              </Label>
              <Select
                value={editFormData.depId}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, depId: value })
                }
              >
                <SelectTrigger className="text-black text-sm sm:text-base">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black max-h-60 overflow-y-auto">
                  {departments.map((dept) => (
                    <SelectItem
                      key={dept._id}
                      value={dept._id}
                      className="text-black text-sm sm:text-base"
                    >
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Work Schedule - Digital Time Inputs */}
            <div className="space-y-4">
              <Label className="text-black text-sm sm:text-base flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Work Schedule
              </Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-gray-700 text-sm">
                    Start Time
                  </Label>
                  <Select 
                    value={editFormData.startTime} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, startTime: value })}
                  >
                    <SelectTrigger className="text-black text-sm">
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black max-h-60 overflow-y-auto">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time} className="text-black text-sm">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* End Time */}
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-gray-700 text-sm">
                    End Time
                  </Label>
                  <Select 
                    value={editFormData.endTime} 
                    onValueChange={(value) => setEditFormData({ ...editFormData, endTime: value })}
                  >
                    <SelectTrigger className="text-black text-sm">
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black max-h-60 overflow-y-auto">
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time} className="text-black text-sm">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current Schedule Display */}
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-center text-sm text-green-800">
                  <div className="font-semibold">Current Schedule</div>
                  <div className="mt-1">
                    {editFormData.startTime} - {editFormData.endTime}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
              >
                {loading && (
                  <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-spin" />
                )}
                Update Schedule
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
                className="text-black border-gray-300 text-sm sm:text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Employee Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">
              Employee Details
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-100">
                  <AvatarImage src={selectedEmployee.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg sm:text-xl font-bold">
                    {selectedEmployee.firstName?.[0]}
                    {selectedEmployee.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-black">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">Employee</p>
                  <Badge className="mt-1 sm:mt-2 bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <IdCard className="w-4 h-4" />
                      Basic Information
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-mono font-bold text-black text-xs sm:text-sm">
                          {selectedEmployee.userId}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Join Date:</span>
                        <span className="font-medium text-black">
                          {formatDate(selectedEmployee.createdAt)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Building className="w-4 h-4" />
                      Department
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Department:</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {selectedEmployee.depId?.name || "No Department"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Team Lead:</span>
                        <span className="font-medium text-black text-right">
                          {selectedEmployee.teamLeadId
                            ? "Assigned"
                            : "Not Assigned"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 text-sm sm:text-base">
                      Contact Information
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-black break-all">
                          {selectedEmployee.email}
                        </span>
                      </div>
                      {selectedEmployee.phone && (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          <span className="text-black">
                            {selectedEmployee.phone}
                          </span>
                        </div>
                      )}
                      {selectedEmployee.address && (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-black break-words">
                            {selectedEmployee.address}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Clock className="w-4 h-4" />
                      Work Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                        <div className="text-gray-600 text-xs sm:text-sm">
                          Start Time
                        </div>
                        <div className="font-bold text-green-700 text-sm sm:text-base">
                          {selectedEmployee.startTime || "09:00 AM"}
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-gray-600 text-xs sm:text-sm">
                          End Time
                        </div>
                        <div className="font-bold text-blue-700 text-sm sm:text-base">
                          {selectedEmployee.endTime || "05:00 PM"}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}