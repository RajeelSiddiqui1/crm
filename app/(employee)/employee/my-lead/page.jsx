"use client";

import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, 
  Flag, 
  User, 
  Clock, 
  FileText,
  ChevronRight,
  Building,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  Star,
  TrendingUp,
  BarChart3,
  DownloadCloud,
  Upload,
  MessageSquare,
  Edit,
  Trash2,
  MoreVertical,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EmployeeLeadsPage() {
  const [leads, setLeads] = useState([]);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    signed: 0,
    highPriority: 0,
    overdue: 0
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employee/my-lead');
      const data = await response.json();
      
      if (data.success) {
        setLeads(data.leads || []);
        setEmployee(data.employee);
        calculateStats(data.leads || []);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (leads) => {
    const now = new Date();
    const stats = {
      total: leads.length,
      pending: leads.filter(lead => lead.status === 'pending').length,
      signed: leads.filter(lead => lead.status === 'signed').length,
      highPriority: leads.filter(lead => lead.priority === 'high').length,
      overdue: leads.filter(lead => 
        lead.dueDate && new Date(lead.dueDate) < now
      ).length
    };
    setStats(stats);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'signed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'not_avaiable': return 'bg-orange-100 text-orange-800';
      case 'not_intrested': return 'bg-red-100 text-red-800';
      case 're_shedule': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'signed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'not_avaiable': return <XCircle className="w-4 h-4" />;
      case 'not_intrested': return <AlertCircle className="w-4 h-4" />;
      case 're_shedule': return <RefreshCw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.taskDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.formSubmission?.employeeId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.formSubmission?.employeeId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
    setShowLeadDetails(true);
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      const response = await fetch(`/api/employee/my-lead/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        fetchLeads();
        if (selectedLead?._id === leadId) {
          setSelectedLead({...selectedLead, status: newStatus});
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Leads</h1>
              <p className="text-gray-600 mt-2">
                Manage and track all your assigned leads in one place
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <button 
                onClick={fetchLeads}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              {employee && (
                <div className="flex items-center space-x-3 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 rounded-lg border">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{employee.designation}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Leads</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Signed</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">{stats.signed}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700 font-medium">Pending</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 font-medium">High Priority</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.highPriority}</p>
                </div>
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Overdue</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">{stats.overdue}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 border">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search leads by title, description, or client name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all text-gray-900">All Status</option>
                  <option value="pending text-gray-900">Pending</option>
                  <option value="signed text-gray-900">Signed</option>
                  <option value="not_avaiable text-gray-900">Not Available</option>
                  <option value="not_intrested text-gray-900">Not Interested</option>
                  <option value="re_shedule text-gray-900">Re-schedule</option>
                </select>

                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <button className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 flex items-center space-x-2 transition-all">
                  <Filter className="w-4 h-4" />
                  <span>Advanced Filters</span>
                </button>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-4 px-6 text-left">
                      <button className="flex items-center space-x-2 text-gray-700 font-semibold">
                        <span>Lead Title</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                 
                    <th className="py-4 px-6 text-left">
                      <button className="flex items-center space-x-2 text-gray-700 font-semibold">
                        <span>Priority</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button className="flex items-center space-x-2 text-gray-700 font-semibold">
                        <span>Status</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button className="flex items-center space-x-2 text-gray-700 font-semibold">
                        <span>Due Date</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left">
                      <button className="flex items-center space-x-2 text-gray-700 font-semibold">
                        <span>Assigned By</span>
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="py-4 px-6 text-left text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedLeads.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <FileText className="w-16 h-16 text-gray-300 mb-4" />
                          <p className="text-gray-500 text-lg">No leads found</p>
                          <p className="text-gray-400 mt-2">Start by creating your first lead</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead) => (
                      <tr 
                        key={lead._id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{lead.taskTitle}</p>
                            <p className="text-sm text-gray-600 mt-1 truncate max-w-xs">
                              {lead.taskDescription || 'No description'}
                            </p>
                          </div>
                        </td>
                        
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${getPriorityColor(lead.priority)}`}></div>
                            <span className="capitalize font-medium text-gray-900">{lead.priority}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full ${getStatusColor(lead.status)}`}>
                            {getStatusIcon(lead.status)}
                            <span className="text-sm font-medium capitalize">
                              {lead.status.replace('_', ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <CalendarDays className="w-4 h-4" />
                            <span>
                              {lead.dueDate ? format(new Date(lead.dueDate), 'MMM dd, yyyy') : 'No due date'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {lead.sharedBy && (
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-700">
                                {lead.sharedBy.firstName} {lead.sharedBy.lastName}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <Link 
                              href={`/employee/my-lead/${lead._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                           
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginatedLeads.length > 0 && (
              <div className="border-t px-6 py-4 flex items-center justify-between">
                <p className="text-gray-600">
                  Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredLeads.length)} of {filteredLeads.length} leads
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lead Details Modal */}
        {showLeadDetails && selectedLead && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Lead Details</h2>
                  <button
                    onClick={() => setShowLeadDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Lead Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column */}
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{selectedLead.taskTitle}</h3>
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(selectedLead.priority)}`}></div>
                          <span className="capitalize font-medium">{selectedLead.priority} Priority</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-4">{selectedLead.taskDescription}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Created</p>
                          <p className="font-medium">
                            {format(new Date(selectedLead.createdAt), 'PPpp')}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Last Updated</p>
                          <p className="font-medium">
                            {format(new Date(selectedLead.updatedAt), 'PPpp')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Client Details */}
                    {selectedLead.formSubmission?.employeeId && (
                      <div className="bg-white border rounded-xl p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-600">Full Name</p>
                              <p className="font-medium">
                                {selectedLead.formSubmission.employeeId.firstName} {selectedLead.formSubmission.employeeId.lastName}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium">{selectedLead.formSubmission.employeeId.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Phone className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-600">Phone</p>
                              <p className="font-medium">{selectedLead.formSubmission.employeeId.phone || 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <Briefcase className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm text-gray-600">Designation</p>
                              <p className="font-medium">{selectedLead.formSubmission.employeeId.designation || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Feedback and Notes */}
                    <div className="bg-white border rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Feedback & Notes</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Your Feedback
                          </label>
                          <textarea
                            defaultValue={selectedLead.employeeFeedback}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[100px]"
                            placeholder="Add your feedback here..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes
                          </label>
                          <textarea
                            defaultValue={selectedLead.notes}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[80px]"
                            placeholder="Add any additional notes..."
                          />
                        </div>
                        <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-all">
                          Save Feedback
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Actions & Details */}
                  <div className="space-y-6">
                    {/* Status Actions */}
                    <div className="bg-white border rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
                      <div className="space-y-3">
                        {['signed', 'pending', 'not_avaiable', 'not_intrested', 're_shedule'].map((status) => (
                          <button
                            key={status}
                            onClick={() => updateLeadStatus(selectedLead._id, status)}
                            className={`w-full px-4 py-3 rounded-lg flex items-center justify-between transition-all ${
                              selectedLead.status === status
                                ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500'
                                : 'border hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {getStatusIcon(status)}
                              <span className="capitalize font-medium">{status.replace('_', ' ')}</span>
                            </div>
                            {selectedLead.status === status && (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Details */}
                    <div className="bg-white border rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Details</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Due Date</span>
                          <span className="font-medium">
                            {selectedLead.dueDate 
                              ? format(new Date(selectedLead.dueDate), 'MMM dd, yyyy')
                              : 'No due date'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Vendor Status</span>
                          <span className={`px-3 py-1 rounded-full ${
                            selectedLead.VendorStatus === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : selectedLead.VendorStatus === 'not_approved'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedLead.VendorStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Machine Status</span>
                          <span className={`px-3 py-1 rounded-full ${
                            selectedLead.MachineStatus === 'deployed' 
                              ? 'bg-green-100 text-green-800'
                              : selectedLead.MachineStatus === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {selectedLead.MachineStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Attachments</span>
                          <span className="font-medium">
                            {selectedLead.fileAttachments?.length || 0} files
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                      <div className="space-y-3">
                        <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-all flex items-center justify-center space-x-2">
                          <Edit className="w-4 h-4" />
                          <span>Edit Lead</span>
                        </button>
                        <Link
                          href={`/employee/my-lead/${selectedLead._id}`}
                          className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-all text-center"
                        >
                          View Full Details
                        </Link>
                        <button className="w-full px-4 py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-all flex items-center justify-center space-x-2">
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Lead</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-6 border-t flex justify-end space-x-4">
                  <button
                    onClick={() => setShowLeadDetails(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  >
                    Close
                  </button>
                  <button className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}