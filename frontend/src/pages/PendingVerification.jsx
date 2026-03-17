import { Link } from 'react-router-dom';
import { Clock, Mail, Shield, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function PendingVerification() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="glass-card w-full max-w-lg p-8 relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full mb-6 shadow-lg">
                    <Clock className="w-10 h-10 text-white" />
                </div>

                <h1 className="text-3xl font-bold text-slate-800 mb-2">Verification Pending</h1>
                <p className="text-slate-600 mb-6">
                    Thank you for registering, <strong>{user?.name || 'Doctor'}</strong>!
                </p>

                <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6">
                    <div className="flex items-start gap-4 text-left">
                        <Shield className="w-8 h-8 text-amber-500 flex-shrink-0 mt-1" />
                        <div>
                            <h3 className="font-semibold text-amber-800 mb-2">Account Under Review</h3>
                            <p className="text-amber-700 text-sm">
                                Your medical credentials are being verified by our admin team. 
                                This process typically takes 24-48 hours.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="text-left mb-6">
                    <h4 className="font-semibold text-slate-700 mb-3">What happens next?</h4>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">1</span>
                            Admin reviews your profession proof
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">2</span>
                            Your credentials are verified
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center text-xs font-bold text-primary-600">3</span>
                            You'll be able to log in and access patient data
                        </li>
                    </ul>
                </div>

                <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-6">
                    <Mail className="w-4 h-4" />
                    <span>Questions? Contact support@healthtrack.com</span>
                </div>

                <div className="flex gap-3">
                    <Link 
                        to="/login" 
                        className="flex-1 btn-secondary flex items-center justify-center gap-2"
                    >
                        Try Login Again
                    </Link>
                    <button 
                        onClick={logout}
                        className="flex-1 btn-primary flex items-center justify-center gap-2 bg-slate-500 hover:bg-slate-600"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>
        </div>
    );
}
