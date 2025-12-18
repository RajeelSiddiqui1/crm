"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  X,
  UserPlus,
  UserMinus,
  Search,
  Check,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function ShareTaskModal({ 
  submissionId, 
  isOpen, 
  onClose,
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [teamLeads, setTeamLeads] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sharedTeamLeads, setSharedTeamLeads] = useState([]);
  const [sharedBy, setSharedBy] = useState(null);
  const [submissionDetails, setSubmissionDetails] = useState(null);

  // Fetch team leads list
  const fetchTeamLeads = async () => {
    try {
      setFetching(true);
      const response = await axios.get("/api/teamlead/teamlead-list");
      
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

  // Fetch already shared team leads
  const fetchSharedTeamLeads = async () => {
    try {
      const response = await axios.get(`/api/teamlead/tasks/${submissionId}/task-shared`);
      
      if (response.status === 200) {
        setSharedTeamLeads(response.data.submission.multipleTeamLeadShared || []);
        setSharedBy(response.data.submission.sharedByTeamlead);
        setSubmissionDetails(response.data.submission);
      }
    } catch (error) {
      console.error("Error fetching shared team leads:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTeamLeads();
      fetchSharedTeamLeads();
      setSelectedTeamLeads([]);
    }
  }, [isOpen, submissionId]);

  // Filter team leads
  const filteredTeamLeads = teamLeads.filter(teamLead => {
    const matchesSearch = 
      teamLead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teamLead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teamLead.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Already shared team leads کو show نہ کریں
    const isAlreadyShared = sharedTeamLeads.some(
      shared => shared._id === teamLead._id
    );

    return matchesSearch && !isAlreadyShared;
  });

  const handleTeamLeadToggle = (teamLeadId) => {
    setSelectedTeamLeads(prev => {
      if (prev.includes(teamLeadId)) {
        return prev.filter(id => id !== teamLeadId);
      } else {
        return [...prev, teamLeadId];
      }
    });
  };

  const handleShareTask = async () => {
    if (selectedTeamLeads.length === 0) {
      toast.error("Please select at least one team lead");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `/api/teamlead/tasks/${submissionId}/task-shared`,
        { teamLeadIds: selectedTeamLeads }
      );

      if (response.status === 200) {
        toast.success(response.data.message);
        fetchSharedTeamLeads();
        setSelectedTeamLeads([]);
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error sharing task:", error);
      toast.error(error.response?.data?.error || "Failed to share task");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeamLead = async (teamLeadId) => {
    if (!confirm("Are you sure you want to remove this team lead from the task?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `/api/teamlead/tasks/${submissionId}/task-shared`,
        { data: { teamLeadId } }
      );

      if (response.status === 200) {
        toast.success(response.data.message);
        fetchSharedTeamLeads();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error removing team lead:", error);
      toast.error(error.response?.data?.error || "Failed to remove team lead");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Share Task with Team Leads
          </DialogTitle>
          <DialogDescription>
            {submissionDetails && (
              <div className="mt-2">
                <p className="font-medium">Task: {submissionDetails.title || submissionDetails.clientName}</p>
                <p className="text-sm text-gray-600">Status: {submissionDetails.status2}</p>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Already Shared Team Leads Section */}
          {sharedTeamLeads.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-600" />
                Already Shared With ({sharedTeamLeads.length})
              </h3>
              <div className="space-y-2">
                {sharedTeamLeads.map(teamLead => (
                  <div 
                    key={teamLead._id} 
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {teamLead.firstName[0]}{teamLead.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {teamLead.firstName} {teamLead.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{teamLead.email}</p>
                      </div>
                      {sharedBy?._id === teamLead._id && (
                        <Badge variant="outline" className="text-xs">
                          Shared By
                        </Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveTeamLead(teamLead._id)}
                      disabled={sharedBy?._id === teamLead._id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <UserMinus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share New Team Leads Section */}
          <div>
            <h3 className="text-sm font-medium mb-2">Share with New Team Leads</h3>
            
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search team leads..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Team Leads List */}
            {fetching ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading team leads...</p>
              </div>
            ) : filteredTeamLeads.length === 0 ? (
              <div className="text-center py-8 border rounded-lg">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600">
                  {searchTerm ? "No matching team leads found" : "No team leads available to share"}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                {filteredTeamLeads.map(teamLead => (
                  <div 
                    key={teamLead._id} 
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedTeamLeads.includes(teamLead._id)}
                        onCheckedChange={() => handleTeamLeadToggle(teamLead._id)}
                      />
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {teamLead.firstName[0]}{teamLead.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {teamLead.firstName} {teamLead.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {teamLead.email}
                        </p>
                        {teamLead.depId && (
                          <p className="text-xs text-gray-500">
                            Department: {teamLead.depId.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Team Lead
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Selected Count */}
            {selectedTeamLeads.length > 0 && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-700">
                  Selected {selectedTeamLeads.length} team lead(s) for sharing
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleShareTask} 
            disabled={selectedTeamLeads.length === 0 || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Sharing...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Share Task
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}