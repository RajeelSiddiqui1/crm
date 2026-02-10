"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  CalendarDays,
  Flag,
  User,
  Clock,
  FileText,
  Building,
  Users,
  Mail,
  Phone,
  Briefcase,
  Download,
  Share2,
  MessageSquare,
  Edit,
  Trash2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Upload,
  Link as LinkIcon,
  Printer,
  Copy,
  Eye,
  DownloadCloud,
  Calendar,
  Star,
  BarChart,
  TrendingUp,
  Award,
  Target,
  DollarSign,
  Percent,
  Globe,
  MapPin,
  Home,
  BriefcaseBusiness,
  FileSpreadsheet,
  Image as ImageIcon,
  Video,
  Music,
  Archive,
  Folder,
  Settings,
  Bell,
  HelpCircle,
  LogOut,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  ThumbsUp,
  Heart,
  Camera,
  Mic,
  PhoneCall,
  Video as VideoIcon,
  Info,
  Shield,
  Lock,
  Unlock,
  Key,
  EyeOff,
  Filter,
  Search,
  Grid,
  List,
  Layout,
  Columns,
  Sidebar,
  Menu,
  X,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  Plus,
  Minus,
  Divide,
  X as XIcon,
  Check,
  AlertTriangle,
  Zap,
  Wind,
  Cloud,
  Sun,
  Moon,
  Coffee,
  Battery,
  Wifi,
  Bluetooth,
  Radio,
  Tv,
  Smartphone,
  Laptop,
  Monitor,
  Server,
  Database,
  HardDrive,
  Cpu,
  MemoryStick,
  Router,
  Network,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  Thermometer,
  Droplets,
  Umbrella,
  Waves,
  TreePine,
  Leaf,
  Flower2,
  Sprout,
  Bug,
  Bird,
  Fish,
  Rabbit,
  Cat,
  Dog,
  Whale,
  Turtle,
  Bird as BirdIcon,
  Fish as FishIcon,
  Dog as DogIcon
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function LeadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.id;
  
  const [lead, setLead] = useState(null);
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [feedback, setFeedback] = useState('');
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    if (leadId) {
      fetchLeadDetails();
    }
  }, [leadId]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employee/my-lead/${leadId}`);
      const data = await response.json();
      
      if (data.success) {
        setLead(data.lead);
        setEmployee(data.employee);
        setFeedback(data.lead.employeeFeedback || '');
        setNotes(data.lead.notes || '');
        setNewStatus(data.lead.status);
      } else {
        router.push('/employee/my-lead');
      }
    } catch (error) {
      console.error('Error fetching lead details:', error);
      router.push('/employee/my-lead');
    } finally {
      setLoading(false);
    }
  };

  const updateLead = async () => {
    try {
      const response = await fetch(`/api/employee/my-lead/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          employeeFeedback: feedback,
          notes: notes
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLead(data.lead);
        setIsEditing(false);
        alert('Lead updated successfully!');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-64 bg-gray-200 rounded-xl"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-xl"></div>
              <div className="h-48 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Not Found</h2>
          <p className="text-gray-600 mb-6">The lead you're looking for doesn't exist.</p>
          <Link
            href="/employee/my-lead"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium inline-flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Leads</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/employee/my-lead"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {lead.formId?.formId?.title || 'Lead Details'}
                </h1>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-600">Lead ID:</span>
                  <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm font-mono">
                    {lead._id?.substring(0, 8)}...
                  </code>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status?.replaceAll('_', ' ') || 'Pending'}
                  </div>
                </div>
              </div>
            </div>
            
         
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:w-2/3">
            {/* Tabs */}
            <div className="bg-white border rounded-xl overflow-hidden mb-8">
              <div className="border-b">
                <div className="flex overflow-x-auto">
                  {['details', 'form-data', 'attachments', 'feedback'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace('-', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-8">
                    {/* Client Information */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b">
                        Client Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {lead.formId?.employeeId && (
                          <>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                              <div className="flex items-center space-x-4 mb-4">
                                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                                  {lead.formId.employeeId.firstName?.charAt(0)}
                                  {lead.formId.employeeId.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900">
                                    {lead.formId.employeeId.firstName} {lead.formId.employeeId.lastName}
                                  </h4>
                                  <p className="text-blue-600">{lead.formId.employeeId.designation}</p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    <span className="text-sm">Email</span>
                                  </div>
                                  <p className="font-medium">{lead.formId.employeeId.email}</p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span className="text-sm">Phone</span>
                                  </div>
                                  <p className="font-medium">{lead.formId.employeeId.phone || 'N/A'}</p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Briefcase className="w-4 h-4" />
                                    <span className="text-sm">Department</span>
                                  </div>
                                  <p className="font-medium">{lead.formId.employeeId.depId?.name || 'N/A'}</p>
                                </div>
                                
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Building className="w-4 h-4" />
                                    <span className="text-sm">Company</span>
                                  </div>
                                  <p className="font-medium">Organization</p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* Lead Details */}
                        <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-6">
                          <h4 className="text-lg font-bold text-gray-900 mb-4">Lead Details</h4>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-600">Created</span>
                              <span className="font-medium text-gray-900">
                                {format(new Date(lead.createdAt), 'PPpp')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-600">Last Updated</span>
                              <span className="font-medium text-gray-900">
                                {format(new Date(lead.updatedAt), 'PPpp')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-600">Original Task ID</span>
                              <code className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono">
                                {lead.originalTaskId}
                              </code>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b">
                              <span className="text-gray-600">Form Title</span>
                              <span className="font-medium">
                                {lead.formId?.formId?.title || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assignment Information */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b">
                        Assignment Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {lead.sharedBy && (
                          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Shared By</p>
                                <p className="font-bold text-gray-900">
                                  {lead.sharedBy.firstName} {lead.sharedBy.lastName}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{lead.sharedBy.email}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Departments: {lead.sharedBy?.departments?.map(d => d.name).join(', ') || 'N/A'}
                            </p>
                          </div>
                        )}

                        {lead.sharedManager && (
                          <div className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Manager</p>
                                <p className="font-bold text-gray-900">
                                  {lead.sharedManager.firstName} {lead.sharedManager.lastName}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{lead.sharedManager.email}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Departments: {lead.sharedManager?.departments?.map(d => d.name).join(', ') || 'N/A'}
                            </p>
                          </div>
                        )}

                        {lead.sharedTeamlead && (
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Team Lead</p>
                                <p className="font-bold text-gray-900">
                                  {lead.sharedTeamlead.firstName} {lead.sharedTeamlead.lastName}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{lead.sharedTeamlead.email}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Departments: {lead.sharedTeamlead?.depId?.name}
                            </p>
                          </div>
                        )}

                        {lead.sharedOperationManager && (
                          <div className="bg-gradient-to-br from-indigo-50 to-violet-100 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Operation Manager</p>
                                <p className="font-bold text-gray-900">
                                  {lead.sharedOperationManager.firstName} {lead.sharedOperationManager.lastName}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{lead.sharedOperationManager.email}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Departments: {lead.sharedOperationManager?.departments?.map(d => d.name).join(', ') || 'N/A'}
                            </p>
                          </div>
                        )}

                        {lead.sharedOperationTeamlead && (
                          <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center">
                                <Target className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Operation Team Lead</p>
                                <p className="font-bold text-gray-900">
                                  {lead.sharedOperationTeamlead?.firstName}{" "}
                                  {lead.sharedOperationTeamlead?.lastName}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">
                              {lead.sharedOperationTeamlead?.email}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Departments: {lead.sharedOperationTeamlead?.depId?.name || "N/A"}
                            </p>
                          </div>
                        )}

                        {lead.sharedOperationEmployee && (
                          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Operation Employee</p>
                                <p className="font-bold text-gray-900">
                                  {lead.sharedOperationEmployee.firstName} {lead.sharedOperationEmployee.lastName}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{lead.sharedOperationEmployee.email}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              Departments: {lead.sharedOperationEmployee?.depId?.name || "N/A"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Information */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b">
                        Status Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-xl p-6">
                          <h4 className="font-bold text-gray-900">Your Lead Status</h4>
                          <div
                            className={`px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                              lead.status === "signed"
                                ? "bg-green-100 text-green-800"
                                : lead.status === "not_intrested" || lead.status === "not_avaiable"
                                ? "bg-red-100 text-red-800"
                                : lead.status === "re_shedule"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {lead.status?.replaceAll("_", " ") || 'Pending'}
                          </div>
                          <p className="text-sm text-gray-600 mt-2">
                            Current status of your lead
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-xl p-6">
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-900">Vendor Status</h4>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                              lead.VendorStatus === 'approved' 
                                ? 'bg-green-100 text-green-800'
                                : lead.VendorStatus === 'not_approved'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lead.VendorStatus || 'Pending'}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Current status with the vendor
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-6">
                          <div className="mb-4">
                            <h4 className="font-bold text-gray-900">Machine Status</h4>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                              lead.MachineStatus === 'deployed' 
                                ? 'bg-green-100 text-green-800'
                                : lead.MachineStatus === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {lead.MachineStatus || 'Pending'}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            Deployment status of the machine
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'form-data' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Form Data</h3>
                      <p className="text-gray-600 mb-6">
                        {lead.formId?.formId?.description || 'No description available'}
                      </p>
                    </div>

                    {lead.formId?.formData && Object.keys(lead.formId.formData).length > 0 ? (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(lead.formId.formData).map(([key, value]) => (
                            <div key={key} className="bg-white p-4 rounded-lg border">
                              <h4 className="font-medium text-gray-700 mb-1 capitalize">
                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                              </h4>
                              <p className="text-gray-900 font-medium">
                                {value || 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No form data available</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'attachments' && (
                  <div className="space-y-6">
                    {/* Shared Task Attachments */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Visitor Attachments</h3>
                      {lead.fileAttachments && lead.fileAttachments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {lead.fileAttachments.map((file, index) => (
                            <div key={`shared-${index}`} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {(file.size / 1024).toFixed(2)} KB • {file.type}
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <span className="text-sm text-gray-500">
                                  {file.createdAt ? format(new Date(file.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                </span>
                                <div className="flex space-x-2">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                  <a
                                    href={file.url}
                                    download
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Download"
                                  >
                                    <DownloadCloud className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl mb-6">
                          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No attachments found in shared task</p>
                        </div>
                      )}
                    </div>

                    {/* Form Attachments from formId */}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Your Form Attachments</h3>
                      {lead.formId?.fileAttachments && lead.formId.fileAttachments.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {lead.formId.fileAttachments.map((file, index) => (
                            <div key={`form-${index}`} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                  <FileText className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {(file.size / 1024).toFixed(2)} KB • {file.type}
                                  </p>
                                </div>
                              </div>
                              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                                <span className="text-sm text-gray-500">
                                  {file.createdAt ? format(new Date(file.createdAt), 'MMM dd, yyyy') : 'N/A'}
                                </span>
                                <div className="flex space-x-2">
                                  <a
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Preview"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </a>
                                  <a
                                    href={file.url}
                                    download
                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                    title="Download"
                                  >
                                    <DownloadCloud className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl">
                          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500">No attachments found in original form</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'feedback' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">Update Lead Status</h3>
                      {isEditing ? (
                        <div className="bg-gray-50 rounded-xl p-6 mb-6">
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {['pending', 'signed', 'not_avaiable', 'not_intrested', 're_shedule'].map((status) => (
                              <button
                                key={status}
                                onClick={() => setNewStatus(status)}
                                className={`p-3 rounded-lg text-center font-medium transition-colors ${
                                  newStatus === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                {status.replace('_', ' ')}
                              </button>
                            ))}
                          </div>
                          <div className="flex justify-end space-x-3 mt-6">
                            <button
                              onClick={() => setIsEditing(false)}
                              className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={updateLead}
                              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors flex items-center space-x-2"
                            >
                              <Check className="w-4 h-4" />
                              <span>Save Changes</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between bg-gray-50 rounded-xl p-6">
                          <div>
                            <p className="text-gray-600">Current Status</p>
                            <div className={`px-4 py-2 rounded-full inline-block mt-2 font-medium ${getStatusColor(lead.status)}`}>
                              {lead.status?.replaceAll('_', ' ') || 'Pending'}
                            </div>
                          </div>
                       
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Visitor  Feedback
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          className="w-full p-4 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[200px] resize-none"
                          placeholder="Add your feedback about this lead..."
                          readOnly={!isEditing}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Additional Notes
                        </label>
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full p-4 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none min-h-[200px] resize-none"
                          placeholder="Add any additional notes..."
                          readOnly={!isEditing}
                        />
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setFeedback(lead.employeeFeedback || '');
                            setNotes(lead.notes || '');
                            setNewStatus(lead.status);
                          }}
                          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={updateLead}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 font-medium transition-colors flex items-center space-x-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Save All Changes</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form Description */}
            {lead.formId?.formId?.description && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Form Description</h3>
                <p className="text-gray-700">{lead.formId.formId.description}</p>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:w-1/3">
            

            {/* Status Timeline */}
            <div className="bg-white border rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Status Timeline</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(lead.createdAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <RefreshCw className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Last Updated</p>
                    <p className="text-sm text-gray-600">
                      {format(new Date(lead.updatedAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                </div>
                
                {lead.feedbackUpdatedAt && (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Feedback Updated</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(lead.feedbackUpdatedAt), 'MMM dd, yyyy hh:mm a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Employee Information */}
            {employee && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Information</h3>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {employee.firstName?.charAt(0)}{employee.lastName?.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </h4>
                    <p className="text-blue-600">{employee.designation}</p>
                    <p className="text-sm text-gray-600">{employee.email}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Department</span>
                    <span className="font-medium text-gray-900">{employee.depId?.name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">Phone</span>
                    <span className="font-medium text-gray-900">{employee.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Role</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      Employee
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Delete Lead</h3>
                  <p className="text-gray-600 mt-1">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete this lead? All associated data will be permanently removed.
              </p>
              
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateLead}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Lead</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}