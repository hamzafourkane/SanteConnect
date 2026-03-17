import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { 
    LogOut, Users, UserCheck, UserX, Shield, Activity, 
    Clock, CheckCircle, XCircle, AlertTriangle, FileText,
    Search, RefreshCw
} from 'lucide-react';

export default function AdminDashboard() {
    const { user, logout } = useAuth();
    const [stats, setStats] = useState(null);
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending');
    const [actionLoading, setActionLoading] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshMessage, setRefreshMessage] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
            setRefreshMessage('');
        } else {
            setLoading(true);
        }
        try {
            const results = await Promise.allSettled([
                adminAPI.getStatistics(),
                adminAPI.getPendingDoctors(),
                adminAPI.getAuditLogs({ limit: 20 })
            ]);

            const [statsResult, pendingResult, logsResult] = results;

            console.log('Fetch results:', { statsResult, pendingResult, logsResult });

            if (statsResult.status === 'fulfilled') {
                const data = statsResult.value?.data || statsResult.value;
                if (data) setStats(data);
            }
            
            if (pendingResult.status === 'fulfilled') {
                const doctors = pendingResult.value?.doctors || pendingResult.value || [];
                setPendingDoctors(doctors);
                if (isRefresh) {
                    setRefreshMessage(`Found ${doctors.length || 0} pending doctors`);
                    setTimeout(() => setRefreshMessage(''), 3000);
                }
            } else if (isRefresh) {
                console.error('Pending doctors failed:', pendingResult.reason);
                setRefreshMessage('Failed to refresh pending doctors');
                setTimeout(() => setRefreshMessage(''), 3000);
            }
            
            if (logsResult.status === 'fulfilled') {
                const logs = logsResult.value?.logs || logsResult.value || [];
                setAuditLogs(logs);
            }

        } catch (error) {
            console.error('Failed to fetch admin data:', error);
            if (isRefresh) {
                setRefreshMessage('Failed to refresh - check connection');
                setTimeout(() => setRefreshMessage(''), 3000);
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleVerifyDoctor = async (doctorId) => {
        setActionLoading(doctorId);
        try {
            const response = await adminAPI.verifyDoctor(doctorId);
            if (response.success) {
                setPendingDoctors(prev => prev.filter(d => d.id !== doctorId));
                fetchData(true); 
            }
        } catch (error) {
            console.error('Failed to verify doctor:', error);
            alert('Failed to verify doctor');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRejectDoctor = async (doctorId) => {
        const reason = prompt('Enter rejection reason (optional):');
        setActionLoading(doctorId);
        try {
            const response = await adminAPI.rejectDoctor(doctorId, reason || '');
            if (response.success) {
                setPendingDoctors(prev => prev.filter(d => d.id !== doctorId));
                fetchData(true); 
            }
        } catch (error) {
            console.error('Failed to reject doctor:', error);
            alert('Failed to reject doctor');
        } finally {
            setActionLoading(null);
        }
    };

    const getEventIcon = (eventType) => {
        switch (eventType) {
            case 'MEASUREMENT_CREATED': return <Activity className="w-4 h-4 text-green-500" />;
            case 'ACCESS_PATIENT_DATA': return <FileText className="w-4 h-4 text-blue-500" />;
            case 'RECOMMENDATION_SENT': return <CheckCircle className="w-4 h-4 text-purple-500" />;
            case 'DOCTOR_VERIFIED': return <UserCheck className="w-4 h-4 text-emerald-500" />;
            case 'DOCTOR_REJECTED': return <UserX className="w-4 h-4 text-red-500" />;
            default: return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 via-purple-50 to-indigo-100 p-6">
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Admin Portal</h1>
                            <p className="text-slate-600">Welcome, {user?.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all"
                        >
                            <LogOut className="w-5 h-5" />
                            Logout
                        </button>
                    </div>
                </div>
                
                {refreshMessage && (
                    <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-purple-600 text-white rounded-lg shadow-lg animate-slide-up">
                        {refreshMessage}
                    </div>
                )}
            </header>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="glass-card p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-blue-600">{stats?.total_patients || 0}</p>
                            <p className="text-sm text-slate-600">Patients</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-600">{stats?.verified_doctors || 0}</p>
                            <p className="text-sm text-slate-600">Verified Doctors</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 bg-gradient-to-br from-amber-50 to-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-amber-600">{stats?.pending_doctors || 0}</p>
                            <p className="text-sm text-slate-600">Pending Approval</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card p-6 bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-purple-600">{stats?.total_measurements || 0}</p>
                            <p className="text-sm text-slate-600">Measurements</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <UserCheck className="w-6 h-6 text-amber-500" />
                                Pending Doctor Verifications
                            </h2>
                            {pendingDoctors.length > 0 && (
                                <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-semibold">
                                    {pendingDoctors.length} pending
                                </span>
                            )}
                        </div>

                        {pendingDoctors.length === 0 ? (
                            <div className="text-center py-12">
                                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                                <p className="text-slate-600 font-medium">All caught up!</p>
                                <p className="text-sm text-slate-400">No pending doctor verifications</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingDoctors.map((doctor) => (
                                    <div
                                        key={doctor.id}
                                        className="p-4 bg-white rounded-xl border-2 border-slate-200 hover:border-amber-300 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center">
                                                    <span className="text-xl text-white">👨‍⚕️</span>
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{doctor.name}</h3>
                                                    <p className="text-sm text-slate-500">{doctor.email}</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Registered: {new Date(doctor.created_at).toLocaleDateString()}
                                                    </p>
                                                    {doctor.profession_proof && (
                                                        <a
                                                            href={`http://localhost:8000/storage/${doctor.profession_proof}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-600 hover:text-blue-800 mt-1 flex items-center gap-1 underline"
                                                        >
                                                            <FileText className="w-3 h-3" />
                                                            View Proof Document
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleVerifyDoctor(doctor.id)}
                                                    disabled={actionLoading === doctor.id}
                                                    className="flex items-center gap-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === doctor.id ? (
                                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    ) : (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Approve
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleRejectDoctor(doctor.id)}
                                                    disabled={actionLoading === doctor.id}
                                                    className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all disabled:opacity-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <div className="glass-card p-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                            <FileText className="w-6 h-6 text-purple-500" />
                            Recent Activity
                        </h2>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {auditLogs.length === 0 ? (
                                <p className="text-center text-slate-400 py-8">No recent activity</p>
                            ) : (
                                auditLogs.map((log, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                                    >
                                        <div className="flex items-start gap-3">
                                            {getEventIcon(log.event_type)}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-slate-700 truncate">
                                                    {log.event_type?.replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-slate-400">
                                                    User #{log.user_id} • {new Date(log.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
