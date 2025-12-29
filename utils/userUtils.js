export const getUserShortName = (user) => {
  if (!user) return "??";
  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "??";
};

export const getUserFullName = (user) => {
  if (!user) return "Unknown User";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim();
};

export const getUserDepartment = (user) => {
  if (!user) return "No Department";
  if (user.departments && Array.isArray(user.departments)) {
    return user.departments.map(d => d?.name || "Unknown").join(", ");
  }
  if (user.depId) {
    return user.depId?.name || "No Department";
  }
  return "No Department";
};

export const getUserEmail = (user) => {
  return user?.email || "No email";
};

export const getUserRoleColor = (type) => {
  switch(type) {
    case 'manager': return { 
      bg: 'bg-blue-100', 
      text: 'text-blue-800', 
      border: 'border-blue-200', 
      icon: 'bg-blue-500' 
    };
    case 'teamLead': return { 
      bg: 'bg-purple-100', 
      text: 'text-purple-800', 
      border: 'border-purple-200', 
      icon: 'bg-purple-500' 
    };
    case 'employee': return { 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      border: 'border-green-200', 
      icon: 'bg-green-500' 
    };
    default: return { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      border: 'border-gray-200', 
      icon: 'bg-gray-500' 
    };
  }
};