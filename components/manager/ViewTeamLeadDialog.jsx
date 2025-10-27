// components/ViewTeamLeadDialog.jsx
"use client";
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Phone, Mail, Calendar, Clock, Building, User, IdCard } from "lucide-react";

export function ViewTeamLeadDialog({ open, onOpenChange, teamLead }) {
  if (!teamLead) return null;

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Team Lead Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile Header */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-blue-100">
              <AvatarImage src={teamLead.profilePic} />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-2xl font-bold">
                {teamLead.firstName?.[0]}{teamLead.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {teamLead.firstName} {teamLead.lastName}
              </h2>
              <p className="text-gray-600">Team Lead</p>
              <Badge className="mt-2 bg-blue-100 text-blue-800 hover:bg-blue-100">
                <User className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Basic Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <IdCard className="w-4 h-4" />
                  Basic Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Employee ID:</span>
                    <span className="font-mono font-bold">{teamLead.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Join Date:</span>
                    <span className="font-medium">{formatDate(teamLead.createdAt)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Department Information */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Department
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Department:</span>
                    <Badge className="bg-green-100 text-green-800">
                      {teamLead.depId?.name || "No Department"}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manager ID:</span>
                    <span className="font-medium">{teamLead.managerId ? "Assigned" : "Not Assigned"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{teamLead.email}</span>
                </div>
                {teamLead.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{teamLead.phone}</span>
                  </div>
                )}
                {teamLead.address && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{teamLead.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Work Schedule
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-gray-600">Start Time</div>
                  <div className="font-bold text-blue-700">{teamLead.startTime || "09:00 AM"}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-gray-600">End Time</div>
                  <div className="font-bold text-purple-700">{teamLead.endTime || "05:00 PM"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}