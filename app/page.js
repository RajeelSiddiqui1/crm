import Link from "next/link";
import {
  UserCog,
  Users,
  UserCheck,
  User,
  Shield,
  Star,
  ArrowRight,
  Building,
  Workflow,
  BarChart3,
} from "lucide-react";
import Image from "next/image";

export default function Home() {
  const loginOptions = [
    {
      role: "Admin",
      description:
        "System administrator with full access and control over all features",
      href: "/adminlogin",
      icon: UserCog,
      color: "from-red-500 to-rose-600",
      bgColor: "hover:bg-red-50",
      borderColor: "border-red-100",
      buttonColor: "bg-gradient-to-r from-red-500 to-rose-600",
    },
    {
      role: "Manager",
      description:
        "Team management, project oversight, and performance tracking",
      href: "/managerlogin",
      icon: Users,
      color: "from-blue-500 to-blue-600",
      bgColor: "hover:bg-blue-50",
      borderColor: "border-blue-100",
      buttonColor: "bg-gradient-to-r from-blue-500 to-blue-600",
    },
    {
      role: "Team Lead",
      description: "Team leadership, task coordination, and member management",
      href: "/teamleadlogin",
      icon: UserCheck,
      color: "from-green-500 to-green-600",
      bgColor: "hover:bg-green-50",
      borderColor: "border-green-100",
      buttonColor: "bg-gradient-to-r from-green-500 to-green-600",
    },
    {
      role: "Employee",
      description:
        "Task execution, attendance tracking, and personal dashboard",
      href: "/employeelogin",
      icon: User,
      color: "from-purple-500 to-purple-600",
      bgColor: "hover:bg-purple-50",
      borderColor: "border-purple-100",
      buttonColor: "bg-gradient-to-r from-purple-500 to-purple-600",
    },
  ];

  const features = [
    {
      icon: Workflow,
      title: "Workflow Management",
      description:
        "Streamlined processes and automated workflows for maximum efficiency",
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description:
        "Comprehensive analytics and real-time reporting for data-driven decisions",
    },
    {
      icon: Building,
      title: "Department Management",
      description:
        "Organized department structure with clear hierarchy and responsibilities",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="w-full bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center py-6 gap-4 md:gap-0">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 p-2 rounded-xl">
                <Image
                  src="/office/mhsolution2.png"
                  alt="MH Logo"
                  width={100}
                  height={100}
                  className="object-cover"
                />
              </div>
            </div>

            {/* Title & Subtitle */}
            <div className="text-center md:text-left">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                MH Circle Solution CRM 
              </h1>
             
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 border border-blue-200 mb-6">
            <span className="text-blue-700 text-sm font-semibold">
              Enterprise Ready CRM Platform
            </span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Welcome to{" "}
            <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              MH Circle Solution CRM
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Streamline your business operations with our comprehensive CRM
            dashboard. Select your role to access your personalized workspace.
          </p>
        </div>

        {/* Login Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-20">
          {loginOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Link
                key={option.role}
                href={option.href}
                className={`group relative bg-white rounded-2xl shadow-lg border-2 ${option.borderColor} transition-all duration-500 hover:shadow-2xl hover:scale-105 ${option.bgColor} overflow-hidden`}
              >
                {/* Gradient Background Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                ></div>

                <div className="relative p-8">
                  {/* Icon and Badge */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`p-4 rounded-2xl bg-gradient-to-r ${option.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      <IconComponent className="h-7 w-7 text-white" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transform group-hover:translate-x-0 translate-x-4 transition-all duration-500">
                      <Star className="h-5 w-5 text-yellow-400 fill-current" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                    {option.role}
                  </h3>
                  <p className="text-gray-600 text-base leading-relaxed mb-6">
                    {option.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-semibold bg-gradient-to-r ${option.color} bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300`}
                    >
                      Access Dashboard
                    </span>
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-500 group-hover:scale-110 shadow-sm">
                      <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors duration-300" />
                    </div>
                  </div>
                </div>

                {/* Hover Border Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-200 rounded-2xl transition-all duration-500 pointer-events-none"></div>
              </Link>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
                Every Role
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comprehensive tools and features designed to empower every team
              member and streamline your business operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="text-center p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all duration-500 hover:scale-105 group"
                >
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Role Highlights */}
          <div className="mt-16 pt-12 border-t border-gray-100">
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">
              Role-Based Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl border border-red-100">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-red-500 to-rose-600 rounded-lg mr-3">
                    <UserCog className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Admin</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Full system control</li>
                  <li>• User management</li>
                  <li>• System configuration</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl border border-blue-100">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg mr-3">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Manager</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Team oversight</li>
                  <li>• Shared subtasks</li>
                  <li>• Project management</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl border border-green-100">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg mr-3">
                    <UserCheck className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Team Lead</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Create subtasks</li>
                  <li>• Team coordination</li>
                  <li>• Task assignment</li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-xl border border-purple-100">
                <div className="flex items-center mb-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg mr-3">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <h4 className="font-bold text-gray-900">Employee</h4>
                </div>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Task execution</li>
                  <li>• Progress tracking</li>
                  <li>• Personal dashboard</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-gray-900">
                MH Enterprises CRM
              </span>
            </div>
            <p className="text-gray-600 mb-2">
              © 2024 MH Enterprises. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Complete business management platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
