"use client";

import React, { useEffect, useState } from "react";
import ManagerTask from "@/components/admin/ManagerTask";
import TeamLeadAndEmployeeTask from "@/components/admin/TeamLeadAndEmployeeTask";
import UserTaskStats from "@/components/admin/UserTaskStats";

export default function Page() {
  const [view, setView] = useState(null); // "admin" | "task2"
  const [adminCount, setAdminCount] = useState(0);
  const [task2Count, setTask2Count] = useState(0);

  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/admin/tasks"),
        fetch("/api/admin/tasks2"),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      setAdminCount(data1?.tasks?.length || 0);
      setTask2Count(data2?.tasks?.length || 0);
    } catch (err) {
      console.error(err);
    }
  };

  /* =====================
     BUTTON VIEW
  ===================== */
  if (!view) {
    return (
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ADMIN TASKS BUTTON */}
        <button
          onClick={() => setView("admin")}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-left shadow-lg transition hover:scale-105"
        >
          <h2 className="text-2xl font-bold text-white">Admin Tasks</h2>
          <p className="text-white/90 mt-2">
            Total Tasks: <b>{adminCount}</b>
          </p>
          <span className="text-white/80 mt-4 inline-block">Open →</span>
        </button>

        {/* TASK2 BUTTON */}
        <button
          onClick={() => setView("task2")}
          className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-left shadow-lg transition hover:scale-105"
        >
          <h2 className="text-2xl font-bold text-white">
            TeamLead & Employee Tasks
          </h2>
          <p className="text-white/90 mt-2">
            Total Tasks: <b>{task2Count}</b>
          </p>
          <span className="text-white/80 mt-4 inline-block">Open →</span>
        </button>

      </div>
    );
  }

  /* =====================
     COMPONENT VIEW
  ===================== */
  return (
    <div className="p-6">

      {/* BACK BUTTON */}
      <button
        onClick={() => setView(null)}
        className="mb-6 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-white hover:bg-gray-800 transition"
      >
        ← Back
      </button>

      {view === "admin" && <ManagerTask />}
      {view === "task2" && <TeamLeadAndEmployeeTask />}
     

    </div>
  );
}
