import Subtask from "@/models/Subtask";
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
    try {
        await dbConnect();

        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== "Admin") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;

        // Build filter
        const filter = {};
        if (status && status !== 'all') filter.status = status;
        if (priority && priority !== 'all') filter.priority = priority;

        // Get subtasks with counts
        const [subtasks, total] = await Promise.all([
            Subtask.find(filter)
                .populate("teamLeadId", "firstName lastName email profilePic")
                .populate("depId", "name")
                .populate("submissionId", "formTitle")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Subtask.countDocuments(filter)
        ]);

        // Get status counts
        const statusCounts = await Subtask.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        return NextResponse.json({
            subtasks,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            },
            statusCounts,
            filters: {
                status,
                priority
            }
        });
    } catch (error) {
        console.error("Error fetching subtasks:", error);
        return NextResponse.json({ error: "Failed to fetch subtasks" }, { status: 500 });
    }
}