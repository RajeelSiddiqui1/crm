export const getPriorityColor = (priority) => {
  switch(priority) {
    case 'high': return { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      border: 'border-red-200', 
      icon: 'bg-red-500' 
    };
    case 'medium': return { 
      bg: 'bg-yellow-100', 
      text: 'text-yellow-800', 
      border: 'border-yellow-200', 
      icon: 'bg-yellow-500' 
    };
    case 'low': return { 
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

export const getStatusColor = (status) => {
  switch(status) {
    case 'completed': return { 
      bg: 'bg-green-100', 
      text: 'text-green-800', 
      border: 'border-green-200' 
    };
    case 'in-progress': return { 
      bg: 'bg-blue-100', 
      text: 'text-blue-800', 
      border: 'border-blue-200' 
    };
    case 'overdue': return { 
      bg: 'bg-red-100', 
      text: 'text-red-800', 
      border: 'border-red-200' 
    };
    default: return { 
      bg: 'bg-gray-100', 
      text: 'text-gray-800', 
      border: 'border-gray-200' 
    };
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return "Not set";
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatTime = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getDaysLeft = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const dueDate = new Date(endDate);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};