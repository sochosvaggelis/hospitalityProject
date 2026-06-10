import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const API = import.meta.env.VITE_API_URL;

async function fetchProfile(token) {
    const res = await fetch(`${API}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json();
}

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (session) {
                setUser(session.user);
                setIsAuthenticated(true);
                await loadProfile(session.access_token);
            } else {
                setUser(null);
                setProfile(null);
                setIsAuthenticated(false);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadProfile = async (token) => {
        try {
            const data = await fetchProfile(token);
            setProfile(data);
        } catch (_) {
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    const refreshProfile = async () => {
        if (user) {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) await loadProfile(session.access_token);
        }
    };

    // Returns combined user+profile object (same shape expected by pages)
    const me = profile ? { ...profile, id: user?.id, email: user?.email } : null;

    return (
        <AuthContext.Provider value={{ user, profile, me, isAuthenticated, isLoading, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
};
