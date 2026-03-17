import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import PendingVerification from './pages/PendingVerification';

function ProtectedRoute({ children, requireRole }) {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (requireRole && user?.role !== requireRole) {
        return <Navigate to="/" replace />;
    }

    if (requireRole === 'MEDECIN' && user?.role === 'MEDECIN' && !user?.is_verified) {
        return <Navigate to="/pending-verification" replace />;
    }

    return children;
}

function RootRedirect() {
    const { isAuthenticated, user } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (user?.role === 'PATIENT') {
        return <Navigate to="/patient/dashboard" replace />;
    }

    if (user?.role === 'MEDECIN') {
        if (!user?.is_verified) {
            return <Navigate to="/pending-verification" replace />;
        }
        return <Navigate to="/doctor/dashboard" replace />;
    }

    if (user?.role === 'ADMIN') {
        return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route
                        path="/patient/dashboard"
                        element={
                            <ProtectedRoute requireRole="PATIENT">
                                <PatientDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/doctor/dashboard"
                        element={
                            <ProtectedRoute requireRole="MEDECIN">
                                <DoctorDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute requireRole="ADMIN">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route path="/pending-verification" element={<PendingVerification />} />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
