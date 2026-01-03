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

    if (!session || session.user.role !== "TeamLead") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const teamleadId = session.user.id;

    // Get tasks where teamlead has access and there are employee shares
    const tasks = await AdminTask2.find({
      $or: [
        { "teamleads.teamleadId": teamleadId },
        { "shares.sharedTo": teamleadId, "shares.sharedToModel": "TeamLead" }
      ],
      "shares.sharedByModel": "Employee"
    })
    .select("title shares")
    .lean();

    // Extract and populate employee shares
    const employeeShares = [];
    
    for (const task of tasks) {
      for (const share of task.shares) {
        if (share.sharedByModel === "Employee") {
          // Populate sharedBy (Employee)
          const sharedBy = await Employee.findById(share.sharedBy)
            .select("firstName lastName email profilePic department")
            .lean();
          
          // Populate sharedTo
          let sharedTo = null;
          if (share.sharedToModel === "Employee") {
            sharedTo = await Employee.findById(share.sharedTo)
              .select("firstName lastName email profilePic")
              .lean();
          } else if (share.sharedToModel === "TeamLead") {
            sharedTo = await TeamLead.findById(share.sharedTo)
              .select("firstName lastName email profilePic")
              .lean();
          }
          
          employeeShares.push({
            taskId: task._id,
            taskTitle: task.title,
            sharedBy,
            sharedTo,
            sharedToModel: share.sharedToModel,
            sharedAt: share.sharedAt,
            _id: share._id
          });
        }
      }
    }

    // Sort by sharedAt descending
    employeeShares.sort((a, b) => new Date(b.sharedAt) - new Date(a.sharedAt));

    return NextResponse.json(employeeShares, { status: 200 });
  } catch (error) {
    console.error("Error fetching employee shares:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}