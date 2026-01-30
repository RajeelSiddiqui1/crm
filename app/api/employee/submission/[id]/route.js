import { NextResponse } from "next/server";

import TaskSubmission from "@/models/TaskSubmission";
import dbConnect from "@/lib/db";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const { id } = params;

    const submission = await TaskSubmission.findById(id);

    if (!submission)
      return NextResponse.json({ message: "Not found" }, { status: 404 });

    for (const file of submission.fileAttachments) {
      if (file.publicId) {
        await deleteFromCloudinary(file.publicId);
      }
    }

    await submission.deleteOne();

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
