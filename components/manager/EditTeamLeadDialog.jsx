// components/EditTeamLeadDialog.jsx
"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building, Clock } from "lucide-react";
import { toast } from "sonner";

export function EditTeamLeadDialog({ open, onOpenChange, teamLead, departments, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    depId: "",
    startTime: "09:00 AM",
    endTime: "05:00 PM"
  });

  useEffect(() => {
    if (teamLead) {
      setFormData({
        firstName: teamLead.firstName || "",
        lastName: teamLead.lastName || "",
        phone: teamLead.phone || "",
        address: teamLead.address || "",
        depId: teamLead.depId?._id || teamLead.depId || "",
        startTime: teamLead.startTime || "09:00 AM",
        endTime: teamLead.endTime || "05:00 PM"
      });
    }
  }, [teamLead]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamLead) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/manager/teamlead/${teamLead._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Team Lead updated successfully!");
        onUpdate(data.teamLead);
        onOpenChange(false);
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

  const timeOptions = [
    "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM",
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
    "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
    "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Team Lead</DialogTitle>
          <DialogDescription>
            Update team lead information and schedule
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="depId">
              <Building className="w-4 h-4 inline mr-2" />
              Department
            </Label>
            <Select value={formData.depId} onValueChange={(value) => setFormData({ ...formData, depId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept._id} value={dept._id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">
                <Clock className="w-4 h-4 inline mr-2" />
                Start Time
              </Label>
              <Select value={formData.startTime} onValueChange={(value) => setFormData({ ...formData, startTime: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">
                <Clock className="w-4 h-4 inline mr-2" />
                End Time
              </Label>
              <Select value={formData.endTime} onValueChange={(value) => setFormData({ ...formData, endTime: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Team Lead
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}