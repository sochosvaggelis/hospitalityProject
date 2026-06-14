import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
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
    // Tracks which user's profile is already loaded, so we don't re-fetch (and
    // flash the full-page loader) when Supabase re-emits SIGNED_IN / TOKEN_REFRESHED
    // on tab focus or token refresh.
    const loadedUserId = useRef(null);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (!session) {
                loadedUserId.current = null;
                setUser(null);
                setProfile(null);
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            setUser(session.user);
            setIsAuthenticated(true);

            // Only (re)load the profile on a genuine new sign-in or user change.
            // Focus re-emits SIGNED_IN and periodic TOKEN_REFRESHED events arrive
            // with a session we've already loaded — skip them to avoid reloading
            // the whole app every time the tab regains focus.
            if (event === 'TOKEN_REFRESHED' || loadedUserId.current === session.user.id) return;

            loadedUserId.current = session.user.id;
            await loadProfile(session.access_token);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadProfile = async (token) => {
        setIsLoading(true);
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
