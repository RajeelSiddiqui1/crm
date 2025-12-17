import FormSubmission from "@/models/FormSubmission";
import Manager from "@/models/Manager";
import dbConnect from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import { unsharedMyTaskMailTemplate } from "@/helper/emails/manager/unsharedMyTask";

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "Manager") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id, managerId } = params;

    const submission = await FormSubmission.findById(id);
    if (!submission) {
      return Response.json({ error: "Submission not found" }, { status: 404 });
    }

    // Only owner can unshare
    if (submission.submittedBy.toString() !== session.user.id) {
      return Response.json(
        { error: "Only the owner can remove sharing" },
        { status: 403 }
      );
    }

    // Check already removed
    if (!submission.multipleManagerShared.includes(managerId)) {
      return Response.json(
        { error: "Manager is not shared with this submission" },
        { status: 400 }
      );
    }

    // Remove manager
    submission.multipleManagerShared = submission.multipleManagerShared.filter(
      (mId) => mId.toString() !== managerId
    );

    await submission.save();

    // ---------------------------
    // NOTIFICATION + EMAIL
    // ---------------------------
    const manager = await Manager.findById(managerId);
    const submissionLink = `${process.env.NEXT_PUBLIC_DOMAIN}/submission/${id}`;

    if (manager) {
      await Promise.all([
        // 🔔 Notification
        sendNotification({
          senderId: session.user.id,
          senderModel: "Manager",
          senderName: session.user.name,
          receiverId: manager._id,
          receiverModel: "Manager",
          type: "submission_unshared",
          title: "Submission Access Removed",
          message: "Your access to a submission has been removed.",
          link: submissionLink,
          referenceId: submission._id,
          referenceModel: "FormSubmission",
        }),

        // 📧 Email
        sendMail(
          manager.email,
          "Submission Access Removed",
          unsharedMyTaskMailTemplate(
            `${manager.firstName} ${manager.lastName}`,
            submission.formTitle || "Form Submission",
            session.user.name
          )
        ),
      ]);
    }

    return Response.json({
      success: true,
      message: "Manager removed from sharing",
    });
  } catch (error) {
    console.error("Submission Unshare Error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
