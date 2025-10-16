import Link from "next/link";
import { 
  UserCog, 
  Users, 
  UserCheck, 
  User,
  Shield,
  Briefcase,
  Target,
  Star
} from "lucide-react";

export default function Home() {
  const loginOptions = [
    {
      role: "Admin",
      description: "System administrator with full access",
      href: "/adminlogin",
      icon: UserCog,
      color: "from-red-500 to-pink-600",
      bgColor: "hover:bg-red-50 dark:hover:bg-red-950/20",
      borderColor: "border-red-200 dark:border-red-800"
    },
    {
      role: "Manager", 
      description: "Team and project management",
      href: "/managerlogin",
      icon: Users,
      color: "from-blue-500 to-cyan-600",
      bgColor: "hover:bg-blue-50 dark:hover:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800"
    },
    {
      role: "Team Lead",
      description: "Team leadership and task coordination",
      href: "/teamleadlogin", 
      icon: UserCheck,
      color: "from-green-500 to-emerald-600",
      bgColor: "hover:bg-green-50 dark:hover:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800"
    },
    {
      role: "Employee",
      description: "Team member and task execution",
      href: "/employeelogin",
      icon: User,
      color: "from-purple-500 to-indigo-600",
      bgColor: "hover:bg-purple-50 dark:hover:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="w-full bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  CRM System
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                 MH Enterprise Management Solution
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">CRM Dashboard</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Select your role to access the customized dashboard and management tools tailored for your position.
          </p>
        </div>

        {/* Login Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {loginOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Link
                key={option.role}
                href={option.href}
                className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border ${option.borderColor} transition-all duration-300 hover:shadow-xl hover:scale-105 ${option.bgColor} overflow-hidden`}
              >
                {/* Gradient Top Bar */}
                <div className={`h-2 bg-gradient-to-r ${option.color}`}></div>
                
                <div className="p-6">
                  {/* Icon */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${option.color} shadow-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Star className="h-5 w-5 text-yellow-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {option.role}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    {option.description}
                  </p>

                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium bg-gradient-to-r ${option.color} bg-clip-text text-transparent`}>
                      Login Now
                    </span>
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-purple-600 transition-all duration-300">
                      <svg 
                        className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors duration-300" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-300 dark:group-hover:border-gray-600 rounded-2xl transition-all duration-300 pointer-events-none"></div>
              </Link>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="mt-20 text-center">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
            Powerful Features for Every Role
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <Briefcase className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Project Management
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Manage projects, tasks, and team collaboration efficiently
              </p>
            </div>
            <div className="text-center p-6">
              <Target className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Task Tracking
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Real-time task progress and performance monitoring
              </p>
            </div>
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Team Collaboration
              </h4>
              <p className="text-gray-600 dark:text-gray-300">
                Seamless communication and team coordination
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>© 2024 CRM System. All rights reserved.</p>
            <p className="text-sm mt-2">Secure enterprise management platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
}