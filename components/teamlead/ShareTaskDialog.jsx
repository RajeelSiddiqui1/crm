"use client";

import { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Users,
  UserPlus,
  UserMinus,
  Share2,
  X,
  Check,
  Building,
  Loader2,
  AlertCircle,
  Filter,
  RefreshCw,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

export default function ShareTaskDialog({
  taskId,
  taskTitle,
  open,
  onOpenChange,
  onSuccess,
}) {
  const [teamLeads, setTeamLeads] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);
  const [sharedTeamLeads, setSharedTeamLeads] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [sharedBy, setSharedBy] = useState(null);
  const [sharedCount, setSharedCount] = useState(0);
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [error, setError] = useState(null);
  const [canRemoveOthers, setCanRemoveOthers] = useState(false);
  const [isOriginalSharer, setIsOriginalSharer] = useState(false);

  useEffect(() => {
    if (open && taskId) {
      fetchShareData();
    }
  }, [open, taskId]);

  const fetchShareData = async () => {
    try {
      setFetching(true);
      setError(null);

      // Fetch current sharing details
      const shareResponse = await axios.get(
        `/api/teamlead/tasks/share/${taskId}`
      );

      if (shareResponse.status === 200) {
        setSharedTeamLeads(shareResponse.data.task.sharedTeamLeads || []);
        setSharedBy(shareResponse.data.task.sharedBy);
        setSharedCount(shareResponse.data.task.sharedCount || 0);
        setCanRemoveOthers(shareResponse.data.task.canRemoveOthers || false);
        setIsOriginalSharer(shareResponse.data.task.isOriginalSharer || false);

        // Fetch available team leads (excluding already shared)
        const listResponse = await axios.get(
          `/api/teamlead/teamlead-list?taskId=${taskId}`
        );

        if (listResponse.status === 200) {
          setTeamLeads(listResponse.data.teamLeads || []);
        }
      }
    } catch (error) {
      console.error("Error fetching share data:", error);

      if (error.response?.status === 401) {
        setError("Please login again to continue");
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        setError("You don't have access to share this task");
        toast.error("Access denied");
      } else if (error.response?.status === 404) {
        setError("Task not found");
        toast.error("Task not found");
      } else {
        setError("Failed to load sharing data");
        toast.error("Failed to load team leads");
      }
    } finally {
      setFetching(false);
    }
  };

  const handleShare = async () => {
    if (selectedTeamLeads.length === 0) {
      toast.error("Please select at least one team lead");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`/api/teamlead/tasks/share/${taskId}`, {
        teamLeadIds: selectedTeamLeads,
      });

      if (response.status === 200) {
        toast.success(response.data.message);
        setSelectedTeamLeads([]);
        setSharedTeamLeads(response.data.task.multipleTeamLeadShared || []);
        setSharedCount(response.data.task.sharedTasksCount || 0);
        setCanRemoveOthers(true); // After sharing, user can remove

        // Refresh available team leads list
        const listResponse = await axios.get(
          `/api/teamlead/teamlead-list?taskId=${taskId}`
        );
        if (listResponse.status === 200) {
          setTeamLeads(listResponse.data.teamLeads || []);
        }

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error sharing task:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to share this task");
      } else if (error.response?.status === 400) {
        toast.error(error.response.data.error || "Invalid request");
      } else {
        toast.error("Failed to share task");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTeamLead = async (teamLeadId, teamLeadName) => {
    if (
      !window.confirm(
        `Are you sure you want to remove ${teamLeadName} from shared access?`
      )
    ) {
      return;
    }

    setRemoving(true);
    try {
      const response = await axios.post(`/api/teamlead/tasks/share/${taskId}`, {
        removeTeamLeadId: teamLeadId,
      });

      if (response.status === 200) {
        toast.success(response.data.message);

        // Update shared team leads list
        setSharedTeamLeads(response.data.task.multipleTeamLeadShared || []);
        setSharedCount(response.data.task.sharedTasksCount || 0);
        setSharedBy(response.data.task.sharedBy);

        // Refresh available team leads list
        const listResponse = await axios.get(
          `/api/teamlead/teamlead-list?taskId=${taskId}`
        );
        if (listResponse.status === 200) {
          setTeamLeads(listResponse.data.teamLeads || []);
        }

        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error removing team lead:", error);

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
      } else if (error.response?.status === 403) {
        toast.error("You don't have permission to remove team leads");
      } else if (error.response?.status === 404) {
        toast.error("Team lead not found in shared list");
      } else {
        toast.error("Failed to remove team lead");
      }
    } finally {
      setRemoving(false);
    }
  };

  const getFilteredTeamLeads = () => {
    let filtered = teamLeads.filter(
      (tl) =>
        !sharedTeamLeads.some((shared) => shared._id === tl._id) &&
        (tl.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tl.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tl.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tl.depId?.name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))
    );

    // Apply department filter
    if (filterDepartment !== "all") {
      filtered = filtered.filter((tl) => tl.depId?.name === filterDepartment);
    }

    return filtered;
  };

  const toggleTeamLeadSelection = (teamLeadId) => {
    if (selectedTeamLeads.includes(teamLeadId)) {
      setSelectedTeamLeads(selectedTeamLeads.filter((id) => id !== teamLeadId));
    } else {
      setSelectedTeamLeads([...selectedTeamLeads, teamLeadId]);
    }
  };

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  // Get unique departments for filter
  const getUniqueDepartments = () => {
    const departments = teamLeads
      .map((tl) => tl.depId?.name)
      .filter(Boolean)
      .filter((value, index, self) => self.indexOf(value) === index);
    return ["all", ...departments];
  };

  // Reset dialog when closed
  const handleDialogClose = (open) => {
    if (!open) {
      setSelectedTeamLeads([]);
      setSearchTerm("");
      setFilterDepartment("all");
      setError(null);
    }
    onOpenChange(open);
  };

  const canRemoveTeamLead = (teamLeadId) => {
    // Can't remove yourself if you're not the original sharer
    if (teamLeadId === sharedBy?._id && !isOriginalSharer) {
      return false;
    }

    // Can remove others if:
    // 1. You're the original sharer, OR
    // 2. You're an assigned team lead and not removing yourself
    return (
      canRemoveOthers && (isOriginalSharer || teamLeadId !== sharedBy?._id)
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col bg-white text-gray-900">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Share2 className="w-5 h-5 text-blue-600" />
            Share Task with Team Leads
          </DialogTitle>
          <DialogDescription>
            Share "{taskTitle}" with other team leads. Already shared team leads
            will not appear in the available list.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error Loading Data
            </h3>
            <p className="text-gray-600 text-center mb-4">{error}</p>
            <Button onClick={fetchShareData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 py-2">
            {/* Currently Shared Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Already Shared ({sharedCount})
                  </Label>
                  {sharedCount > 0 && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-900 text-white"
                    >
                      These won't appear in available list
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {sharedBy && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-yellow-100 text-yellow-800"
                    >
                      <Shield className="w-3 h-3 mr-1" />
                      Shared by: {sharedBy.firstName} {sharedBy.lastName}
                    </Badge>
                  )}
                  {isOriginalSharer && (
                    <Badge className="bg-green-100 text-green-800 text-xs">
                      You are the sharer
                    </Badge>
                  )}
                </div>
              </div>

              {sharedTeamLeads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {sharedTeamLeads.map((teamLead) => {
                    const isSharer = teamLead._id === sharedBy?._id;
                    const canRemove = canRemoveTeamLead(teamLead._id);

                    return (
                      <div
                        key={teamLead._id}
                        className={`border rounded-lg p-3 flex items-center justify-between transition-colors ${
                          isSharer
                            ? "bg-blue-50 border-blue-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="w-8 h-8">
                            {/* Image */}
                            {teamLead.profilePic && (
                              <AvatarImage
                                src={teamLead.profilePic}
                                alt={`${teamLead.firstName} ${teamLead.lastName}`}
                                className="object-cover"
                              />
                            )}

                            {/* Fallback */}
                            <AvatarFallback
                              className={`${
                                isSharer
                                  ? "bg-gradient-to-r from-blue-500 to-blue-600"
                                  : "bg-gradient-to-r from-gray-500 to-gray-600"
                              } text-white text-xs`}
                            >
                              {getInitials(
                                teamLead.firstName,
                                teamLead.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">
                                {teamLead.firstName} {teamLead.lastName}
                              </p>
                              {isSharer && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-blue-100 text-blue-700"
                                >
                                  Sharer
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 truncate max-w-[150px]">
                              {teamLead.email}
                            </p>
                            {teamLead.depId?.name && (
                              <div className="flex items-center gap-1 mt-1">
                                <Building className="w-3 h-3 text-gray-400" />
                                <Badge className="text-xs bg-green-900 text-white">
                                  {teamLead.depId.name}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Remove Button */}
                        {canRemove && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handleRemoveTeamLead(
                                teamLead._id,
                                `${teamLead.firstName} ${teamLead.lastName}`
                              )
                            }
                            disabled={removing}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Remove access"
                          >
                            {removing ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UserMinus className="w-4 h-4" />
                            )}
                          </Button>
                        )}

                        {/* Info if cannot remove */}
                        {!canRemove && isSharer && (
                          <Badge
                            variant="outline"
                            className="text-xs text-gray-500"
                          >
                            Can't remove sharer
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No team leads shared yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Share this task to collaborate with other team leads
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Add New Team Leads Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Add New Team Leads
                  {teamLeads.length > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs bg-orange-600 text-white">
                      {teamLeads.length} available
                    </Badge>
                  )}
                </Label>
                <p className="text-sm text-gray-600">
                  Select from team leads not already shared with this task
                </p>
              </div>

              {/* Search and Filter Bar */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search team leads..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {getUniqueDepartments().map((dept) => (
                      <option key={dept} value={dept}>
                        {dept === "all" ? "All Departments" : dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selected Team Leads */}
              {selectedTeamLeads.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">
                    Selected ({selectedTeamLeads.length})
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedTeamLeads.map((tlId) => {
                      const tl = teamLeads.find((t) => t._id === tlId);
                      if (!tl) return null;

                      return (
                        <Badge
                          key={tlId}
                          className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-3 py-1.5 flex items-center gap-2"
                        >
                          <span>
                            {tl.firstName} {tl.lastName}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 ml-1 hover:bg-blue-600 p-0"
                            onClick={() => toggleTeamLeadSelection(tlId)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Team Leads List */}
              {fetching ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : getFilteredTeamLeads().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[250px] overflow-y-auto p-1">
                  {getFilteredTeamLeads().map((teamLead) => (
                    <div
                      key={teamLead._id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        selectedTeamLeads.includes(teamLead._id)
                          ? "border-blue-500 bg-blue-50 ring-1 ring-blue-200"
                          : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                      }`}
                      onClick={() => toggleTeamLeadSelection(teamLead._id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                           <Avatar className="w-8 h-8">
                            {/* Image */}
                            {teamLead.profilePic && (
                              <AvatarImage
                                src={teamLead.profilePic}
                                alt={`${teamLead.firstName} ${teamLead.lastName}`}
                                className="object-cover"
                              />
                            )}

                            {/* Fallback */}
                            <AvatarFallback
                              className={`${
                                
                                  "bg-gradient-to-r from-blue-500 to-blue-600"
                              } text-white text-xs`}
                            >
                              {getInitials(
                                teamLead.firstName,
                                teamLead.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">
                              {teamLead.firstName} {teamLead.lastName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {teamLead.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {teamLead.depId?.name && (
                                <Badge variant="outline" className="text-xs bg-green-900 text-white">
                                  <Building className="w-2 h-2 mr-1" />
                                  {teamLead.depId.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {selectedTeamLeads.includes(teamLead._id) ? (
                          <Check className="w-5 h-5 text-blue-600" />
                        ) : (
                          <div className="w-5 h-5 border rounded border-gray-300" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  {teamLeads.length === 0 ? (
                    <>
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No team leads available to share
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        All team leads are already shared with this task
                      </p>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No team leads found matching your criteria
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterDepartment("all");
                        }}
                      >
                        Clear filters
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    How Sharing Works
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700">
                    <li>
                      • Team leads already shared won't appear in available list
                    </li>
                    <li>• Shared team leads can view and manage this task</li>
                    <li>• Assigned team leads can share and remove others</li>
                    <li>
                      • Original sharer can remove anyone except themselves
                    </li>
                    <li>
                      • Removed team leads will reappear in available list
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleDialogClose(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={loading || selectedTeamLeads.length === 0 || !!error}
            className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share with {selectedTeamLeads.length} Team Lead
                {selectedTeamLeads.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
