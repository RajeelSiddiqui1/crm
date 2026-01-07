// components/tasks2/TasksTable.jsx
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Eye,
  Edit,
  MoreVertical,
  Trash2,
  FileText,
  AudioLines,
  Calendar,
  BarChart3,
  Users,
  User,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function TasksTable({
  tasks,
  fetching,
  onView,
  onEdit,
  onDelete,
  onStatus,
  teamLeads,
  employees,
}) {
  const getPriorityBadge = (priority) => {
    const colors = {
      high: "bg-gradient-to-r from-red-500 to-orange-500 text-white",
      medium: "bg-gradient-to-r from-yellow-500 to-amber-500 text-white",
      low: "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
    };

    return (
      <Badge className={`${colors[priority]} border-0 font-medium px-3 py-1 rounded-lg text-xs`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const getDisplayName = (item) => {
    if (!item) return "Unknown";
    return `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.email || "Unknown";
  };

  const getDepartmentName = (item) => {
    if (!item) return "No Department";
    if (item.depId) {
      return typeof item.depId === 'object' ? item.depId.name : "Department";
    }
    if (item.department) {
      return typeof item.department === 'object' ? item.department.name : item.department;
    }
    return "No Department";
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-lg font-medium">Loading tasks...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-300 mb-4">
          <FileText className="w-24 h-24 mx-auto" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          No tasks found
        </h3>
        <p className="text-gray-600 text-lg max-w-md mx-auto">
          Create your first task to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-gradient-to-r from-gray-50 to-blue-50/50">
          <TableRow className="hover:bg-transparent border-b border-gray-200/50">
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Task Details
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Status & Progress
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Assigned To
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Priority & Due Date
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Attachments
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <TableRow
              key={task._id}
              className="group hover:bg-gradient-to-r hover:from-blue-50/80 hover:to-purple-50/80 transition-all duration-300 border-b border-gray-100/50"
            >
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors duration-200 truncate">
                      {task.title}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 truncate">
                      {task.clientName || "No client"}
                    </div>
                    {task.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="py-4 px-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Progress</span>
                    <span className="text-xs font-bold">{task.stats?.completionPercentage || 0}%</span>
                  </div>
                  <Progress
                    value={task.stats?.completionPercentage || 0}
                    className={`h-2 ${getStatusColor(task.stats?.completionPercentage || 0)}`}
                  />
                  <div className="flex flex-wrap gap-1">
                    {task.stats?.statusCounts.pending > 0 && (
                      <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-300 px-2 py-0.5">
                        {task.stats.statusCounts.pending} Pending
                      </Badge>
                    )}
                    {task.stats?.statusCounts.in_progress > 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300 px-2 py-0.5">
                        {task.stats.statusCounts.in_progress} In Progress
                      </Badge>
                    )}
                  </div>
                </div>
              </TableCell>

              <TableCell className="py-4 px-6">
                <div className="space-y-1">
                  {/* Team Leads */}
                  {task.teamleads?.slice(0, 2).map((tl, idx) => {
                    const teamLeadDetail = teamLeads.find(t => t._id === tl.teamleadId?._id || t._id === tl.teamleadId);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-[10px]">
                            {getDisplayName(teamLeadDetail).split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {getDisplayName(teamLeadDetail)}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">Team Lead</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Employees */}
                  {task.employees?.slice(0, 2).map((emp, idx) => {
                    const employeeDetail = employees.find(e => e._id === emp.employeeId?._id || e._id === emp.employeeId);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px]">
                            {getDisplayName(employeeDetail).split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {getDisplayName(employeeDetail)}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">Employee</p>
                        </div>
                      </div>
                    );
                  })}
                  
                  {(task.teamleads?.length > 2 || task.employees?.length > 2) && (
                    <p className="text-xs text-gray-500">
                      +{Math.max(0, (task.teamleads?.length || 0) - 2) + Math.max(0, (task.employees?.length || 0) - 2)} more
                    </p>
                  )}
                </div>
              </TableCell>

              <TableCell className="py-4 px-6">
                <div className="space-y-3">
                  <div>
                    {getPriorityBadge(task.priority)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">
                      {task.endDate ? formatDate(task.endDate) : "No due date"}
                    </span>
                  </div>
                </div>
              </TableCell>

              <TableCell className="py-4 px-6">
                <div className="flex flex-wrap gap-2">
                  {task.stats?.totalFiles > 0 && (
                    <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50 px-2 py-1">
                      <FileText className="w-3 h-3 mr-1" />
                      {task.stats.totalFiles} files
                    </Badge>
                  )}
                  {task.stats?.totalAudio > 0 && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-300 px-2 py-1">
                      <AudioLines className="w-3 h-3 mr-1" />
                      {task.stats.totalAudio} audio
                    </Badge>
                  )}
                </div>
              </TableCell>

              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100">
                        <MoreVertical className="h-5 w-5 text-gray-600" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white text-gray-900 border border-gray-200 rounded-xl shadow-lg w-48">
                      <DropdownMenuItem onClick={() => onView(task)} className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                        <Eye className="w-4 h-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onStatus(task)} className="text-blue-600 cursor-pointer text-sm px-4 py-3 hover:bg-blue-50 rounded-lg flex items-center gap-3">
                        <BarChart3 className="w-4 h-4" />
                        View Status
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(task)} className="text-gray-700 cursor-pointer text-sm px-4 py-3 hover:bg-gray-50 rounded-lg flex items-center gap-3">
                        <Edit className="w-4 h-4" />
                        Edit Task
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-600 cursor-pointer text-sm px-4 py-3 hover:bg-red-50 rounded-lg flex items-center gap-3">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}