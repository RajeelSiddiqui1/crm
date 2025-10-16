"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Search, Mail, Calendar } from "lucide-react";
import axios from "axios";

export default function TeamLeadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teamLeads, setTeamLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    depId: "",
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
    if (!session?.user?.userId) return;
    
    try {
      setFetching(true);
      const response = await axios.get(`/api/manager/teamlead?managerId=${session.user.userId}`);
      if (response.status === 200) {
        setTeamLeads(response.data.teamLeads || []);
      }
    } catch (error) {
      console.error("Error fetching team leads:", error);
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
    
    if (!session?.user?.userId) {
      toast.error("Manager ID not found");
      return;
    }

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
        ...formData,
        managerId: session.user.userId,
      };
      delete submitData.confirmPassword;

      const response = await axios.post("/api/manager/teamlead", submitData);

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

  const filteredTeamLeads = teamLeads.filter(lead =>
    lead.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lead.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || session.user.role !== "Manager") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Toaster position="top-right" />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Leads</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your team leads and their departments
            </p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Team Lead
          </Button>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Team Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="depId">Department</Label>
                  <select
                    id="depId"
                    value={formData.depId}
                    onChange={(e) => setFormData({ ...formData, depId: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-700"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? "Creating..." : "Create Team Lead"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Team Leads List</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team leads..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {fetching ? (
              <div className="text-center py-8">Loading team leads...</div>
            ) : filteredTeamLeads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {teamLeads.length === 0 ? "No team leads found" : "No matching team leads found"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team Lead</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeamLeads.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={lead.profilePic} />
                            <AvatarFallback>
                              {lead.firstName?.[0]}{lead.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {lead.firstName} {lead.lastName}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{lead.userId}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge>
                          {lead.depId?.name || "No Department"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {lead.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(lead.createdAt)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}