import FormSubmission from "@/models/FormSubmission";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const managerId = session.user.id;

    // Find submissions where this manager is in the multipleManagerShared array
    const submissions = await FormSubmission.find({
      multipleManagerShared: managerId
    })
      .populate("formId", "title description fields depId")
      .populate("submittedBy", "firstName lastName email")
      .populate("multipleManagerShared", "firstName lastName email")
      .populate("sharedBy", "firstName lastName email")
      .populate("assignedEmployees.employeeId", "firstName lastName email depId")
      .populate("assignedTo", "firstName lastName email")
      .populate("multipleTeamLeadAssigned", "firstName lastName email")
      .sort({ createdAt: -1 })
      .lean();

    return Response.json(submissions, { status: 200 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}