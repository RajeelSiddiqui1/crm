"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Search, 
  Mail, 
  Calendar, 
  User, 
  Loader2, 
  Users, 
  Building, 
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  Eye
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminUsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({
    role: "",
    department: "",
    search: ""
  });
  const [isMobile, setIsMobile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }

    fetchUsers();
    fetchDepartments();
    checkMobile();
    
    const handleResize = () => {
      checkMobile();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [session, status, router]);

  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  const fetchUsers = async () => {
    try {
      setFetching(true);
      const params = new URLSearchParams();
      
      if (filters.role) params.append('role', filters.role);
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/admin/fetchusers?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch users");
    } finally {
      setFetching(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch("/api/admin/department");
      const data = await response.json();
      
      if (response.ok) {
        setDepartments(data.departments || data || []);
      } else {
        toast.error("Failed to fetch departments");
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
      toast.error("Failed to fetch departments");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const applyFilters = () => {
    fetchUsers();
  };

  const clearFilters = () => {
    setFilters({
      role: "",
      department: "",
      search: ""
    });
    setSearchTerm("");
  };

  const handleViewUserDetails = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const filteredUsers = users.filter(user =>
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getRoleBadge = (role) => {
    const roleColors = {
      Admin: "bg-purple-100 text-purple-800 border-purple-200",
      Manager: "bg-blue-100 text-blue-800 border-blue-200",
      TeamLead: "bg-green-100 text-green-800 border-green-200",
      Employee: "bg-gray-100 text-gray-800 border-gray-200"
    };
    
    return roleColors[role] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const exportToCSV = () => {
    const headers = ["Name", "Role", "Email", "User ID", "Department", "Manager", "Join Date"];
    const csvData = filteredUsers.map(user => [
      `${user.firstName} ${user.lastName}`,
      user.role,
      user.email,
      user.userId || "N/A",
      user.department,
      user.manager?.name || "N/A",
      formatDate(user.createdAt)
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Users data exported successfully");
  };

  const MobileUserCard = ({ user }) => (
    <Card className="mb-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-gray-100">
              <AvatarImage src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-bold">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-600">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg">
              <DropdownMenuItem 
                onClick={() => handleViewUserDetails(user)}
                className="text-black cursor-pointer hover:bg-gray-50"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <User className="w-3 h-3" />
              <span className="font-medium">Role:</span>
            </div>
            <Badge className={`${getRoleBadge(user.role)} text-xs px-2 py-1 border`}>
              {user.role}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <Building className="w-3 h-3" />
              <span className="font-medium">Dept:</span>
            </div>
            <span className="text-gray-900 text-xs">{user.department}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <User className="w-3 h-3" />
              <span className="font-medium">ID:</span>
            </div>
            <span className="text-gray-900 font-mono text-xs">{user.userId || "N/A"}</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-3 h-3" />
              <span className="font-medium">Joined:</span>
            </div>
            <span className="text-gray-900 text-xs">{formatDate(user.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "Admin") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 p-3 sm:p-4 md:p-6">
      <Toaster position="top-right" />

      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              User Details
            </DialogTitle>
            <DialogDescription>
              Complete information about the user
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                <Avatar className="h-16 w-16 border-2 border-white shadow-lg">
                  <AvatarImage src={selectedUser.profilePic} alt={`${selectedUser.firstName} ${selectedUser.lastName}`} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg font-bold">
                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <Badge className={`${getRoleBadge(selectedUser.role)} mt-1`}>
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Email Address</Label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded-lg">
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="text-gray-900">{selectedUser.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User ID</Label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-900 font-mono">{selectedUser.userId || "N/A"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Department</Label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded-lg">
                      <Building className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-900">{selectedUser.department}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Join Date</Label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-900">{formatDate(selectedUser.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Manager</Label>
                    <div className="flex items-center gap-2 mt-1 p-2 bg-gray-50 rounded-lg">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-gray-900">{selectedUser.manager?.name || "N/A"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Account Status</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {selectedUser.phone && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Contact Number</Label>
                  <div className="mt-1 p-2 bg-gray-50 rounded-lg">
                    <span className="text-gray-900">{selectedUser.phone}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 md:mb-8">
          <div className="text-center lg:text-left w-full lg:w-auto">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-700 bg-clip-text text-transparent">
              Users Management
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base md:text-lg">
              Manage all users across your organization
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Button
              onClick={exportToCSV}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">Export</span>
            </Button>
            <Button
              onClick={fetchUsers}
              variant="outline"
              size={isMobile ? "sm" : "default"}
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300 text-xs sm:text-sm"
            >
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">Refresh</span>
            </Button>
          </div>
        </div>

        <Card className="mb-6 md:mb-8 border-0 shadow-2xl shadow-green-500/10 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-green-600 to-blue-700 text-white rounded-t-lg p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-white">
              <Filter className="w-4 h-4 md:w-5 md:h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">Role</Label>
                <select
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                  className="w-full p-2 text-sm md:text-base border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white"
                >
                  <option value="">All Roles</option>
                  <option value="Manager">Manager</option>
                  <option value="TeamLead">Team Lead</option>
                  <option value="Employee">Employee</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">Department</Label>
                <select
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                  className="w-full p-2 text-sm md:text-base border border-gray-300 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 bg-white"
                >
                  <option value="">All Departments</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700">Search</Label>
                <Input
                  placeholder="Search users..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="focus:border-green-500 focus:ring-2 focus:ring-green-200 text-sm md:text-base"
                  size={isMobile ? "sm" : "default"}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs md:text-sm font-medium text-gray-700 opacity-0">Actions</Label>
                <div className="flex gap-2">
                  <Button
                    onClick={applyFilters}
                    size={isMobile ? "sm" : "default"}
                    className="bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 text-white flex-1 text-xs md:text-sm"
                  >
                    Apply
                  </Button>
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    size={isMobile ? "sm" : "default"}
                    className="flex-1 text-xs md:text-sm"
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 lg:hidden">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, department..."
              className="pl-10 pr-4 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm h-10 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card className="shadow-2xl shadow-green-500/10 border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100/50 p-4 md:p-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 md:gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Users
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm md:text-base">
                  {users.length} user{users.length !== 1 ? 's' : ''} in your organization
                </CardDescription>
              </div>
              <div className="relative w-full lg:w-80 hidden lg:block">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-gray-400" />
                <Input
                  placeholder="Quick search by name, email, department..."
                  className="pl-10 pr-4 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 shadow-sm h-10 md:h-11 text-sm md:text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-12 md:py-16">
                <div className="flex items-center gap-2 md:gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin text-green-600" />
                  <span className="text-sm md:text-lg">Loading users...</span>
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 md:py-16 px-4">
                <div className="text-gray-300 mb-3 md:mb-4">
                  <Users className="w-16 h-16 md:w-20 md:h-20 mx-auto" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">
                  {users.length === 0 ? "No users found" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm md:text-lg max-w-md mx-auto">
                  {users.length === 0 
                    ? "There are no users in the system yet."
                    : "Try adjusting your search or filters to find what you're looking for."
                  }
                </p>
              </div>
            ) : isMobile ? (
              <div className="p-3 md:p-4 space-y-3">
                {filteredUsers.map((user) => (
                  <MobileUserCard key={`${user.role}-${user._id}`} user={user} />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-green-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-gray-900 text-xs md:text-sm uppercase tracking-wide py-3 md:py-4">User</TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs md:text-sm uppercase tracking-wide py-3 md:py-4">Role</TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs md:text-sm uppercase tracking-wide py-3 md:py-4">Department</TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs md:text-sm uppercase tracking-wide py-3 md:py-4">Join Date</TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs md:text-sm uppercase tracking-wide py-3 md:py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user, index) => (
                      <TableRow 
                        key={`${user.role}-${user._id}`} 
                        className="group hover:bg-gradient-to-r hover:from-green-50/80 hover:to-blue-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-3 md:py-4">
                          <div className="flex items-center gap-3 md:gap-4">
                            <Avatar className="h-8 w-8 md:h-10 md:w-10 border-2 border-white shadow-lg shadow-green-500/20 group-hover:shadow-xl group-hover:shadow-green-600/30 transition-all duration-300">
                              <AvatarImage src={user.profilePic} alt={`${user.firstName} ${user.lastName}`} />
                              <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-xs md:text-sm font-bold">
                                {user.firstName?.[0]}{user.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-gray-900 text-sm md:text-lg group-hover:text-green-700 transition-colors duration-200">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs md:text-sm text-gray-500 font-medium hidden sm:block">{user.email}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4">
                          <Badge className={`${getRoleBadge(user.role)} font-medium px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm`}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3 md:py-4">
                          <div className="flex items-center gap-1 md:gap-2 text-gray-700">
                            <Building className="w-3 h-3 md:w-4 md:h-4 text-green-500" />
                            <span className="font-medium text-sm md:text-base">{user.department}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4">
                          <div className="flex items-center gap-2 md:gap-3 text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                            <span className="text-sm md:text-base font-medium">{formatDate(user.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 md:py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0 text-gray-600 hover:text-gray-900">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg w-48">
                              <DropdownMenuItem 
                                onClick={() => handleViewUserDetails(user)}
                                className="text-black cursor-pointer hover:bg-gray-50"
                              >
                                <Eye className="w-4 h-4 mr-2 text-green-600" />
                                View Full Details
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
    </div>
  );
}