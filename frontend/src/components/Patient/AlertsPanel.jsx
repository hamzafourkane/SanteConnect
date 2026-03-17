import { useState, useEffect } from 'react';
import { alertsAPI } from '../../services/api';
import { Bell, AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';

export default function AlertsPanel({ onClose }) {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await alertsAPI.getAll({ limit: 20 });
            if (response.success) {
                setAlerts(response.alerts);
                setUnreadCount(response.unread_count);
            }
        } catch (error) {
            console.error('Failed to fetch alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (alertId) => {
        try {
            await alertsAPI.markAsRead(alertId);
            setAlerts(prev => prev.map(a => 
                a._id === alertId ? { ...a, is_read: true } : a
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark alert as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await alertsAPI.markAllAsRead();
            setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all alerts as read:', error);
        }
    };

    const getSeverityConfig = (severity) => {
        switch (severity) {
            case 'CRITICAL':
                return {
                    icon: <AlertTriangle className="w-5 h-5" />,
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-300',
                    textColor: 'text-red-700',
                    iconColor: 'text-red-500'
                };
            case 'HIGH':
                return {
                    icon: <AlertCircle className="w-5 h-5" />,
                    bgColor: 'bg-orange-50',
                    borderColor: 'border-orange-300',
                    textColor: 'text-orange-700',
                    iconColor: 'text-orange-500'
                };
            case 'MEDIUM':
                return {
                    icon: <Info className="w-5 h-5" />,
                    bgColor: 'bg-amber-50',
                    borderColor: 'border-amber-300',
                    textColor: 'text-amber-700',
                    iconColor: 'text-amber-500'
                };
            default:
                return {
                    icon: <Info className="w-5 h-5" />,
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-300',
                    textColor: 'text-blue-700',
                    iconColor: 'text-blue-500'
                };
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-end z-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl mt-16 mr-4 overflow-hidden animate-slideIn">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <AlertTriangle className="w-6 h-6" />
                            <h2 className="text-xl font-bold">Health Alerts</h2>
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
                            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="p-8 text-center">
                            <CheckCircle className="w-16 h-16 mx-auto mb-3 text-green-400" />
                            <p className="text-slate-600 font-medium">No health alerts</p>
                            <p className="text-sm text-slate-400">Your measurements are within normal range</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {alerts.map((alert) => {
                                const config = getSeverityConfig(alert.severity);
                                return (
                                    <div
                                        key={alert._id}
                                        className={`p-4 ${!alert.is_read ? config.bgColor : 'bg-white'} hover:bg-slate-50 transition-colors cursor-pointer`}
                                        onClick={() => !alert.is_read && handleMarkAsRead(alert._id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-0.5 ${config.iconColor}`}>
                                                {config.icon}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${config.bgColor} ${config.textColor}`}>
                                                        {alert.severity}
                                                    </span>
                                                    {!alert.is_read && (
                                                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                                    )}
                                                </div>
                                                <p className={`text-sm ${config.textColor} font-medium`}>
                                                    {alert.message}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-1">
                                                    {new Date(alert.created_at).toLocaleString()}
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
