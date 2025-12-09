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
import { Search, Mail, Calendar, User, Users, Building, MapPin, Phone, Eye, MoreVertical, Loader2, Clock } from "lucide-react";
import axios from "axios";

export default function AdminTeamLeadsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamLeads, setTeamLeads] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamLead, setSelectedTeamLead] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.role !== "Admin") {
      router.push("/adminlogin");
      return;
    }

    fetchTeamLeads();
  }, [session, status, router]);

  const fetchTeamLeads = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/admin/teamleads");
      if (response.data.success) {
        setTeamLeads(response.data.teamleads || []);
      }
    } catch (error) {
      console.error("Error fetching team leads:", error);
      toast.error("Failed to fetch team leads");
    } finally {
      setFetching(false);
    }
  };

  const handleView = (teamLead) => {
    setSelectedTeamLead(teamLead);
    setViewDialogOpen(true);
  };

  const filteredTeamLeads = teamLeads.filter(teamLead =>
    teamLead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamLead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamLead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamLead.depId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamLead.managerId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teamLead.managerId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              Team Lead Management
            </h1>
            <p className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base md:text-lg">
              View and manage all team leads across departments
            </p>
          </div>
          <div className="flex items-center gap-3 self-center sm:self-auto">
            <Button
              onClick={fetchTeamLeads}
              variant="outline"
              size="sm"
              className="border-gray-700 text-gray-700 hover:bg-gray-700 hover:text-white text-xs sm:text-sm"
            >
              <Loader2 className={`w-3 h-3 sm:w-4 sm:h-4 mr-2 ${fetching ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Team Leads List */}
        <Card className="shadow-xl sm:shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  All Team Leads
                </CardTitle>
                <CardDescription className="text-gray-600 text-sm sm:text-base">
                  {teamLeads.length} team lead{teamLeads.length !== 1 ? 's' : ''} in the organization
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <Input
                  placeholder="Search team leads..."
                  className="pl-9 sm:pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-10 sm:h-11 text-sm sm:text-base"
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
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-blue-600" />
                  <span className="text-sm sm:text-base md:text-lg">Loading team leads...</span>
                </div>
              </div>
            ) : filteredTeamLeads.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="text-gray-300 mb-3 sm:mb-4">
                  <Users className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
                </div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">
                  {teamLeads.length === 0 ? "No team leads found" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto px-4">
                  {teamLeads.length === 0 
                    ? "There are no team leads in the system yet."
                    : "Try adjusting your search terms to find what you're looking for."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Team Lead
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Department
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        Manager
                      </TableHead>
                      <TableHead className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wide py-3 sm:py-4 whitespace-nowrap">
                        Work Hours
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
                    {filteredTeamLeads.map((teamLead, index) => (
                      <TableRow 
                        key={teamLead._id} 
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-indigo-50/80 transition-all duration-300 border-b border-gray-100/50"
                      >
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-600/30 transition-all duration-300 w-8 h-8 sm:w-10 sm:h-10">
                              <AvatarImage src={teamLead.profilePic} alt={`${teamLead.firstName} ${teamLead.lastName}`} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold text-xs sm:text-sm">
                                {teamLead.firstName?.[0]}{teamLead.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-gray-900 text-sm sm:text-base group-hover:text-blue-700 transition-colors duration-200 truncate">
                                {teamLead.firstName} {teamLead.lastName}
                              </div>
                              <div className="text-xs text-gray-500 font-medium">Team Lead</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          {teamLead.depId ? (
                            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 font-medium px-2 py-1 sm:px-3 sm:py-1.5 text-xs shadow-lg shadow-blue-500/20 whitespace-nowrap">
                              <Building className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                              {teamLead.depId.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 text-xs">
                              No Department
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 sm:py-4 hidden lg:table-cell">
                          {teamLead.managerId ? (
                            <div className="flex items-center gap-2">
                              <User className="w-3 h-3 text-green-500" />
                              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                                {teamLead.managerId.firstName} {teamLead.managerId.lastName}
                              </span>
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-gray-500 text-xs">
                              No Manager
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                            <span className="font-medium whitespace-nowrap">
                              {formatTime(teamLead.startTime)} - {formatTime(teamLead.endTime)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3 sm:py-4">
                          <div className="flex items-center gap-2 sm:gap-3 text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                              {formatDate(teamLead.createdAt)}
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
                              <DropdownMenuItem onClick={() => handleView(teamLead)} className="text-black cursor-pointer text-xs sm:text-sm">
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

      {/* View Team Lead Dialog - Responsive with Slider */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md md:max-w-lg bg-white text-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl text-black">Team Lead Details</DialogTitle>
          </DialogHeader>
          
          {selectedTeamLead && (
            <div className="space-y-4 sm:space-y-6">
              {/* Header Section */}
              <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
                <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-4 border-blue-100">
                  <AvatarImage src={selectedTeamLead.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg sm:text-xl font-bold">
                    {selectedTeamLead.firstName?.[0]}{selectedTeamLead.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl font-bold text-black">
                    {selectedTeamLead.firstName} {selectedTeamLead.lastName}
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base">Team Lead</p>
                  <Badge className="mt-1 sm:mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">
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
                      <span className="text-black break-all">{selectedTeamLead.email}</span>
                    </div>
                    {selectedTeamLead.phone && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                        <span className="text-black">{selectedTeamLead.phone}</span>
                      </div>
                    )}
                    {selectedTeamLead.address && (
                      <div className="flex items-center gap-2 sm:gap-3">
                        <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-black break-words">{selectedTeamLead.address}</span>
                      </div>
                    )}
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
                  <div className="space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Department</p>
                      {selectedTeamLead.depId ? (
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 font-medium px-2 py-1 sm:px-3 sm:py-1.5 text-xs">
                          <Building className="w-2 h-2 sm:w-3 sm:h-3 mr-1" />
                          {selectedTeamLead.depId.name}
                        </Badge>
                      ) : (
                        <p className="text-gray-500">No department assigned</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Reporting Manager</p>
                      {selectedTeamLead.managerId ? (
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                          <div>
                            <span className="font-medium text-black block">
                              {selectedTeamLead.managerId.firstName} {selectedTeamLead.managerId.lastName}
                            </span>
                            <span className="text-gray-500 text-xs">{selectedTeamLead.managerId.email}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500">No manager assigned</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Work Schedule Card with Slider */}
              <Card className="bg-white">
                <CardContent className="p-3 sm:p-4">
                  <h3 className="font-semibold text-black mb-2 sm:mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Clock className="w-4 h-4" />
                    Work Schedule
                  </h3>
                  <div className="space-y-4">
                    {/* Start Time Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-xs sm:text-sm">Start Time</span>
                        <span className="font-medium text-blue-600 text-xs sm:text-sm">{formatTime(selectedTeamLead.startTime)}</span>
                      </div>
                      <div className="px-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value="40" // Default position for 9:00 AM
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-blue"
                          readOnly
                          style={{
                            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 40%, #e5e7eb 40%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 px-1">
                        <span>8:00 AM</span>
                        <span>12:00 PM</span>
                        <span>4:00 PM</span>
                      </div>
                    </div>

                    {/* End Time Slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 text-xs sm:text-sm">End Time</span>
                        <span className="font-medium text-indigo-600 text-xs sm:text-sm">{formatTime(selectedTeamLead.endTime)}</span>
                      </div>
                      <div className="px-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value="80" // Default position for 5:00 PM
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-indigo"
                          readOnly
                          style={{
                            background: `linear-gradient(to right, #6366f1 0%, #6366f1 80%, #e5e7eb 80%, #e5e7eb 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 px-1">
                        <span>10:00 AM</span>
                        <span>2:00 PM</span>
                        <span>6:00 PM</span>
                      </div>
                    </div>

                    {/* Current Schedule Display */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm mt-4">
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-gray-600">Start Time</div>
                        <div className="font-bold text-blue-700 text-sm sm:text-base">
                          {formatTime(selectedTeamLead.startTime)}
                        </div>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-indigo-50 rounded-lg">
                        <div className="text-gray-600">End Time</div>
                        <div className="font-bold text-indigo-700 text-sm sm:text-base">
                          {formatTime(selectedTeamLead.endTime)}
                        </div>
                      </div>
                    </div>
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
                      <span className="font-medium text-black">{formatDate(selectedTeamLead.createdAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Last Updated:</span>
                      <span className="font-medium text-black">{formatDate(selectedTeamLead.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-medium text-black font-mono text-xs">{selectedTeamLead.userId}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Custom Slider Styles */}
      <style jsx>{`
        .slider-blue::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider-blue::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider-indigo::-webkit-slider-thumb {
          appearance: none;
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .slider-indigo::-moz-range-thumb {
          height: 18px;
          width: 18px;
          border-radius: 50%;
          background: #6366f1;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
    </div>
  );
}