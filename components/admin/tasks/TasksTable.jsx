// components/tasks/TasksTable.jsx
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
import { Card, CardContent } from "@/components/ui/card";
import {
  Eye,
  Pencil,
  MoreVertical,
  Trash2,
  FileText,
  AudioLines,
  Calendar,
} from "lucide-react";
import { Loader2 } from "lucide-react";

export default function TasksTable({
  tasks,
  fetching,
  onView,
  onEdit,
  onDelete,
}) {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getManagerDisplayName = (manager) => {
    if (!manager) return "Unknown";
    const fullName = `${manager.firstName || ""} ${manager.lastName || ""}`.trim();
    return fullName || "Unknown Manager";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
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
              Client
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Priority
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Assigned To
            </TableHead>
            <TableHead className="font-bold text-gray-900 text-sm uppercase py-4 px-6">
              Due Date
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
                    <div className="flex items-center gap-2 mt-2">
                      {task.audioFiles?.length > 0 && (
                        <Badge variant="outline" className="text-xs bg-gray-800 text-white border-gray-700 px-2 py-1">
                          <AudioLines className="w-3 h-3 mr-1" />
                          {task.audioFiles.length} audio
                        </Badge>
                      )}
                      {task.fileAttachments?.length > 0 && (
                        <Badge variant="outline" className="text-xs border-blue-300 text-blue-700 bg-blue-50 px-2 py-1">
                          <FileText className="w-3 h-3 mr-1" />
                          {task.fileAttachments.length} files
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="text-base text-gray-700 font-medium">
                  {task.clientName || "No client"}
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <Badge
                  className={`${getPriorityColor(task.priority)} text-sm font-semibold capitalize px-3 py-1.5 rounded-lg border`}
                >
                  {task.priority}
                </Badge>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex flex-wrap gap-2">
                  {task.managers?.slice(0, 3).map((manager) => (
                    <Badge
                      key={manager._id}
                      variant="outline"
                      className="text-xs flex items-center gap-2 bg-white text-gray-700 border-gray-300 px-3 py-1.5"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-[10px]">
                          {getManagerDisplayName(manager)
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">
                        {getManagerDisplayName(manager).split(" ")[0]}
                      </span>
                    </Badge>
                  ))}
                  {task.managers?.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5">
                      +{task.managers.length - 3} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-semibold">
                    {formatDate(task.endDate)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
               <DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button
      variant="ghost"
      className="h-9 w-9 p-0 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      aria-label="Task options"
    >
      <MoreVertical className="h-5 w-5 text-gray-600" />
    </Button>
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="end"
    className="w-48 bg-white shadow-md rounded-lg border border-gray-200 p-1"
  >
    {/* View Details */}
    <DropdownMenuItem
      onClick={() => onView(task)}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
    >
      <Eye className="w-4 h-4 text-indigo-600" />
      View Details
    </DropdownMenuItem>

    {/* Edit Task */}
    <DropdownMenuItem
      onClick={() => onEdit(task)}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-yellow-50 hover:text-yellow-700 transition-colors"
    >
      <Pencil className="w-4 h-4 text-yellow-600" />
      Edit Task
    </DropdownMenuItem>

    {/* Delete Task */}
    <DropdownMenuItem
      onClick={() => onDelete(task._id)}
      className="flex items-center gap-2 px-3 py-2 rounded-md text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
    >
      <Trash2 className="w-4 h-4 text-red-600" />
      Delete
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>

              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}