"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Calendar, User, Users, Building, MapPin, Phone, Clock, IdCard, Eye, MoreVertical, Loader2 } from "lucide-react";
import axios from "axios";

export default function AdminEmployeesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [employees, setEmployees] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Admin") {
      router.push("/admin/login");
      return;
    }

    fetchEmployees();
  }, [session, status, router]);

  const fetchEmployees = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/admin/employees");
      console.log("API Response:", response.data); // Debug log
      if (response.data.success) {
        setEmployees(response.data.employees || []); // ✅ Correct spelling
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to fetch employees");
    } finally {
      setFetching(false);
    }
  };

  const handleView = (emp) => {
    setSelectedEmployee(emp);
    setViewDialogOpen(true);
  };

  const filteredEmployees = employees.filter(emp =>
    emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.depId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.managerId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.managerId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "Not set";
    return timeString;
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

  if (!session || session.user.role !== "Admin") {
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
              View and manage all employees across the organization
            </p>
          </div>
          <div className="flex items-center gap-3 self-center sm:self-auto">
            <Button
              onClick={fetchEmployees}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white text-xs sm:text-sm"
            >
              <Loader2 className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Employees List */}
        <Card className="shadow-xl sm:shadow-2xl shadow-green-500/10 border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Employees
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  {employees.length} employee{employees.length !== 1 ? 's' : ''} in the organization
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Search employees..."
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
                  <span className="text-sm sm:text-base md:text-lg">Loading employees...</span>
                </div>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-300 mb-3 sm:mb-4">
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {employees.length === 0 ? "No employees found" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto px-4">
                  {employees.length === 0 
                    ? "There are no employees in the system yet."
                    : "Try adjusting your search terms to find what you're looking for."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-green-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Employee
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        Employee ID
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Department
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        Manager
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
                              <AvatarImage src={emp.profilePic} alt={`${emp.firstName} ${emp.lastName}`} />
                              <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-xs sm:text-sm">
                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-green-700 transition-colors duration-200 truncate">
                                {emp.firstName} {emp.lastName}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">Employee</div>
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
                            {emp.depId?.name || "No Dept"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 hidden lg:table-cell">
                          {emp.managerId ? (
                            <div className="text-xs sm:text-sm text-gray-700 truncate">
                              {emp.managerId.firstName} {emp.managerId.lastName}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 text-xs">
                              No Manager
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 sm:gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 sm:w-5 sm:h-5 text-green-500" />
                            <span className="text-xs sm:text-sm font-medium truncate">{emp.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3 text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                              {formatDate(emp.createdAt)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4 text-black" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white text-black">
                              <DropdownMenuItem onClick={() => handleView(emp)} className="text-black cursor-pointer text-xs sm:text-sm">
                                <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                View Details
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

      {/* View Employee Dialog - Better Responsive */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg lg:max-w-2xl bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">Employee Details</DialogTitle>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-100">
                  <AvatarImage src={selectedEmployee.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg sm:text-xl font-bold">
                    {selectedEmployee.firstName?.[0]}{selectedEmployee.lastName?.[0]}
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

              {/* Grid Layout for Better Mobile */}
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                {/* Basic Information Card */}
                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <IdCard className="w-4 h-4" />
                      Basic Information
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-mono font-bold text-black text-xs sm:text-sm">{selectedEmployee.userId}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Join Date:</span>
                        <span className="font-medium text-black">{formatDate(selectedEmployee.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Department & Manager Card */}
                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Building className="w-4 h-4" />
                      Department & Manager
                    </h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Department:</span>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {selectedEmployee.depId?.name || "No Department"}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Manager:</span>
                        <span className="font-medium text-black text-right">
                          {selectedEmployee.managerId 
                            ? `${selectedEmployee.managerId.firstName} ${selectedEmployee.managerId.lastName}`
                            : "Not Assigned"
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information Card */}
                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 text-sm sm:text-base">Contact Information</h3>
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-black break-all">{selectedEmployee.email}</span>
                      </div>
                      {selectedEmployee.phone && (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                          <span className="text-black">{selectedEmployee.phone}</span>
                        </div>
                      )}
                      {selectedEmployee.address && (
                        <div className="flex items-center gap-2 sm:gap-3">
                          <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-black break-words">{selectedEmployee.address}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Work Schedule Card */}
                <Card className="bg-white">
                  <CardContent className="p-3 sm:p-4">
                    <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                      <Clock className="w-4 h-4" />
                      Work Schedule
                    </h3>
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="text-center p-2 sm:p-3 bg-green-50 rounded-lg">
                        <div className="text-gray-600 text-xs sm:text-sm">Start Time</div>
                        <div className="font-bold text-green-700 text-sm sm:text-base">
                          {formatTime(selectedEmployee.startTime)}
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-gray-600 text-xs sm:text-sm">End Time</div>
                        <div className="font-bold text-blue-700 text-sm sm:text-base">
                          {formatTime(selectedEmployee.endTime)}
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