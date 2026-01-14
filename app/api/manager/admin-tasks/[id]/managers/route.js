// app/api/manager/admin-tasks/[id]/managers/route.js (Updated)
import { NextResponse } from "next/server";
import AdminTask from "@/models/AdminTask";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const loggedInManagerId = session.user.id;
    const { id } = params;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const department = searchParams.get("department");

    // Find task with populated managers and responses
    const task = await AdminTask.findById(id)
      .populate({
        path: "managers",
        select: "firstName lastName email profilePicture departments phone",
        populate: {
          path: "departments",
          select: "name",
        },
      })
      .populate({
        path: "managerResponses.managerId",
        select: "firstName lastName email profilePicture",
      });

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      );
    }

    // Get manager details with responses
    const managersWithDetails = await Promise.all(
      task.managers.map(async (manager) => {
        // Get manager's response for this task
        const response = task.managerResponses.find(
          (r) => r.managerId?._id?.toString() === manager._id.toString()
        );

        // Get manager details from Manager model
        const managerDetails = await Manager.findById(manager._id)
          .select("firstName lastName email profilePicture departments phone")
          .populate({
            path: "departments",
            select: "name",
          });

        return {
          ...managerDetails.toObject(),
          response: response ? {
            status: response.status,
            feedback: response.feedback,
            submittedFiles: response.submittedFiles || [],
            submittedAt: response.submittedAt,
            updatedAt: response.updatedAt,
          } : null,
        };
      })
    );

    /* ---------------- FILTER MANAGERS ---------------- */

    let filteredManagers = managersWithDetails;

    // Status filter
    if (status && status !== "all") {
      if (status === "pending") {
        filteredManagers = filteredManagers.filter(
          (manager) => !manager.response
        );
      } else {
        filteredManagers = filteredManagers.filter(
          (manager) => manager.response?.status === status
        );
      }
    }

    // Department filter
    if (department) {
      filteredManagers = filteredManagers.filter((manager) =>
        manager.departments?.some((dept) =>
          dept.name.toLowerCase().includes(department.toLowerCase())
        )
      );
    }

    // Exclude logged-in manager if needed
    // Optional: remove this if you want to show all including current manager
    filteredManagers = filteredManagers.filter(
      (manager) => manager._id.toString() !== loggedInManagerId
    );

    /* ---------------- STATISTICS ---------------- */

    const statistics = {
      total: managersWithDetails.length,
      completed: managersWithDetails.filter(
        (m) => m.response?.status === "completed"
      ).length,
      "in-progress": managersWithDetails.filter(
        (m) => m.response?.status === "in-progress"
      ).length,
      rejected: managersWithDetails.filter(
        (m) => m.response?.status === "rejected"
      ).length,
      pending: managersWithDetails.filter((m) => !m.response).length,
    };

    return NextResponse.json({
      success: true,
      taskTitle: task.title,
      managers: filteredManagers,
      statistics,
    });
  } catch (error) {
    console.error("Error fetching manager status:", error);
    return NextResponse.json(
      { success: false, message: "Fetch failed", error: error.message },
      { status: 500 }
    );
  }
}