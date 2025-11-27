import Notification from "@/models/Notification";
import dbConnect from "./db";

export async function sendNotification({
    senderId,
    senderModel,
    senderName,        // required
    receiverId,
    receiverModel,
    type,
    link,
    referenceId = null,
    referenceModel = null,
    message = "",
    title = "",        // required
}) {
    try {
        await dbConnect();

        const notification = await Notification.create({
            sender: { id: senderId, model: senderModel, name: senderName },
            receiver: { id: receiverId, model: receiverModel },
            type,
            link,
            referenceId,
            referenceModel,
            message,
            title,
        });

        return notification;

    } catch (error) {
        console.log("Notification Error:", error);
        return null;
    }
}
