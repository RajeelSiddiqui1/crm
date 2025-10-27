"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Mail, Calendar, User, X, Loader2, Users, Building, MapPin, Phone, Clock, IdCard, Pencil, Eye, MoreVertical } from "lucide-react";
import axios from "axios";

export default function TeamLeadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeamLead, setSelectedTeamLead] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    depId: "",
  });

  const [editFormData, setEditFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    depId: "",
    startTime: "09:00 AM",
    endTime: "05:00 PM"
  });

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "Manager") {
      router.push("/managerlogin");
      return;
    }

    fetchTeamLeads();
    fetchDepartments();
  }, [session, status, router]);

  const fetchTeamLeads = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/manager/teamlead");
      setTeamLeads(response.data.teamLeads || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to fetch team leads");
    } finally {
      setFetching(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await axios.get("/api/admin/department");
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
      const response = await axios.post("/api/manager/teamlead", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        depId: formData.depId
      });

      if (response.status === 201) {
        toast.success("Team Lead created successfully!");
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          confirmPassword: "",
          depId: "",
        });
        setShowForm(false);
        fetchTeamLeads();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create team lead");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      depId: "",
    });
    setShowForm(false);
  };

  const handleEdit = (lead) => {
    setSelectedTeamLead(lead);
    setEditFormData({
      firstName: lead.firstName || "",
      lastName: lead.lastName || "",
      phone: lead.phone || "",
      address: lead.address || "",
      depId: lead.depId?._id || lead.depId || "",
      startTime: lead.startTime || "09:00 AM",
      endTime: lead.endTime || "05:00 PM"
    });
    setEditDialogOpen(true);
  };

  const handleView = (lead) => {
    setSelectedTeamLead(lead);
    setViewDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedTeamLead) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/manager/teamlead/${selectedTeamLead._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Team Lead updated successfully!");
        setTeamLeads(prev => prev.map(lead =>
          lead._id === selectedTeamLead._id ? data.teamLead : lead
        ));
        setEditDialogOpen(false);
      } else {
        toast.error(data.message || "Failed to update team lead");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update team lead");
    } finally {
      setLoading(false);
    }
  };

  const filteredTeamLeads = teamLeads.filter(lead =>
    lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.depId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const timeOptions = [
    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM"
  ];

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

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Team Lead Management
            </h1>
            <p className="text-gray-600 mt-3 text-lg">
              Manage team leads and assign them to departments
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Team Lead
          </Button>
        </div>

        {showForm && (
          <Card className="mb-8 border-0 shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-700 text-white rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white text-2xl">Add New Team Lead</CardTitle>
                  <CardDescription className="text-blue-100">
                    Create a new team lead account and assign to department
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetForm}
                  className="h-8 w-8 text-white hover:bg-white/20"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="firstName" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                      First Name *
                    </Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="lastName" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                      Last Name *
                    </Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="email" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="teamlead@company.com"
                    className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="password" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                      Password *
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                      Confirm Password *
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="Re-enter password"
                      className="focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="depId" className="text-gray-700 font-semibold text-sm uppercase tracking-wide">
                    Assign Department *
                  </Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <select
                      id="depId"
                      value={formData.depId}
                      onChange={(e) => setFormData({ ...formData, depId: e.target.value })}
                      className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-white transition-all duration-200 shadow-sm appearance-none text-black"
                      required
                    >
                      <option value="" className="text-gray-500">Select a department</option>
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept._id} className="text-black">
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-8 py-2.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Team Lead"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-6 py-2.5 transition-all duration-200 shadow-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-2xl shadow-blue-500/10 border-0 bg-gradient-to-br from-white to-blue-50/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-white to-blue-50 border-b border-blue-100/50">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Team Leads
                </CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {teamLeads.length} team lead{teamLeads.length !== 1 ? 's' : ''} in your organization
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by name, email, department..."
                  className="pl-10 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 shadow-sm h-11 text-base"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {fetching ? (
              <div className="flex justify-center items-center py-16">
                <div className="flex items-center gap-3 text-gray-600">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-lg">Loading team leads...</span>
                </div>
              </div>
            ) : filteredTeamLeads.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-gray-300 mb-4">
                  <Users className="w-20 h-20 mx-auto" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {teamLeads.length === 0 ? "No team leads yet" : "No matches found"}
                </h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto mb-6">
                  {teamLeads.length === 0
                    ? "Get started by adding your first team lead to manage departments."
                    : "Try adjusting your search terms to find what you're looking for."
                  }
                </p>
                {teamLeads.length === 0 && (
                  <Button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-600/30 transition-all duration-300 transform hover:scale-105 px-8 py-2.5"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Add First Team Lead
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Team Lead</TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Employee ID</TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Department</TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Contact</TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Join Date</TableHead>
                      <TableHead className="font-bold text-gray-900 text-sm uppercase tracking-wide py-4">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeamLeads.map((lead, index) => (
                      <TableRow
                        key={lead._id}
                        className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-300 border-b border-gray-100/50"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <Avatar className="border-2 border-white shadow-lg shadow-blue-500/20 group-hover:shadow-xl group-hover:shadow-blue-600/30 transition-all duration-300">
                              <AvatarImage src={lead.profilePic} alt={`${lead.firstName} ${lead.lastName}`} />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold">
                                {lead.firstName?.[0]}{lead.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200">
                                {lead.firstName} {lead.lastName}
                              </div>
                              <div className="text-sm text-gray-500 font-medium">Team Lead</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-mono text-sm px-3 py-1.5 shadow-lg shadow-purple-500/20">
                            <User className="w-3 h-3 mr-2" />
                            {lead.userId}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 font-medium px-3 py-1.5 shadow-lg shadow-green-500/20">
                            <Building className="w-3 h-3 mr-2" />
                            {lead.depId?.name || "No Department"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3 text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
                            <Mail className="w-5 h-5 text-blue-500" />
                            <span className="text-base font-medium">{lead.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3 text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
                            <Calendar className="w-5 h-5 text-purple-500" />
                            <span className="text-base font-medium">{formatDate(lead.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4 text-black" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white text-black">
                              <DropdownMenuItem onClick={() => handleView(lead)} className="text-black cursor-pointer">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(lead)} className="text-black cursor-pointer">
                                <Pencil className="w-4 h-4 mr-2" />
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-xl text-black">Edit Team Lead</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update team lead information and schedule
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName" className="text-black">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editFormData.firstName}
                  onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                  className="text-black"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName" className="text-black">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editFormData.lastName}
                  onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                  className="text-black"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPhone" className="text-black">Phone</Label>
              <Input
                id="editPhone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="text-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editAddress" className="text-black">Address</Label>
              <Input
                id="editAddress"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="Enter address"
                className="text-black"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDepId" className="text-black">
                <Building className="w-4 h-4 inline mr-2" />
                Department
              </Label>
              <Select value={editFormData.depId} onValueChange={(value) => setEditFormData({ ...editFormData, depId: value })}>
                <SelectTrigger className="text-black">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent className="bg-white text-black">
                  {departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id} className="text-black">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartTime" className="text-black">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Start Time
                </Label>
                <Select value={editFormData.startTime} onValueChange={(value) => setEditFormData({ ...editFormData, startTime: value })}>
                  <SelectTrigger className="text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time} className="text-black">
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndTime" className="text-black">
                  <Clock className="w-4 h-4 inline mr-2" />
                  End Time
                </Label>
                <Select value={editFormData.endTime} onValueChange={(value) => setEditFormData({ ...editFormData, endTime: value })}>
                  <SelectTrigger className="text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {timeOptions.map((time) => (
                      <SelectItem key={time} value={time} className="text-black">
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Team Lead
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loading}
                className="text-black border-gray-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-white text-black">
          <DialogHeader>
            <DialogTitle className="text-xl text-black">Team Lead Details</DialogTitle>
          </DialogHeader>
          
          {selectedTeamLead && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-20 h-20 border-4 border-blue-100">
                  <AvatarImage src={selectedTeamLead.profilePic} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold">
                    {selectedTeamLead.firstName?.[0]}{selectedTeamLead.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-black">
                    {selectedTeamLead.firstName} {selectedTeamLead.lastName}
                  </h2>
                  <p className="text-gray-600">Team Lead</p>
                  <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                    <User className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Basic Information
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-mono font-bold text-black">{selectedTeamLead.userId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Join Date:</span>
                        <span className="font-medium text-black">{formatDate(selectedTeamLead.createdAt)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white">
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Department
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <Badge className="bg-green-100 text-green-800">
                          {selectedTeamLead.depId?.name || "No Department"}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Manager ID:</span>
                        <span className="font-medium text-black">{selectedTeamLead.managerId ? "Assigned" : "Not Assigned"}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-black mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-black">{selectedTeamLead.email}</span>
                    </div>
                    {selectedTeamLead.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-black">{selectedTeamLead.phone}</span>
                      </div>
                    )}
                    {selectedTeamLead.address && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-black">{selectedTeamLead.address}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-black mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 " />
                    Work Schedule
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-gray-600">Start Time</div>
                      <div className="font-bold text-blue-700">{selectedTeamLead.startTime || "09:00 AM"}</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-gray-600">End Time</div>
                      <div className="font-bold text-purple-700">{selectedTeamLead.endTime || "05:00 PM"}</div>
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