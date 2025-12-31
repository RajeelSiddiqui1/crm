import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AdminTask2 from "@/models/AdminTask2";
import Employee from "@/models/Employee";
import TeamLead from "@/models/TeamLead";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendNotification } from "@/lib/sendNotification";
import { sendMail } from "@/lib/mail";
import adminTaskShared from "@/helper/emails/employee/adminTaskShared";
import adminTaskStatus from "@/helper/emails/employee/adminTaskStatus";

// --------------------
// UPDATE STATUS ROUTE
// --------------------
export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        const user = session?.user;
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { status, feedback } = await req.json();
        const taskId = params.id;

        const task = await AdminTask2.findById(taskId)
            .populate("submittedBy", "email name")
            .populate("teamleads.teamleadId", "email name")
            .populate("employees.employeeId", "email name");

        if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

        let updated = false;

        // Employee update
        const emp = task.employees.find(e => e.employeeId._id.toString() === user.id);
        if (emp) {
            emp.status = status;
            if (status === "completed") emp.completedAt = new Date();
            updated = true;
        }

        // TeamLead update
        const tl = task.teamleads.find(t => t.teamleadId._id.toString() === user.id);
        if (tl) {
            tl.status = status;
            if (status === "completed") tl.completedAt = new Date();
            updated = true;
        }

        if (!updated) return NextResponse.json({ message: "You are not assigned to this task" }, { status: 403 });

        await task.save();

        // Collect unique recipients
        const recipients = [];
        task.employees.forEach(e => e.employeeId.email && recipients.push({ email: e.employeeId.email, name: e.employeeId.name }));
        task.teamleads.forEach(t => t.teamleadId.email && recipients.push({ email: t.teamleadId.email, name: t.teamleadId.name }));
        if (task.submittedBy?.email) recipients.push({ email: task.submittedBy.email, name: task.submittedBy.name });

        // Parallel Emails + Notifications
        await Promise.all([
            ...recipients.map(r =>
                sendMail({
                    to: r.email,
                    subject: "Task Status Updated",
                    html: adminTaskStatus({
                        recipientName: r.name,
                        taskTitle: task.title,
                        updaterName: user.name,
                        status,
                        feedback,
                    }),
                })
            ),
            // Send notifications to all recipients
            ...recipients.map(r =>
                sendNotification({
                    senderId: user.id,
                    senderModel: user.role,
                    senderName: user.name,
                    receiverId: r.email,
                    receiverModel: "Employee",
                    type: "task_update",
                    title: "Task Status Updated",
                    message: `${user.name} updated task status to ${status}`,
                    link: `/employee/admin-tasks`,
                    referenceId: task._id,
                    referenceModel: "AdminTask2",
                })
            ),
        ]);

        return NextResponse.json({ message: "Status updated successfully" }, { status: 200 });

    } catch (error) {
        console.error("PUT Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}

// --------------------
// SHARE TASK ROUTE
// --------------------
export async function POST(req, { params }) {
    try {
        await dbConnect();
        const session = await getServerSession(authOptions);
        const user = session?.user;
        if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { sharedToId, sharedToModel } = await req.json();
        if (!["Employee", "TeamLead"].includes(sharedToModel)) return NextResponse.json({ message: "Invalid sharedTo model" }, { status: 400 });

        const taskId = params.id;
        const task = await AdminTask2.findById(taskId)
            .populate("employees.employeeId", "email name")
            .populate("teamleads.teamleadId", "email name");

        if (!task) return NextResponse.json({ message: "Task not found" }, { status: 404 });

        let recipient;

        if (sharedToModel === "Employee") {
            recipient = task.employees.find(e => e.employeeId._id.toString() === sharedToId)?.employeeId;
            if (!recipient) {
                recipient = await Employee.findById(sharedToId);
                if (recipient) task.employees.push({ employeeId: sharedToId, status: "pending" });
            }
        } else {
            recipient = task.teamleads.find(t => t.teamleadId._id.toString() === sharedToId)?.teamleadId;
            if (!recipient) {
                recipient = await TeamLead.findById(sharedToId);
                if (recipient) task.teamleads.push({ teamleadId: sharedToId, status: "pending" });
            }
        }

        // Shared meta
        task.sharedBY = user.id;
        task.sharedByModel = user.role; // Employee | TeamLead
        task.sharedTo = sharedToId;
        task.sharedToModel = sharedToModel;

        await task.save();

        // Parallel Email + Notification
        await Promise.all([
            recipient?.email ? sendMail({
                to: recipient.email,
                subject: "New Task Shared",
                html: adminTaskShared({
                    recipientName: recipient.name || recipient.firstName,
                    taskTitle: task.title,
                    sharedBy: user.name,
                }),
            }) : null,
            recipient ? sendNotification({
                senderId: user.id,
                senderModel: user.role,
                senderName: user.name,
                receiverId: sharedToId,
                receiverModel: sharedToModel,
                type: "task_shared",
                title: "Task Shared",
                message: `${user.name} shared a task with you`,
                link: `/employee/admin-tasks`,
                referenceId: task._id,
                referenceModel: "AdminTask2",
            }) : null,
        ].filter(Boolean));

        return NextResponse.json({ message: "Task shared successfully" }, { status: 200 });

    } catch (error) {
        console.error("POST Error:", error);
        return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
    }
}
