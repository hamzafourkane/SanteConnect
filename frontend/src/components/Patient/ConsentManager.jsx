import { useState, useEffect } from 'react';
import { Shield, X, Check, AlertCircle, UserCheck } from 'lucide-react';
import { consentsAPI } from '../../services/api';

export default function ConsentManager() {
    const [doctors, setDoctors] = useState([]);
    const [consents, setConsents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [granting, setGranting] = useState(null);
    const [revoking, setRevoking] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [doctorsRes, consentsRes] = await Promise.all([
                consentsAPI.listDoctors(),
                consentsAPI.getAll()
            ]);
            
            console.log('Doctors response:', doctorsRes);
            console.log('Consents response:', consentsRes);
            
            if (doctorsRes.success) {
                setDoctors(doctorsRes.doctors);
            }
            if (consentsRes.success) {
                setConsents(consentsRes.consents);
                console.log('Consents set to:', consentsRes.consents);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            setMessage({ type: 'error', text: 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    const handleGrantConsent = async (doctorId) => {
        setGranting(doctorId);
        setMessage(null);
        try {
            const response = await consentsAPI.grant(doctorId);
            if (response.success) {
                setMessage({ type: 'success', text: 'Access granted successfully!' });
                await fetchData(); 
            }
        } catch (error) {
            setMessage({ type: 'error', text: error?.message || 'Failed to grant access' });
        } finally {
            setGranting(null);
        }
    };

    const handleRevokeConsent = async (consentId) => {
        setRevoking(consentId);
        setMessage(null);
        try {
            const response = await consentsAPI.revoke(consentId);
            if (response.success) {
                setMessage({ type: 'success', text: 'Access revoked successfully!' });
                await fetchData(); 
            }
        } catch (error) {
            setMessage({ type: 'error', text: error?.message || 'Failed to revoke access' });
        } finally {
            setRevoking(null);
        }
    };

    const getConsentForDoctor = (doctorId) => {
        const consent = consents.find(c => {
            return c.doctor?.id === doctorId && c.status?.toUpperCase() === 'ACTIVE';
        });
        return consent;
    };

    if (loading) {
        return (
            <div className="glass-card p-6 border-2 border-white/50">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Manage Access</h2>
                        <p className="text-xs text-slate-500">Control who can see your data</p>
                    </div>
                </div>
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 border-2 border-white/50">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Manage Access</h2>
                    <p className="text-xs text-slate-500">Control who can see your data</p>
                </div>
            </div>

            {message && (
                <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
                    message.type === 'success' 
                        ? 'bg-success-100 text-success-700' 
                        : 'bg-danger-100 text-danger-700'
                }`}>
                    {message.type === 'success' ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm">{message.text}</span>
                </div>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {doctors.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">
                        <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">No verified doctors available</p>
                    </div>
                ) : (
                    doctors.map((doctor) => {
                        const consent = getConsentForDoctor(doctor.id);
                        const hasAccess = !!consent;
                        const isGranting = granting === doctor.id;
                        const isRevoking = consent && revoking === consent.id;
                        
                        return (
                            <div 
                                key={doctor.id}
                                className={`p-4 rounded-xl border-2 transition-all duration-500 ${
                                    hasAccess 
                                        ? 'bg-gradient-to-r from-success-50 to-success-100 border-success-300 shadow-md' 
                                        : 'bg-white border-slate-100 hover:border-accent-200 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                                            hasAccess 
                                                ? 'bg-success-200 scale-110' 
                                                : 'bg-slate-100'
                                        }`}>
                                            {hasAccess ? (
                                                <UserCheck className="w-5 h-5 text-success-600" />
                                            ) : (
                                                <span className="text-lg">👨‍⚕️</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-800">{doctor.name}</p>
                                            <p className="text-xs text-slate-500">{doctor.email}</p>
                                        </div>
                                    </div>
                                    
                                    {hasAccess ? (
                                        <button
                                            onClick={() => handleRevokeConsent(consent.id)}
                                            disabled={isRevoking}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white text-danger-600 border-2 border-danger-200 rounded-lg text-sm font-medium hover:bg-danger-50 hover:border-danger-300 transition-all duration-300 disabled:opacity-50 shadow-sm"
                                        >
                                            {isRevoking ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-danger-600 border-t-transparent"></div>
                                            ) : (
                                                <>
                                                    <X className="w-4 h-4" />
                                                    Revoke Access
                                                </>
                                            )}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleGrantConsent(doctor.id)}
                                            disabled={isGranting}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-lg text-sm font-medium hover:from-accent-600 hover:to-accent-700 transition-all duration-300 disabled:opacity-50 shadow-md hover:shadow-lg hover:scale-105"
                                        >
                                            {isGranting ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            ) : (
                                                <>
                                                    <Check className="w-4 h-4" />
                                                    Grant Access
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                                
                                {hasAccess && (
                                    <div className="mt-3 pt-3 border-t border-success-200">
                                        <p className="text-xs text-success-600 flex items-center gap-1.5">
                                            <Check className="w-3.5 h-3.5" />
                                            <span className="font-medium">Access granted</span>
                                            <span className="text-success-500">• since {new Date(consent.granted_at).toLocaleDateString()}</span>
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
