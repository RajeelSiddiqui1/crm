"use client";

import { useEffect, useState } from "react";

export default function UserTaskStats() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
    const departmentId = params.id;

  useEffect(() => {
    async function fetchTasks() {
      try {
        const res = await fetch(`/api/admin/departments/${departmentId}/user-task`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchTasks();
  }, [departmentId]);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!data) return <p className="text-center mt-10">No data found</p>;

  const renderStats = (user, stats) => (
    <div className="bg-gray-800 p-4 rounded shadow mb-3">
      <h3 className="text-white font-bold">{user.firstName} {user.lastName}</h3>
      <p className="text-gray-300">Pending: {stats.pending}</p>
      <p className="text-yellow-400">In Progress: {stats.inProgress}</p>
      <p className="text-green-400">Completed: {stats.completed}</p>
    </div>
  );

  return (
    <div className="p-6 space-y-8">
      <section>
        <h2 className="text-2xl font-bold mb-4 text-white">Managers</h2>
        {data.managers.map(({ manager, stats }) => renderStats(manager, stats))}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 text-white">Team Leads</h2>
        {data.teamLeads.map(({ teamLead, stats }) => renderStats(teamLead, stats))}
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-4 text-white">Employees</h2>
        {data.employees.map(({ employee, stats }) => renderStats(employee, stats))}
      </section>
    </div>
  );
}
