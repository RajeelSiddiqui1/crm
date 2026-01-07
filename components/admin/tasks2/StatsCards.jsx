// components/tasks2/StatsCards.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Building, Volume2, Target, Clock } from "lucide-react";

export default function StatsCards({ tasks, teamLeads, employees }) {
  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: FileText,
      color: "blue",
      description: "All created tasks"
    },
    {
      title: "Team Leads",
      value: teamLeads.length,
      icon: Users,
      color: "purple",
      description: "Active team leads"
    },
    {
      title: "Employees",
      value: employees.length,
      icon: Users,
      color: "green",
      description: "Active employees"
    },
    {
      title: "Files Uploaded",
      value: tasks.reduce((acc, task) => acc + (task.fileAttachments?.length || 0), 0),
      icon: FileText,
      color: "orange",
      description: "Total files"
    },
    {
      title: "Audio Recordings",
      value: tasks.reduce((acc, task) => acc + (task.audioFiles?.length || 0), 0),
      icon: Volume2,
      color: "pink",
      description: "Total audio files"
    },
    {
      title: "Avg Completion",
      value: tasks.length > 0 
        ? `${Math.round(tasks.reduce((acc, task) => acc + (task.stats?.completionPercentage || 0), 0) / tasks.length)}%`
        : "0%",
      icon: Target,
      color: "teal",
      description: "Average completion rate"
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "blue": return "bg-blue-100 text-blue-600";
      case "purple": return "bg-purple-100 text-purple-600";
      case "green": return "bg-green-100 text-green-600";
      case "orange": return "bg-orange-100 text-orange-600";
      case "pink": return "bg-pink-100 text-pink-600";
      case "teal": return "bg-teal-100 text-teal-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(stat.color)}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}