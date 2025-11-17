import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import EmployeeFormSubmission from "@/models/EmployeeFormSubmission";
import Subtask from "@/models/Subtask";
import EmployeeForm from "@/models/EmployeeForm";
import mongoose from "mongoose";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
    try {
        const session = await getServerSession(authOptions);
        console.log("Session:", session); // Debug log
        
        if (!session || session.user.role !== "TeamLead") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await dbConnect();

        const { id } = await params;
        console.log("Subtask ID:", id); // Debug log

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: "Invalid subtask ID" }, { status: 400 });
        }

        const subtask = await Subtask.findById(id);
        console.log("Subtask:", subtask); // Debug log
        
        if (!subtask) {
            return NextResponse.json({ error: "Subtask not found" }, { status: 404 });
        }

        console.log("Subtask TeamLeadId:", subtask.teamLeadId?.toString()); // Debug log
        console.log("Session User ID:", session.user.id); // Debug log

        // Temporary: Access check disable karo testing ke liye
        // if (subtask.teamLeadId.toString() !== session.user.id) {
        //     return NextResponse.json({ error: "Access denied" }, { status: 403 });
        // }

        const submissions = await EmployeeFormSubmission.find({ subtaskId: id })
            .populate("formId", "title description fields")
            .populate("employeeId", "firstName lastName email department avatar")
            .populate("subtaskId", "title description")
            .sort({ createdAt: -1 });

        console.log("Found submissions:", submissions.length); // Debug log

        return NextResponse.json(submissions, { status: 200 });

    } catch (error) {
        console.error("Error fetching employee submissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch employee submissions" },
            { status: 500 }
        );
    }
}