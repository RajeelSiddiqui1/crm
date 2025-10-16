// app/(admin)/users/page.jsx
export default function Users() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', status: 'Active', role: 'Admin' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'Active', role: 'User' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', status: 'Inactive', role: 'User' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', status: 'Active', role: 'Moderator' },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">
          <span className="bg-gradient-to-r from-gold-500 to-yellow-300 bg-clip-text text-transparent">
            User Management
          </span>
        </h1>
        <p className="text-gray-400 text-lg">
          Manage all users and their permissions in one place
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-gray-800/50 rounded-2xl border border-gold-500/20 backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-gold-500/20">
          <h2 className="text-2xl font-bold text-white">All Users</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/20">
                <th className="text-left p-4 text-gold-500 font-semibold">Name</th>
                <th className="text-left p-4 text-gold-500 font-semibold">Email</th>
                <th className="text-left p-4 text-gold-500 font-semibold">Status</th>
                <th className="text-left p-4 text-gold-500 font-semibold">Role</th>
                <th className="text-left p-4 text-gold-500 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                  <td className="p-4 text-white font-medium">{user.name}</td>
                  <td className="p-4 text-gray-400">{user.email}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      user.status === 'Active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-gold-500/20 text-gold-400 border border-gold-500/30">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <button className="px-4 py-2 bg-gold-500 text-black rounded-lg font-medium hover:bg-yellow-400 transition-colors mr-2">
                      Edit
                    </button>
                    <button className="px-4 py-2 border border-red-500 text-red-400 rounded-lg font-medium hover:bg-red-500/10 transition-colors">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gold-500/20">
          <p className="text-2xl font-bold text-gold-500">4</p>
          <p className="text-gray-400">Total Users</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gold-500/20">
          <p className="text-2xl font-bold text-gold-500">3</p>
          <p className="text-gray-400">Active</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gold-500/20">
          <p className="text-2xl font-bold text-gold-500">1</p>
          <p className="text-gray-400">Admin</p>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 text-center border border-gold-500/20">
          <p className="text-2xl font-bold text-gold-500">1</p>
          <p className="text-gray-400">Inactive</p>
        </div>
      </div>
    </div>
  );
}