import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Heart, Mail, Lock, User, FileText, UserPlus } from 'lucide-react';

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'PATIENT',
    });
    const [professionProof, setProfessionProof] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.password_confirmation) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.role === 'MEDECIN' && !professionProof) {
            setError('Doctors must upload profession proof');
            setLoading(false);
            return;
        }

        try {
            const submitData = new FormData();
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });

            if (professionProof) {
                submitData.append('profession_proof', professionProof);
            }

            const response = await register(submitData);
            if (response.success) {
                if (response.user.role === 'MEDECIN' && !response.user.is_verified) {
                    navigate('/pending-verification');
                } else {
                    const redirectPath = response.user.role === 'PATIENT'
                        ? '/patient/dashboard'
                        : response.user.role === 'ADMIN'
                        ? '/admin/dashboard'
                        : '/doctor/dashboard';
                    navigate(redirectPath);
                }
            }
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-accent-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="glass-card w-full max-w-lg p-8 relative">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent-500 to-accent-600 rounded-2xl mb-4 shadow-lg">
                        <Heart className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gradient">Join HealthTrack 5</h1>
                    <p className="text-slate-600 mt-2">Create your account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="input-label">I am a...</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'PATIENT' })}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${formData.role === 'PATIENT'
                                        ? 'border-primary-500 bg-primary-50 shadow-lg scale-105'
                                        : 'border-slate-200 bg-white hover:border-primary-300'
                                    }`}
                            >
                                <div className="text-2xl mb-1">🏥</div>
                                <div className="text-sm font-semibold text-slate-700">Patient</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, role: 'MEDECIN' })}
                                className={`p-4 rounded-xl border-2 transition-all duration-300 ${formData.role === 'MEDECIN'
                                        ? 'border-accent-500 bg-accent-50 shadow-lg scale-105'
                                        : 'border-slate-200 bg-white hover:border-accent-300'
                                    }`}
                            >
                                <div className="text-2xl mb-1">👨‍⚕️</div>
                                <div className="text-sm font-semibold text-slate-700">Doctor</div>
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="input-field pl-11"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="input-field pl-11"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="input-field pl-11"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="input-label">Confirm Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={formData.password_confirmation}
                                onChange={(e) => setFormData({ ...formData, password_confirmation: e.target.value })}
                                className="input-field pl-11"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>

                    {formData.role === 'MEDECIN' && (
                        <div className="p-4 bg-accent-50 border-2 border-accent-200 rounded-xl">
                            <label className="input-label flex items-center gap-2">
                                <FileText className="w-5 h-5 text-accent-600" />
                                Medical License / Profession Proof (Required)
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setProfessionProof(e.target.files[0])}
                                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-accent-100 file:text-accent-700 hover:file:bg-accent-200 file:cursor-pointer cursor-pointer"
                                required
                            />
                            <p className="text-xs text-accent-600 mt-2">
                                Upload your medical license or professional certification (PDF, JPG, PNG - Max 5MB)
                            </p>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-danger-50 border-2 border-danger-200 rounded-xl animate-slide-up">
                            <p className="text-sm text-danger-700 font-medium">{error}</p>
                        </div>
                    )}

                    {formData.role === 'MEDECIN' && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <p className="text-sm text-blue-700">
                                ℹ️ Doctor accounts require admin verification before full access is granted.
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-5 h-5" />
                                Create Account
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-slate-600">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
