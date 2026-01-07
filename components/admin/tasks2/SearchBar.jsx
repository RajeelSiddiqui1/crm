// components/tasks2/SearchBar.jsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar({ searchTerm, setSearchTerm, placeholder }) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
      <Input
        placeholder={placeholder}
        className="pl-12 pr-4 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 h-12 text-base rounded-xl bg-white/80"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}