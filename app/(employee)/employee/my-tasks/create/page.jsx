"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Users,
  Plus,
  X,
  AlertCircle,
  Loader2,
  Check,
  ChevronDown,
  ChevronUp,
  Briefcase,
} from "lucide-react";

export default function CreateTaskPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamLeads, setTeamLeads] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedTeamLeads, setSelectedTeamLeads] = useState([]);
  const [selectedManagers, setSelectedManagers] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [fetchingData, setFetchingData] = useState(true);
  const [showTeamLeadDropdown, setShowTeamLeadDropdown] = useState(false);
  const [showManagerDropdown, setShowManagerDropdown] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdowns = [
        'team-lead-dropdown',
        'manager-dropdown', 
        'employee-dropdown',
        'team-lead-selector',
        'manager-selector',
        'employee-selector'
      ];
      
      const clickedInside = dropdowns.some(className => 
        event.target.closest(`.${className}`)
      );
      
      if (!clickedInside) {
        setShowTeamLeadDropdown(false);
        setShowManagerDropdown(false);
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAllData = async () => {
    try {
      setFetchingData(true);
      
      // Sab data ek saath fetch karo
      const [teamLeadsRes, managersRes, employeesRes] = await Promise.all([
        axios.get("/api/employee/teamleads"),
        axios.get("/api/employee/managers"),
        axios.get("/api/employee/employees")
      ]);

      if (teamLeadsRes.data.success) {
        setTeamLeads(teamLeadsRes.data.employees || []);
      }

      if (managersRes.data.success) {
        setManagers(managersRes.data.employees || []);
      }

      if (employeesRes.status === 200) {
        setEmployees(employeesRes.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to load data. Please try again.");
    } finally {
      setFetchingData(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (start > end) {
        newErrors.endDate = "End date must be after start date";
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (end < today) {
        newErrors.endDate = "End date cannot be in the past";
      }
    }

    if (selectedTeamLeads.length === 0 && selectedManagers.length === 0 && selectedEmployees.length === 0) {
      newErrors.assignees = "Please assign at least one team lead, manager, or employee";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstError = Object.keys(errors)[0];
      if (firstError) {
        document.querySelector(`[name="${firstError}"]`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        assignedTeamLead: selectedTeamLeads.map((tl) => tl._id),
        assignedManager: selectedManagers.map((mgr) => mgr._id),
        assignedEmployee: selectedEmployees.map((emp) => emp._id),
      };

      const response = await axios.post("/api/employee/assigned-subtasks", payload);

      if (response.status === 201) {
        alert("Task created successfully!");
        router.push("/employee/my-tasks");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert(error.response?.data?.error || error.response?.data?.message || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Team Lead Functions
  const addTeamLead = (teamLead) => {
    if (!selectedTeamLeads.find((tl) => tl._id === teamLead._id)) {
      setSelectedTeamLeads([...selectedTeamLeads, teamLead]);
    }
  };

  const removeTeamLead = (teamLeadId) => {
    setSelectedTeamLeads(selectedTeamLeads.filter((tl) => tl._id !== teamLeadId));
    if (errors.assignees) {
      setErrors(prev => ({ ...prev, assignees: "" }));
    }
  };

  // Manager Functions
  const addManager = (manager) => {
    if (!selectedManagers.find((mgr) => mgr._id === manager._id)) {
      setSelectedManagers([...selectedManagers, manager]);
    }
  };

  const removeManager = (managerId) => {
    setSelectedManagers(selectedManagers.filter((mgr) => mgr._id !== managerId));
    if (errors.assignees) {
      setErrors(prev => ({ ...prev, assignees: "" }));
    }
  };

  // Employee Functions
  const addEmployee = (employee) => {
    if (!selectedEmployees.find((emp) => emp._id === employee._id)) {
      setSelectedEmployees([...selectedEmployees, employee]);
    }
  };

  const removeEmployee = (employeeId) => {
    setSelectedEmployees(selectedEmployees.filter((emp) => emp._id !== employeeId));
    if (errors.assignees) {
      setErrors(prev => ({ ...prev, assignees: "" }));
    }
  };

  // Already selected members ko filter out karo
  const availableTeamLeads = teamLeads.filter(tl => 
    !selectedTeamLeads.find(selected => selected._id === tl._id)
  );

  const availableManagers = managers.filter(mgr => 
    !selectedManagers.find(selected => selected._id === mgr._id)
  );

  const availableEmployees = employees.filter(emp => 
    !selectedEmployees.find(selected => selected._id === emp._id)
  );

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    setFormData(prev => ({
      ...prev,
      startDate: prev.startDate || today,
      endDate: prev.endDate || nextWeekStr
    }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/employee/my-tasks")}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 group transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Tasks</span>
          </button>
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Create New Task
                </h1>
                <p className="text-gray-600">
                  Fill in the details and assign to team members
                </p>
              </div>
              <div className="hidden md:flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Task Details Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                  Task Details
                </h2>
                <p className="text-gray-500 text-sm mt-1">Provide basic information about the task</p>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
  type="text"
  name="title"
  value={formData.title}
  onChange={handleInputChange}
  placeholder="Enter task title"
  className={`w-full px-4 py-3 bg-gray-50 border ${
    errors.title ? "border-red-300" : "border-gray-200"
  } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900`}
/>

                {errors.title && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{errors.title}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Describe the task in detail..."
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.description ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-gray-900`}
                />
                <div className="flex justify-between mt-1">
                  {errors.description ? (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.description}</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">
                      Be as detailed as possible to ensure clarity
                    </p>
                  )}
                  <span className="text-gray-400 text-sm">
                    {formData.description.length}/500
                  </span>
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.startDate ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900`}
                  />
                  {errors.startDate && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.startDate}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate}
                    className={`w-full px-4 py-3 bg-gray-50 border ${
                      errors.endDate ? "border-red-300" : "border-gray-200"
                    } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900`}
                  />
                  {errors.endDate && (
                    <div className="mt-2 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-sm">{errors.endDate}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    Start Time (Optional)
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline-block w-4 h-4 mr-2 text-blue-600" />
                    End Time (Optional)
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900"
                  />
                </div>
              </div>
            </div>

            {/* Assign Team Leads Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-green-600 rounded-full"></div>
                  Assign Team Leads
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Department Specific
                  </span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Team leads from your department</p>
              </div>

              <div className="space-y-4">
                {/* Selected Team Leads */}
                {selectedTeamLeads.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Team Leads ({selectedTeamLeads.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTeamLeads.map((tl) => (
                        <div
                          key={tl._id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 rounded-xl shadow-sm"
                        >
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="font-medium">
                            {tl.firstName} {tl.lastName}
                          </span>
                          {tl.depId && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              {tl.depId.name}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeTeamLead(tl._id)}
                            className="ml-2 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Team Leads Dropdown Selector */}
                <div className="relative team-lead-selector">
                  <button
                    type="button"
                    onClick={() => setShowTeamLeadDropdown(!showTeamLeadDropdown)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-green-400 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Team Leads</p>
                        <p className="text-sm text-gray-500">
                          {availableTeamLeads.length} team leads available
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : showTeamLeadDropdown ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                    )}
                  </button>

                  {/* Team Leads Dropdown */}
                  {showTeamLeadDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto team-lead-dropdown">
                      {availableTeamLeads.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All team leads selected</p>
                          <p className="text-sm mt-1">No more team leads available</p>
                        </div>
                      ) : (
                        availableTeamLeads.map((tl) => (
                          <button
                            key={tl._id}
                            type="button"
                            onClick={() => addTeamLead(tl)}
                            className="w-full px-4 py-3 text-left hover:bg-green-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-green-800">
                                  {tl.firstName?.[0]}{tl.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {tl.firstName} {tl.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{tl.email}</p>
                                {tl.depId && (
                                  <p className="text-xs text-green-600 mt-0.5">
                                    Department: {tl.depId.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-green-600" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assign Managers Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-purple-600 rounded-full"></div>
                  Assign Managers
                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                    Multiple Departments
                  </span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Managers from any department</p>
              </div>

              <div className="space-y-4">
                {/* Selected Managers */}
                {selectedManagers.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Managers ({selectedManagers.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedManagers.map((mgr) => (
                        <div
                          key={mgr._id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 text-purple-800 rounded-xl shadow-sm"
                        >
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="font-medium">
                            {mgr.firstName} {mgr.lastName}
                          </span>
                          {Array.isArray(mgr.departments) && mgr.departments.length > 0 && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              {mgr.departments.slice(0, 2).map(d => d.name).join(', ')}
                              {mgr.departments.length > 2 && '...'}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeManager(mgr._id)}
                            className="ml-2 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Managers Dropdown Selector */}
                <div className="relative manager-selector">
                  <button
                    type="button"
                    onClick={() => setShowManagerDropdown(!showManagerDropdown)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-purple-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Managers</p>
                        <p className="text-sm text-gray-500">
                          {availableManagers.length} managers available
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : showManagerDropdown ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                    )}
                  </button>

                  {/* Managers Dropdown */}
                  {showManagerDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto manager-dropdown">
                      {availableManagers.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All managers selected</p>
                          <p className="text-sm mt-1">No more managers available</p>
                        </div>
                      ) : (
                        availableManagers.map((mgr) => (
                          <button
                            key={mgr._id}
                            type="button"
                            onClick={() => addManager(mgr)}
                            className="w-full px-4 py-3 text-left hover:bg-purple-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-violet-100 border border-purple-200 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-purple-800">
                                  {mgr.firstName?.[0]}{mgr.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {mgr.firstName} {mgr.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{mgr.email}</p>
                                {Array.isArray(mgr.departments) && mgr.departments.length > 0 && (
                                  <p className="text-xs text-purple-600 mt-0.5">
                                    Departments: {mgr.departments.map(d => d.name).join(', ')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-purple-600" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assign Employees Section */}
            <div className="space-y-6">
              <div className="pb-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-amber-600 rounded-full"></div>
                  Assign Employees
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                    All Departments
                  </span>
                </h2>
                <p className="text-gray-500 text-sm mt-1">Regular employees from any department</p>
              </div>

              <div className="space-y-4">
                {/* Selected Employees */}
                {selectedEmployees.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-700">
                      Selected Employees ({selectedEmployees.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedEmployees.map((emp) => (
                        <div
                          key={emp._id}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-800 rounded-xl shadow-sm"
                        >
                          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                          <span className="font-medium">
                            {emp.firstName} {emp.lastName}
                          </span>
                          {emp.depId && (
                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                              {emp.depId.name}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeEmployee(emp._id)}
                            className="ml-2 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Employees Dropdown Selector */}
                <div className="relative employee-selector">
                  <button
                    type="button"
                    onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
                    className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl hover:border-amber-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Select Employees</p>
                        <p className="text-sm text-gray-500">
                          {availableEmployees.length} employees available
                        </p>
                      </div>
                    </div>
                    {fetchingData ? (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    ) : showEmployeeDropdown ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-amber-600 transition-colors" />
                    )}
                  </button>

                  {/* Employees Dropdown */}
                  {showEmployeeDropdown && (
                    <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto employee-dropdown">
                      {availableEmployees.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                          <p className="font-medium">All employees selected</p>
                          <p className="text-sm mt-1">No more employees available</p>
                        </div>
                      ) : (
                        availableEmployees.map((emp) => (
                          <button
                            key={emp._id}
                            type="button"
                            onClick={() => addEmployee(emp)}
                            className="w-full px-4 py-3 text-left hover:bg-amber-50 flex items-center justify-between border-b border-gray-100 last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 rounded-full flex items-center justify-center">
                                <span className="font-semibold text-amber-800">
                                  {emp.firstName?.[0]}{emp.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">
                                  {emp.firstName} {emp.lastName}
                                </p>
                                <p className="text-sm text-gray-500">{emp.email}</p>
                                {emp.depId && (
                                  <p className="text-xs text-amber-600 mt-0.5">
                                    Department: {emp.depId.name}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Plus className="w-5 h-5 text-amber-600" />
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Assignees Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Assignees Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Team Leads</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <p className="font-semibold text-gray-900">
                          {selectedTeamLeads.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {teamLeads.length} total
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Managers</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <p className="font-semibold text-gray-900">
                          {selectedManagers.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {managers.length} total
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Employees</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <p className="font-semibold text-gray-900">
                          {selectedEmployees.length}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {employees.length} total
                    </div>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Total Assignees</p>
                  <p className="font-semibold text-gray-900 text-2xl mt-2">
                    {selectedTeamLeads.length + selectedManagers.length + selectedEmployees.length}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    across {new Set([
                      ...selectedTeamLeads.map(tl => tl.depId?._id),
                      ...selectedManagers.flatMap(mgr => mgr.departments?.map(d => d._id)),
                      ...selectedEmployees.map(emp => emp.depId?._id)
                    ].filter(Boolean)).size} departments
                  </p>
                </div>
              </div>
              
              {errors.assignees && (
                <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{errors.assignees}</span>
                </div>
              )}
            </div>

            {/* Task Duration Summary */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5" />
                Task Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Not set'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    }) : 'Not set'}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formData.startDate && formData.endDate ? 
                      `${Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24))} days` : 
                      'Not set'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => router.push("/employee/my-tasks")}
                  className="px-8 py-3.5 text-gray-700 hover:bg-gray-100 border-2 border-gray-200 rounded-xl font-semibold transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || fetchingData}
                  className="flex-1 px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Task...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Create Task
                    </>
                  )}
                </button>
              </div>
              <p className="text-center text-gray-500 text-sm mt-4">
                Task will be visible to all assigned members
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Briefcase className="w-4 h-4" />
            You can assign tasks to team leads, managers, and employees
          </p>
        </div>
      </div>
    </div>
  );
}