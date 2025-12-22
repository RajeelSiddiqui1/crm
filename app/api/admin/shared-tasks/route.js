import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import SharedTask from "@/models/SharedTask";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "Admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sharedTasks = await SharedTask.find({})
      .populate('sharedBy', 'firstName lastName email')
      .populate('sharedManager', 'firstName lastName email')
      .populate('sharedTeamlead', 'firstName lastName email')
      .populate('sharedEmployee', 'firstName lastName email')
      .populate('sharedOperationTeamlead', 'firstName lastName email')
      .populate('sharedOperationEmployee', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(sharedTasks);
  } catch (error) {
    console.error("Error fetching shared tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared tasks" },
      { status: 500 }
    );
  }
}