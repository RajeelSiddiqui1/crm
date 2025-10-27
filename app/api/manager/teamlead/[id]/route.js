// app/api/manager/teamlead/[id]/route.js
import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import TeamLead from "@/models/TeamLead";

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = params;
    const body = await req.json();

    const updatedLead = await TeamLead.findByIdAndUpdate(
      id,
      {
        $set: {
          firstName: body.firstName,
          lastName: body.lastName,
          phone: body.phone,
          address: body.address,
          depId: body.depId,
          startTime: body.startTime,
          endTime: body.endTime,
        },
      },
      { new: true }
    ).populate("depId", "name");

    if (!updatedLead) {
      return NextResponse.json({ message: "Team Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ teamLead: updatedLead }, { status: 200 });
  } catch (error) {
    console.error("Update Team Lead Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
