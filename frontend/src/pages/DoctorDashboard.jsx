import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Users, Send, TrendingUp, Heart, Scale, Moon, Activity } from 'lucide-react';
import { doctorAPI } from '../services/api';
import { 
    LineChart, Line, 
    AreaChart, Area,
    BarChart, Bar,
    ComposedChart,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    ReferenceLine
} from 'recharts';

export default function DoctorDashboard() {
    const { user, logout } = useAuth();
    const [patients, setPatients] = useState([]);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientData, setPatientData] = useState(null);
    const [recommendation, setRecommendation] = useState('');
    const [loading, setLoading] = useState(false);
    const [sendingRec, setSendingRec] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            const response = await doctorAPI.getPatients();
            if (response.success) {
                setPatients(response.patients);
            }
        } catch (error) {
            console.error('Failed to fetch patients:', error);
        }
    };

    const fetchPatientData = async (patientId) => {
        setLoading(true);
        try {
            const response = await doctorAPI.getPatientData(patientId, {
                limit: 30,
            });
            if (response.success) {
                setPatientData(response);
            }
        } catch (error) {
            console.error('Failed to fetch patient data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePatientSelect = (patient) => {
        setSelectedPatient(patient);
        fetchPatientData(patient.id);
        setRecommendation('');
    };

    const handleSendRecommendation = async (e) => {
        e.preventDefault();
        if (!recommendation.trim() || !selectedPatient) return;

        setSendingRec(true);
        try {
            const response = await doctorAPI.sendRecommendation(selectedPatient.id, recommendation);
            if (response.success) {
                setRecommendation('');
                fetchPatientData(selectedPatient.id);
            }
        } catch (error) {
            console.error('Failed to send recommendation:', error);
        } finally {
            setSendingRec(false);
        }
    };

    const formatChartData = (measurements, type) => {
        if (!measurements || measurements.length === 0) return [];

        return measurements
            .filter(m => m.type === type)
            .map(m => ({
                date: new Date(m.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                systolic: parseInt(m.data.systolique, 10) || 0,
                diastolic: parseInt(m.data.diastolique, 10) || 0,
                weight: parseFloat(m.data.kg) || 0,
                sleep: parseFloat(m.data.hours) || 0,
                steps: parseInt(m.data.steps, 10) || 0,
                minutes: parseInt(m.data.minutes, 10) || 0,
            }))
            .reverse();
    };

    return (
        <div className="min-h-screen p-6">
            <header className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">Dr. {user?.name}</h1>
                            <p className="text-slate-600">Doctor Portal</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="flex items-center gap-2 px-4 py-2 bg-white/90 text-slate-700 rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="glass-card p-6">
                    <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Users className="w-6 h-6 text-accent-600" />
                        My Patients ({patients.length})
                    </h2>

                    <div className="space-y-3 max-h-[600px] overflow-y-auto">
                        {patients.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="text-sm">No patients yet</p>
                            </div>
                        ) : (
                            patients.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => handlePatientSelect(patient)}
                                    className={`w-full p-4 rounded-xl border-2 transition-all text-left ${selectedPatient?.id === patient.id
                                            ? 'border-accent-500 bg-accent-50 shadow-lg'
                                            : 'border-slate-200 bg-white hover:border-accent-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                                            <span className="text-lg">👤</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-semibold text-slate-800">{patient.name}</p>
                                            <p className="text-xs text-slate-500">{patient.email}</p>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <span className="badge badge-success text-xs">
                                            Authorized since {new Date(patient.consent_granted_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {!selectedPatient ? (
                        <div className="glass-card p-12 text-center">
                            <Users className="w-20 h-20 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-bold text-slate-600 mb-2">Select a Patient</h3>
                            <p className="text-slate-500">Choose a patient from the list to view their health data</p>
                        </div>
                    ) : loading ? (
                        <div className="glass-card p-12 flex items-center justify-center">
                            <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <>
                            <div className="glass-card p-6">
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">{patientData?.patient.name}</h3>
                                <p className="text-slate-600">{patientData?.patient.email}</p>
                                <div className="mt-4">
                                    <span className="badge badge-primary">
                                        {patientData?.measurements.count || 0} Total Measurements
                                    </span>
                                </div>
                            </div>

                            {patientData?.measurements.data.length > 0 && (
                                <div className="glass-card p-6">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-accent-600" />
                                        Health Trends
                                    </h3>

                                    {formatChartData(patientData.measurements.data, 'TENSION').length > 0 && (
                                        <div className="mb-8">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <Heart className="w-4 h-4 text-red-500" />
                                                Blood Pressure (mmHg)
                                            </h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={formatChartData(patientData.measurements.data, 'TENSION')}>
                                                    <defs>
                                                        <linearGradient id="systolicGradientDoc" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                                                        </linearGradient>
                                                        <linearGradient id="diastolicGradientDoc" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" style={{ fontSize: '11px' }} stroke="#64748b" />
                                                    <YAxis domain={[60, 180]} style={{ fontSize: '11px' }} stroke="#64748b" />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                        formatter={(value, name) => [`${value} mmHg`, name]}
                                                    />
                                                    <Legend />
                                                    <ReferenceLine y={120} stroke="#22c55e" strokeDasharray="5 5" />
                                                    <ReferenceLine y={80} stroke="#22c55e" strokeDasharray="5 5" />
                                                    <Area type="monotone" dataKey="systolic" stroke="#ef4444" strokeWidth={2} fill="url(#systolicGradientDoc)" name="Systolic" dot={{ r: 3 }} />
                                                    <Area type="monotone" dataKey="diastolic" stroke="#3b82f6" strokeWidth={2} fill="url(#diastolicGradientDoc)" name="Diastolic" dot={{ r: 3 }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {formatChartData(patientData.measurements.data, 'POIDS').length > 0 && (
                                        <div className="mb-8">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <Scale className="w-4 h-4 text-sky-500" />
                                                Weight (kg)
                                            </h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <AreaChart data={formatChartData(patientData.measurements.data, 'POIDS')}>
                                                    <defs>
                                                        <linearGradient id="weightGradientDoc" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4}/>
                                                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" style={{ fontSize: '11px' }} stroke="#64748b" />
                                                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} style={{ fontSize: '11px' }} stroke="#64748b" />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                        formatter={(value) => [`${value} kg`, 'Weight']}
                                                    />
                                                    <Legend />
                                                    <Area type="monotone" dataKey="weight" stroke="#0ea5e9" strokeWidth={2} fill="url(#weightGradientDoc)" name="Weight" dot={{ r: 4, fill: '#0ea5e9' }} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {formatChartData(patientData.measurements.data, 'SOMMEIL').length > 0 && (
                                        <div className="mb-8">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <Moon className="w-4 h-4 text-violet-500" />
                                                Sleep (hours)
                                            </h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <BarChart data={formatChartData(patientData.measurements.data, 'SOMMEIL')}>
                                                    <defs>
                                                        <linearGradient id="sleepGradientDoc" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1}/>
                                                            <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.8}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                                                    <XAxis dataKey="date" style={{ fontSize: '11px' }} stroke="#64748b" />
                                                    <YAxis domain={[0, 12]} ticks={[0, 2, 4, 6, 8, 10, 12]} style={{ fontSize: '11px' }} stroke="#64748b" />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                        formatter={(value) => [`${value} hours`, 'Sleep']}
                                                        cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                                                    />
                                                    <Legend />
                                                    <ReferenceLine y={8} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '8h', fill: '#22c55e', fontSize: 10 }} />
                                                    <Bar dataKey="sleep" fill="url(#sleepGradientDoc)" name="Sleep" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}

                                    {formatChartData(patientData.measurements.data, 'ACTIVITE').length > 0 && (
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                                <Activity className="w-4 h-4 text-emerald-500" />
                                                Activity (steps & minutes)
                                            </h4>
                                            <ResponsiveContainer width="100%" height={250}>
                                                <ComposedChart data={formatChartData(patientData.measurements.data, 'ACTIVITE')}>
                                                    <defs>
                                                        <linearGradient id="stepsGradientDoc" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                                                            <stop offset="100%" stopColor="#34d399" stopOpacity={0.8}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                    <XAxis dataKey="date" style={{ fontSize: '11px' }} stroke="#64748b" />
                                                    <YAxis yAxisId="left" stroke="#10b981" style={{ fontSize: '11px' }} />
                                                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" style={{ fontSize: '11px' }} />
                                                    <Tooltip 
                                                        contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                        formatter={(value, name) => {
                                                            if (name === 'Steps') return [`${value.toLocaleString()} steps`, name];
                                                            return [`${value} min`, name];
                                                        }}
                                                    />
                                                    <Legend />
                                                    <ReferenceLine yAxisId="left" y={10000} stroke="#22c55e" strokeDasharray="5 5" label={{ value: '10k', fill: '#22c55e', fontSize: 10 }} />
                                                    <Bar yAxisId="left" dataKey="steps" fill="url(#stepsGradientDoc)" name="Steps" radius={[4, 4, 0, 0]} maxBarSize={35} />
                                                    <Line yAxisId="right" type="monotone" dataKey="minutes" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b' }} name="Duration" />
                                                </ComposedChart>
                                            </ResponsiveContainer>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="glass-card p-6">
                                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Send className="w-5 h-5 text-success-600" />
                                    Send Recommendation
                                </h3>
                                <form onSubmit={handleSendRecommendation} className="space-y-4">
                                    <textarea
                                        value={recommendation}
                                        onChange={(e) => setRecommendation(e.target.value)}
                                        placeholder="Enter your medical recommendation for this patient..."
                                        className="w-full px-4 py-3 bg-white/90 border-2 border-slate-200 rounded-xl focus:border-success-500 focus:ring-4 focus:ring-success-100 transition-all outline-none resize-none"
                                        rows={4}
                                        minLength={10}
                                        maxLength={2000}
                                        required
                                    />
                                    <button
                                        type="submit"
                                        disabled={sendingRec || !recommendation.trim()}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {sendingRec ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Recommendation
                                            </>
                                        )}
                                    </button>
                                </form>

                                {patientData?.recommendations.count > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">Previous Recommendations</h4>
                                        <div className="space-y-2 max-h-60 overflow-y-auto">
                                            {patientData.recommendations.data.map((rec, index) => (
                                                <div key={index} className="p-3 bg-slate-50 rounded-lg text-sm">
                                                    <p className="text-slate-700">{rec.message}</p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {new Date(rec.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
