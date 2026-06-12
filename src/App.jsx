import 'leaflet/dist/leaflet.css';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as HotToaster } from 'react-hot-toast';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Messages from './pages/Messages';
import PostJob from './pages/PostJob';
import Admin from './pages/Admin';
import Favorites from './pages/Favorites';
import HotelProfile from './pages/HotelProfile';
import ScrollToTop from './lib/ScrollToTop';
import ProtectedRoute from './lib/ProtectedRoute';
import Login from './pages/Login';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import RoleSelector from './components/RoleSelector';

const AppContent = () => {
    const { isLoading, isAuthenticated, me, refreshProfile } = useAuth();

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
        );
    }

    if (isAuthenticated && me && !me.role_chosen && me.role !== 'admin') {
        return <RoleSelector onComplete={refreshProfile} />;
    }

    return (
        <>
        <ScrollToTop />
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<Home />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:jobId" element={<JobDetail />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/post-job" element={<PostJob />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/hotels/:hotelId" element={<HotelProfile />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
                <Route path="*" element={<PageNotFound />} />
            </Route>
        </Routes>
        </>
    );
};

function App() {
    return (
        <AuthProvider>
            <QueryClientProvider client={queryClientInstance}>
                <Router basename={import.meta.env.BASE_URL}>
                    <AppContent />
                </Router>
                <Toaster />
                <HotToaster position="bottom-right" toastOptions={{ className: 'rounded-xl text-sm' }} />
            </QueryClientProvider>
        </AuthProvider>
    );
}

export default App;
