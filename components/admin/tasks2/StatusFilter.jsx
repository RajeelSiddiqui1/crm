// components/tasks2/StatusFilter.jsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Circle, TrendingUp, CheckCircle, AlertTriangle } from "lucide-react";

export default function StatusFilter({ activeTab, setActiveTab, tasks }) {
  const tabs = [
    {
      id: "all",
      label: "All Tasks",
      count: tasks.length,
      color: "gray"
    },
    {
      id: "pending",
      label: "Pending",
      count: tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.pending || 0), 0),
      icon: <Circle className="w-3 h-3" />,
      color: "yellow"
    },
    {
      id: "in_progress",
      label: "In Progress",
      count: tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.in_progress || 0), 0),
      icon: <TrendingUp className="w-3 h-3" />,
      color: "blue"
    },
    {
      id: "completed",
      label: "Completed",
      count: tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.completed || 0), 0),
      icon: <CheckCircle className="w-3 h-3" />,
      color: "green"
    },
    {
      id: "overdue",
      label: "Overdue",
      count: tasks.reduce((acc, task) => acc + (task.stats?.statusCounts.overdue || 0), 0),
      icon: <AlertTriangle className="w-3 h-3" />,
      color: "red"
    }
  ];

  const getButtonClasses = (tab) => {
    const baseClasses = "rounded-xl px-4 py-2 font-semibold transition-all duration-300 flex items-center gap-2";
    
    if (activeTab === tab.id) {
      const activeColors = {
        gray: "bg-gradient-to-r from-gray-600 to-gray-700 text-white",
        yellow: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white",
        blue: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white",
        green: "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
        red: "bg-gradient-to-r from-red-500 to-pink-500 text-white"
      };
      return `${baseClasses} ${activeColors[tab.color]} shadow-lg`;
    }
    
    return `${baseClasses} bg-white text-gray-800 border border-gray-200 hover:bg-gray-50`;
  };

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <Button
          key={tab.id}
          variant="outline"
          onClick={() => setActiveTab(tab.id)}
          className={getButtonClasses(tab)}
        >
          {tab.icon && tab.icon}
          {tab.label} ({tab.count})
        </Button>
      ))}
    </div>
  );
}