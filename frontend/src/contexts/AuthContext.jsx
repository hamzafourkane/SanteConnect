import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        const token = sessionStorage.getItem('auth_token');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (credentials) => {
        const response = await authAPI.login(credentials);
        if (response.success) {
            sessionStorage.setItem('auth_token', response.token);
            sessionStorage.setItem('user', JSON.stringify(response.user));
            setUser(response.user);
        }
        return response;
    };

    const register = async (data) => {
        const response = await authAPI.register(data);
        if (response.success) {
            if (response.user.role !== 'MEDECIN' || response.user.is_verified) {
                sessionStorage.setItem('auth_token', response.token);
                sessionStorage.setItem('user', JSON.stringify(response.user));
                setUser(response.user);
            }
        }
        return response;
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            sessionStorage.removeItem('auth_token');
            sessionStorage.removeItem('user');
            setUser(null);
        }
    };

    const value = {
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isPatient: user?.role === 'PATIENT',
        isDoctor: user?.role === 'MEDECIN',
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
