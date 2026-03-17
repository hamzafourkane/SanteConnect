import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../services/api';
import { Bell, MessageSquare, UserCheck, Shield, X, CheckCircle } from 'lucide-react';

export default function NotificationsPanel({ onClose }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await notificationsAPI.getAll({ limit: 20 });
            if (response.success) {
                setNotifications(response.notifications);
                setUnreadCount(response.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (notificationId) => {
        try {
            await notificationsAPI.markAsRead(notificationId);
            setNotifications(prev => prev.map(n => 
                n._id === notificationId ? { ...n, is_read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationsAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const getTypeConfig = (type) => {
        switch (type) {
            case 'RECOMMENDATION':
                return {
                    icon: <MessageSquare className="w-5 h-5" />,
                    bgColor: 'bg-purple-100',
                    iconColor: 'text-purple-500'
                };
            case 'CONSENT_GRANTED':
                return {
                    icon: <UserCheck className="w-5 h-5" />,
                    bgColor: 'bg-green-100',
                    iconColor: 'text-green-500'
                };
            case 'DOCTOR_VERIFIED':
                return {
                    icon: <Shield className="w-5 h-5" />,
                    bgColor: 'bg-emerald-100',
                    iconColor: 'text-emerald-500'
                };
            default:
                return {
                    icon: <Bell className="w-5 h-5" />,
                    bgColor: 'bg-blue-100',
                    iconColor: 'text-blue-500'
                };
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl mt-16 mr-4 overflow-hidden animate-slideIn">
                <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <Bell className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Notifications</h2>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {unreadCount > 0 && (
                    <div className="p-3 bg-slate-50 border-b">
                        <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Mark all as read
                        </button>
                    </div>
                )}

                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="w-16 h-16 mx-auto mb-3 text-slate-300" />
                            <p className="text-slate-600 font-medium">No notifications</p>
                            <p className="text-sm text-slate-400">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {notifications.map((notification) => {
                                const config = getTypeConfig(notification.type);
                                return (
                                    <div
                                        key={notification._id}
                                        className={`p-4 ${!notification.is_read ? 'bg-primary-50' : 'bg-white'} hover:bg-slate-50 transition-colors cursor-pointer`}
                                        onClick={() => !notification.is_read && handleMarkAsRead(notification._id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-full ${config.bgColor} ${config.iconColor}`}>
                                                {config.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="font-semibold text-slate-800 text-sm">
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.is_read && (
                                                        <span className="w-2 h-2 bg-primary-500 rounded-full"></span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-slate-600">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(notification.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
