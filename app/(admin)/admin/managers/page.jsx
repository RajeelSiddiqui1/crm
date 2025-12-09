"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Calendar, User, Users, Building, MapPin, Phone, Eye, MoreVertical, Loader2 } from "lucide-react";
import axios from "axios";

export default function AdminManagersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [managers, setManagers] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManager, setSelectedManager] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }

    fetchManagers();
  }, [session, status, router]);

  const fetchManagers = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/admin/managers");
      if (response.data.success) {
        setManagers(response.data.managers || []);
      }
    } catch (error) {
      console.error("Error fetching managers:", error);
      toast.error("Failed to fetch managers");
    } finally {
      setFetching(false);
    }
  };

  const handleView = (manager) => {
    setSelectedManager(manager);
    setViewDialogOpen(true);
  };

  const filteredManagers = managers.filter(manager =>
    manager.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    manager.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
              Manager Management
            </h1>
            <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg">
              View and manage all managers across the organization
            </p>
          </div>
          <div className="flex items-center gap-3 self-center sm:self-auto">
            <Button
              onClick={fetchManagers}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white text-xs sm:text-sm"
            >
              <Loader2 className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Managers List */}
        <Card className="shadow-xl sm:shadow-2xl shadow-green-500/10 border-0 bg-gradient-to-br from-white to-green-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-green-50 border-b border-green-100/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Managers
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  {managers.length} manager{managers.length !== 1 ? 's' : ''} in the organization
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Search managers..."
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
                  <span className="text-sm sm:text-base md:text-lg">Loading managers...</span>
                </div>
              </div>
            ) : filteredManagers.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-300 mb-3 sm:mb-4">
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {managers.length === 0 ? "No managers found" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto px-4">
                  {managers.length === 0 
                    ? "There are no managers in the system yet."
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
                        Manager
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Departments
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
                    {filteredManagers.map((manager, index) => (
                      <TableRow 
                        key={manager._id} 
                        className="group hover:bg-gradient-to-r hover:from-green-50/80 hover:to-blue-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <Avatar className="border-2 border-white shadow-lg shadow-green-500/20 group-hover:shadow-xl group-hover:shadow-green-600/30 transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10">
                              <AvatarImage src={manager.profilePic} alt={`${manager.firstName} ${manager.lastName}`} />
                              <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold text-xs sm:text-sm">
                                {manager.firstName?.[0]}{manager.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-green-700 transition-colors duration-200 truncate">
                                {manager.firstName} {manager.lastName}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">Manager</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {manager.departments && manager.departments.length > 0 ? (
                              manager.departments.slice(0, 2).map((dept, idx) => (
                                <Badge 
                                  key={idx}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-medium px-2 py-1 text-xs shadow-lg shadow-green-500/20 whitespace-nowrap"
                                >
                                  <Building className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                                  {dept.name}
                                </Badge>
                              ))
                            ) : (
                              <Badge variant="outline" className="text-gray-500 text-xs">
                                No Departments
                              </Badge>
                            )}
                            {manager.departments && manager.departments.length > 2 && (
                              <Badge variant="outline" className="text-gray-500 text-xs">
                                +{manager.departments.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 hidden md:table-cell">
                          <div className="flex items-center gap-2 sm:gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                            <span className="text-sm font-medium truncate">{manager.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3 text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                              {formatDate(manager.createdAt)}
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
                              <DropdownMenuItem onClick={() => handleView(manager)} className="text-black cursor-pointer text-xs sm:text-sm">
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

      {/* View Manager Dialog - Responsive */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">Manager Details</DialogTitle>
          </DialogHeader>
          
          {selectedManager && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-green-100">
                  <AvatarImage src={selectedManager.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-lg sm:text-xl font-bold">
                    {selectedManager.firstName?.[0]}{selectedManager.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-black">
                    {selectedManager.firstName} {selectedManager.lastName}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">Manager</p>
                  <Badge className="mt-1 sm:mt-2 bg-green-100 text-green-800 hover:bg-green-100 text-xs">
                    <User className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>

              {/* Contact Information Card */}
              <Card className="bg-white">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-black mb-2 sm:mb-3 text-sm sm:text-base">Contact Information</h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                      <span className="text-black break-all">{selectedManager.email}</span>
                    </div>
                    {selectedManager.phone && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-black">{selectedManager.phone}</span>
                      </div>
                    )}
                    {selectedManager.address && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-black break-words">{selectedManager.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Departments Card */}
              <Card className="bg-white">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Building className="w-4 h-4" />
                    Departments ({selectedManager.departments?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {selectedManager.departments && selectedManager.departments.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedManager.departments.map((dept, idx) => (
                          <Badge 
                            key={idx}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-medium px-2 py-1 sm:px-3 sm:py-1.5 text-xs"
                          >
                            <Building className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                            {dept.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No departments assigned</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Account Information Card */}
              <Card className="bg-white">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-black mb-2 sm:mb-3 text-sm sm:text-base">Account Information</h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Join Date:</span>
                      <span className="font-medium text-black">{formatDate(selectedManager.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-black">{formatDate(selectedManager.updatedAt)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}