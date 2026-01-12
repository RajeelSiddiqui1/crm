import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FormSubmission from "@/models/FormSubmission";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params: { id } }) {
  try {
    await dbConnect();

    // ✅ ID validation (important)
    if (!id || !/^[0-9a-fA-F]{24}$/.test(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Admin") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const submission = await FormSubmission.findById(id)
      .select("auditTrail timelineEvents createdAt updatedAt")
      .lean();

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const timeline = [];

    // Creation
    timeline.push({
      id: "creation",
      title: "Submission Created",
      description: "New submission was created",
      type: "creation",
      timestamp: submission.createdAt,
      icon: "plus",
      color: "blue"
    });

    // Updated
    if (
      submission.updatedAt &&
      submission.updatedAt.getTime() !== submission.createdAt.getTime()
    ) {
      timeline.push({
        id: "update",
        title: "Submission Updated",
        description: "Submission was last updated",
        type: "update",
        timestamp: submission.updatedAt,
        icon: "edit",
        color: "green"
      });
    }

    // Audit trail
    if (Array.isArray(submission.auditTrail)) {
      submission.auditTrail.forEach((event, index) => {
        timeline.push({
          id: `audit-${index}`,
          title: event.action,
          description: event.description || event.action,
          type: "audit",
          timestamp: event.timestamp,
          metadata: event.details || {},
          icon: "shield",
          color: "purple"
        });
      });
    }

    // Timeline events
    if (Array.isArray(submission.timelineEvents)) {
      submission.timelineEvents.forEach((event, index) => {
        timeline.push({
          id: `event-${index}`,
          title: event.title,
          description: event.description,
          type: event.type,
          timestamp: event.timestamp,
          metadata: event.metadata || {},
          icon: event.icon || "circle",
          color: event.color || "gray"
        });
      });
    }

    timeline.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );

    return NextResponse.json({ timeline }, { status: 200 });

  } catch (error) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
