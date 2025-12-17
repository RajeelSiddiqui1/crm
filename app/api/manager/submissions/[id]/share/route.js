import FormSubmission from "@/models/FormSubmission";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { sharedMyTaskMailTemplate } from "@/helper/emails/manager/sharedMyTask";

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const { managerIds } = await req.json();

    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return Response.json({ error: "Submission not found" }, { status: 404 });
    }

    // Only owner can share
    if (submission.submittedBy.toString() !== session.user.id) {
      return Response.json(
        { error: "Only the owner can share this submission" },
        { status: 403 }
      );
    }

    // Save shared managers
    submission.multipleManagerShared = managerIds;
    submission.sharedBy = session.user.id;
    await submission.save();

    // ---------------------------
    // NOTIFICATION + EMAIL
    // ---------------------------
    const managers = await Manager.find({ _id: { $in: managerIds } });
    const submissionLink = `${process.env.NEXT_PUBLIC_DOMAIN}/submissions`;

    await Promise.all(
      managers.map(async (manager) => {
        // 🔔 Notification
        await sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "submission_shared",
          title: "New Submission Shared",
          message: `A submission has been shared with you.`,
          link: submissionLink,
          referenceId: submission._id,
          referenceModel: "FormSubmission",
        });

        // 📧 Email
        const emailHtml = sharedMyTaskMailTemplate(
          `${manager.firstName} ${manager.lastName}`,
          submission.formTitle || "Form Submission",
          session.user.name,
          submissionLink
        );

        await sendMail(
          manager.email,
          "A Submission Has Been Shared With You",
          emailHtml
        );
      })
    );

    return Response.json({
      success: true,
      message: "Submission shared successfully",
    });
  } catch (error) {
    console.error("Submission Share Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
