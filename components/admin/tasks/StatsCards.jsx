// components/tasks/StatsCards.jsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, Building, Volume2 } from "lucide-react";

export default function StatsCards({ tasks, managers }) {
  const stats = [
    {
      title: "Total Tasks",
      value: tasks.length,
      icon: FileText,
      color: "blue",
    },
    {
      title: "Active Managers",
      value: managers.length,
      icon: Users,
      color: "green",
    },
    {
      title: "Departments",
      value: Array.from(
        new Set(managers.flatMap((m) => m.departments?.map((d) => d.name) || []))
      ).length,
      icon: Building,
      color: "purple",
    },
    {
      title: "Tasks with Audio",
      value: tasks.filter((t) => t.audioFiles?.length > 0).length,
      icon: Volume2,
      color: "orange",
    },
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "green":
        return "bg-green-100 text-green-600";
      case "purple":
        return "bg-purple-100 text-purple-600";
      case "orange":
        return "bg-orange-100 text-orange-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
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