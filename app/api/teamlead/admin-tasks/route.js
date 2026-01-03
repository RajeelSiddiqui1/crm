import { NextResponse } from "next/server";
import AdminTask2 from "@/models/AdminTask2";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import Department from "@/models/Department";
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

    console.log("Fetching tasks for teamlead:", teamleadId);

    // Get tasks where teamlead is assigned or has access via sharing
    const tasks = await AdminTask2.find({
      $or: [
        { "teamleads.teamleadId": teamleadId },
        { "shares.sharedTo": teamleadId, "shares.sharedToModel": "TeamLead" }
      ]
    })
      .populate({
        path: "teamleads.teamleadId",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "employees.employeeId",
        select: "firstName lastName email profilePic department",
      })
      .populate({
        path: "sharedBY",
        select: "firstName lastName email profilePic",
      })
      .populate({
        path: "departments",
        select: "name color",
      })
      .populate({
        path: "submittedBy",
        select: "firstName lastName email profilePic",
      })
      .lean()
      .sort({ createdAt: -1 });

    console.log("Raw tasks found for teamlead:", tasks.length);

    // Manually populate shares
    const tasksWithPopulatedShares = await Promise.all(
      tasks.map(async (task) => {
        const populatedShares = [];
        
        for (const share of task.shares || []) {
          try {
            let sharedTo = null;
            let sharedBy = null;

            // Populate sharedTo
            if (share.sharedToModel === "Employee") {
              sharedTo = await Employee.findById(share.sharedTo)
                .select("firstName lastName email profilePic")
                .lean();
            } else if (share.sharedToModel === "TeamLead") {
              sharedTo = await TeamLead.findById(share.sharedTo)
                .select("firstName lastName email profilePic")
                .lean();
            }

            // Populate sharedBy
            if (share.sharedByModel === "Employee") {
              sharedBy = await Employee.findById(share.sharedBy)
                .select("firstName lastName email profilePic")
                .lean();
            } else if (share.sharedByModel === "TeamLead") {
              sharedBy = await TeamLead.findById(share.sharedBy)
                .select("firstName lastName email profilePic")
                .lean();
            }

            populatedShares.push({
              ...share,
              sharedTo,
              sharedBy,
              _id: share._id || share._id?.toString()
            });
          } catch (err) {
            console.error("Error populating share:", err);
            populatedShares.push(share);
          }
        }

        return {
          ...task,
          _id: task._id.toString(),
          shares: populatedShares
        };
      })
    );

    console.log("Tasks with populated shares for teamlead:", tasksWithPopulatedShares.length);
    
    return NextResponse.json(tasksWithPopulatedShares, { status: 200 });
  } catch (error) {
    console.error("Error fetching teamlead tasks:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}