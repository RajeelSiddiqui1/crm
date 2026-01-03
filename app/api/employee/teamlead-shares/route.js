// /api/employee/teamlead-shares.js - Fixed
import { NextResponse } from "next/server";
import AdminTask2 from "@/models/AdminTask2";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Employee") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = session.user.id;

    // Get tasks where employee has access
    const tasks = await AdminTask2.find({
      $or: [
        { "employees.employeeId": employeeId },
        { "shares.sharedTo": employeeId, "shares.sharedToModel": "Employee" }
      ],
      "shares.sharedByModel": "TeamLead"
    })
    .select("title shares")
    .lean();

    // Extract and populate teamlead shares
    const teamleadShares = [];
    
    for (const task of tasks) {
      for (const share of task.shares) {
        if (share.sharedByModel === "TeamLead" && share.sharedToModel === "TeamLead") {
          // Populate sharedBy (TeamLead)
          const sharedBy = await TeamLead.findById(share.sharedBy)
            .select("firstName lastName email profilePic")
            .lean();
          
          // Populate sharedTo (TeamLead)
          const sharedTo = await TeamLead.findById(share.sharedTo)
            .select("firstName lastName email profilePic")
            .lean();
          
          teamleadShares.push({
            taskId: task._id,
            taskTitle: task.title,
            sharedBy,
            sharedTo,
            sharedAt: share.sharedAt,
            _id: share._id
          });
        }
      }
    }

    // Sort by sharedAt descending
    teamleadShares.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));

    return NextResponse.json(teamleadShares, { status: 200 });
  } catch (error) {
    console.error("Error fetching teamlead shares:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}