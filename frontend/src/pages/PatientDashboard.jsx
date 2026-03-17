import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Plus, Heart, TrendingUp, MessageSquare, Bell, AlertTriangle, FileText } from 'lucide-react';
import AddMeasurementModal from '../components/Patient/AddMeasurementModal';
import MeasurementHistory from '../components/Patient/MeasurementHistory';
import ConsentManager from '../components/Patient/ConsentManager';
import AlertsPanel from '../components/Patient/AlertsPanel';
import NotificationsPanel from '../components/Patient/NotificationsPanel';
import ReportGenerator from '../components/Patient/ReportGenerator';
import { recommendationsAPI, measurementsAPI, alertsAPI, notificationsAPI } from '../services/api';

export default function PatientDashboard() {
    const { user, logout } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showReportGenerator, setShowReportGenerator] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const [stats, setStats] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [unreadAlerts, setUnreadAlerts] = useState(0);
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    useEffect(() => {
        fetchRecommendations();
        fetchStats();
        fetchUnreadCounts();
    }, [refreshKey]);

    const fetchRecommendations = async () => {
        try {
            const response = await recommendationsAPI.getAll();
            if (response.success) {
                setRecommendations(response.recommendations);
            }
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await measurementsAPI.getStatistics();
            if (response.success) {
                setStats(response.statistics);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    };

    const fetchUnreadCounts = async () => {
        try {
            const [alertsRes, notifRes] = await Promise.all([
                alertsAPI.getUnreadCount(),
                notificationsAPI.getUnreadCount()
            ]);
            if (alertsRes.success) setUnreadAlerts(alertsRes.count);
            if (notifRes.success) setUnreadNotifications(notifRes.count);
        } catch (error) {
            console.error('Failed to fetch unread counts:', error);
        }
    };

    const handleMeasurementAdded = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="min-h-screen p-6 relative overflow-hidden">
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 -left-40 w-96 h-96 bg-primary-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float"></div>
                <div className="absolute top-40 -right-40 w-96 h-96 bg-accent-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>
                <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-success-400/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '4s' }}></div>
            </div>

            <div className="relative z-10">
                <header className="mb-8 animate-slide-down">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-pulse-slow">
                                <Heart className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-gradient mb-1">Welcome back, {user?.name}!</h1>
                                <p className="text-slate-600 flex items-center gap-2">
                                    <span className="inline-block w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                                    Patient Dashboard • Active
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAlerts(true)}
                                className="relative p-3 bg-white/90 backdrop-blur-sm text-slate-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-100"
                            >
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                {unreadAlerts > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {unreadAlerts}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowNotifications(true)}
                                className="relative p-3 bg-white/90 backdrop-blur-sm text-slate-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-100"
                            >
                                <Bell className="w-5 h-5 text-primary-500" />
                                {unreadNotifications > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {unreadNotifications}
                                    </span>
                                )}
                            </button>

                            <button
                                onClick={() => setShowReportGenerator(true)}
                                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            >
                                <FileText className="w-5 h-5" />
                                <span className="hidden md:inline">Generate Report</span>
                            </button>

                            <button
                                onClick={logout}
                                className="flex items-center gap-2 px-5 py-3 bg-white/90 backdrop-blur-sm text-slate-700 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border border-slate-100"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="group glass-card p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500 border-2 border-white/50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-danger-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-danger-100 to-danger-200 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">🩺</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800">Blood Pressure</h3>
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-success-500" />
                                </div>
                                <p className="text-3xl font-bold text-slate-900 mb-1">
                                    {stats.TENSION?.latest ?
                                        `${stats.TENSION.latest.systolic}/${stats.TENSION.latest.diastolic}` :
                                        'No data'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">{stats.TENSION?.count || 0} total records</p>
                                    <span className="badge badge-success text-xs">mmHg</span>
                                </div>
                            </div>
                        </div>

                        <div className="group glass-card p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500 border-2 border-white/50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">⚖️</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800">Weight</h3>
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-primary-500" />
                                </div>
                                <p className="text-3xl font-bold text-slate-900 mb-1">
                                    {stats.POIDS?.latest?.value ?
                                        `${stats.POIDS.latest.value}` :
                                        'No data'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">{stats.POIDS?.count || 0} total records</p>
                                    <span className="badge badge-primary text-xs">kg</span>
                                </div>
                            </div>
                        </div>

                        <div className="group glass-card p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500 border-2 border-white/50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-accent-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-accent-100 to-accent-200 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">😴</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800">Sleep</h3>
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-accent-500" />
                                </div>
                                <p className="text-3xl font-bold text-slate-900 mb-1">
                                    {stats.SOMMEIL?.latest?.value ?
                                        `${stats.SOMMEIL.latest.value}` :
                                        'No data'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">{stats.SOMMEIL?.count || 0} total records</p>
                                    <span className="badge text-xs bg-accent-100 text-accent-700">hours</span>
                                </div>
                            </div>
                        </div>

                        <div className="group glass-card p-6 hover:scale-105 hover:shadow-2xl transition-all duration-500 border-2 border-white/50 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-success-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-success-100 to-success-200 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                                            <span className="text-2xl">🏃</span>
                                        </div>
                                        <h3 className="font-bold text-slate-800">Activity</h3>
                                    </div>
                                    <TrendingUp className="w-5 h-5 text-success-500" />
                                </div>
                                <p className="text-3xl font-bold text-slate-900 mb-1">
                                    {stats.ACTIVITE?.latest ?
                                        `${stats.ACTIVITE.latest.steps || 0}` :
                                        'No data'}
                                </p>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-slate-500">{stats.ACTIVITE?.count || 0} total records</p>
                                    <span className="badge text-xs bg-success-100 text-success-700">steps</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary flex items-center gap-2 shadow-2xl shadow-primary-500/30"
                    >
                        <Plus className="w-5 h-5" />
                        Add Measurement
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <MeasurementHistory key={refreshKey} />
                    </div>

                    <div className="space-y-6">
                        <ConsentManager />

                        <div className="glass-card p-6 border-2 border-white/50 shadow-2xl h-fit">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-lg">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Doctor Recommendations</h2>
                                    <p className="text-xs text-slate-500">Professional advice</p>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {recommendations.length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <MessageSquare className="w-8 h-8 opacity-50" />
                                        </div>
                                        <p className="text-sm font-medium">No recommendations yet</p>
                                        <p className="text-xs mt-1">Your doctor's advice will appear here</p>
                                    </div>
                                ) : (
                                    recommendations.map((rec, index) => (
                                    <div key={index} className="group p-5 bg-gradient-to-br from-white to-slate-50/50 rounded-xl border-2 border-slate-100 hover:border-success-300 hover:shadow-lg transition-all duration-300">
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-success-100 to-success-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                                                <span className="text-lg">👨‍⚕️</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-slate-800">
                                                    {rec.doctor?.name || 'Doctor'}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <span className="w-1 h-1 bg-success-500 rounded-full"></span>
                                                    {new Date(rec.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-700 leading-relaxed pl-13">
                                            {rec.message}
                                        </p>
                                    </div>
                                ))
                            )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AddMeasurementModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleMeasurementAdded}
            />

            {showAlerts && (
                <AlertsPanel onClose={() => {
                    setShowAlerts(false);
                    fetchUnreadCounts();
                }} />
            )}

            {showNotifications && (
                <NotificationsPanel onClose={() => {
                    setShowNotifications(false);
                    fetchUnreadCounts();
                }} />
            )}

            {showReportGenerator && (
                <ReportGenerator onClose={() => setShowReportGenerator(false)} />
            )}
        </div>
    );
}
