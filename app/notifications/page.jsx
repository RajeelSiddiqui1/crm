"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle, Clock, User, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            router.push("/login");
            return;
        }
        fetchNotifications();
    }, [session, status, router]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/api/notifications");
            if (response.data.success) {
                setNotifications(response.data.notifications || []);
                // Mark all as seen when page loads
                await axios.patch("/api/notifications/seen");
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationClick = async (notification) => {
        try {
            // Mark as read individually if needed
            await axios.patch(`/api/notifications/seen?id=${notification._id}`);
            if (notification.link) router.push(notification.link);
        } catch (error) {
            console.error(error);
            if (notification.link) router.push(notification.link);
        }
    };

    const getNotificationIcon = (type) => {
        const sizeClass = "w-5 h-5";
        switch (type) {
            case 'task_assigned': return <FileText className={`${sizeClass} text-blue-600`} />;
            case 'task_completed': return <CheckCircle className={`${sizeClass} text-green-600`} />;
            case 'task_rejected': return <AlertCircle className={`${sizeClass} text-red-600`} />;
            default: return <Bell className={`${sizeClass} text-gray-600`} />;
        }
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'task_assigned': return 'bg-blue-50 border border-blue-200 hover:bg-blue-100';
            case 'task_completed': return 'bg-green-50 border border-green-200 hover:bg-green-100';
            case 'task_rejected': return 'bg-red-50 border border-red-200 hover:bg-red-100';
            default: return 'bg-gray-50 border border-gray-200 hover:bg-gray-100';
        }
    };

    const formatDate = (dateString) =>
        new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-white p-6">
                <div className="max-w-4xl mx-auto animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded mb-4"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg shadow border border-gray-300">
                            <Bell className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-gray-600">Your recent activities and updates</p>
                        </div>
                    </div>
                    <Button 
                        onClick={fetchNotifications} 
                        variant="outline" 
                        className="flex items-center gap-2 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    >
                        <Clock className="w-4 h-4" />
                        Refresh
                    </Button>
                </div>

                {/* Notifications List */}
                <Card className="shadow-lg border border-gray-300 bg-white">
                    <CardHeader className="bg-white border-b border-gray-300">
                        <CardTitle className="text-gray-900 font-bold">
                            All Notifications ({notifications.length})
                        </CardTitle>
                        <CardDescription className="text-gray-600">
                            Latest first
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px]">
                            {notifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        No notifications yet
                                    </h3>
                                    <p className="text-gray-600">
                                        You're all caught up! New notifications will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2 p-4">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`p-4 rounded-lg cursor-pointer transition-all hover:shadow-md flex gap-3 items-start ${getNotificationColor(notification.type)}`}
                                        >
                                            <div className="flex-shrink-0 mt-1">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-semibold text-gray-900 text-sm truncate">
                                                        {notification.title}
                                                    </h4>
                                                    <Badge 
                                                        variant="outline" 
                                                        className="text-xs capitalize bg-gray-100 text-gray-700 border-gray-300"
                                                    >
                                                        {notification.type.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-gray-700 text-sm mb-2">{notification.message}</p>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            <span className="text-gray-600">
                                                                {notification.sender?.name || 'System'}
                                                            </span>
                                                        </div>
                                                        <span className="text-gray-500">
                                                            {formatDate(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    {!notification.seen && (
                                                        <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}