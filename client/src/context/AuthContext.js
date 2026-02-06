import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../api';

export const AuthContext = createContext();

// Keep-alive function to prevent Render cold starts
const startKeepAlive = () => {
    const keepAliveInterval = setInterval(() => {
        api.get('/health')
            .then(() => console.log('✅ Keep-alive ping sent'))
            .catch(() => console.log('Keep-alive ping skipped (offline)'));
    }, 5 * 60 * 1000); // Every 5 minutes

    return keepAliveInterval;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const keepAliveRef = useRef(null);

    // Load user on mount and detect OAuth redirect
    useEffect(() => {
        // Check for OAuth callback redirect
        const params = new URLSearchParams(window.location.search);
        if (params.has('oauth')) {
            // Remove the query parameter from URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        fetchUser();

        // Start keep-alive to prevent Render from sleeping
        keepAliveRef.current = startKeepAlive();

        return () => {
            if (keepAliveRef.current) {
                clearInterval(keepAliveRef.current);
            }
        };
    }, []);

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/auth/me');
            if (data.success) {
                setUser(data.data);
            }
        } catch (err) {
            console.log('Not logged in or session expired');
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const { data } = await api.post('/auth/login', { email, password });
            if (data.success) {
                setUser(data.user);
                return true;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
            return false;
        }
    };

    const register = async (username, email, password) => {
        try {
            setError(null);
            const { data } = await api.post('/auth/register', { username, email, password });
            if (data.success) {
                setUser(data.user);
                return true;
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
            return false;
        }
    };

    const logout = async () => {
        try {
            await api.get('/auth/logout');
            setUser(null);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                login,
                register,
                logout,
                fetchUser // Exposed to re-fetch after Google OAuth redirect
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
