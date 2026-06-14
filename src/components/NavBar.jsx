import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Waves, MessageCircle, LayoutDashboard, User, Briefcase, Globe, LogIn, Shield, Plus, LogOut, Star, Bell, CheckCircle, XCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useLanguage from '@/lib/useLanguage';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/lib/api';
import moment from 'moment';

function NotificationIcon({ type }) {
    if (type === 'accepted') return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (type === 'rejected') return <XCircle className="w-4 h-4 text-red-500" />;
    return <UserPlus className="w-4 h-4 text-blue-600" />;
}

function NotificationDot({ type }) {
    if (type === 'accepted') return 'bg-green-100';
    if (type === 'rejected') return 'bg-red-100';
    return 'bg-blue-100';
}

export default function Navbar() {
    const { t, lang, setLanguage } = useLanguage();
    const { isAuthenticated, me, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const role = me?.role;

    const loadNotifications = () => {
        api.getNotifications()
            .then(data => {
                setNotifications(data || []);
                setUnreadCount((data || []).filter(n => !n.read).length);
            })
            .catch(() => {});
    };

    useEffect(() => {
        if (!isAuthenticated || role === 'admin') return;
        loadNotifications();
        const interval = setInterval(loadNotifications, 60000);
        return () => clearInterval(interval);
    }, [isAuthenticated, role]);

    const handleOpenNotif = (open) => setNotifOpen(open);

    const handleReadNotif = (n) => {
        if (!n.read) {
            api.markNotificationRead(n.id).catch(() => {});
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        if (n.job_id) {
            setNotifOpen(false);
            navigate('/dashboard', { state: { expandJobId: n.job_id } });
        }
    };

    const isActive = (path) => location.pathname === path;

    const navLinks = [
        { to: '/', label: 'Home', icon: Waves },
        { to: '/jobs', label: 'Jobs', icon: Briefcase },
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/messages', label: 'Messages', icon: MessageCircle },
        { to: '/profile', label: 'Profile', icon: User },
    ];

    if (isAuthenticated) {
        if (role === 'hotel' || role === 'user') navLinks.splice(3, 0, { to: '/favorites', label: 'Favourites', icon: Star });
        if (role === 'admin') navLinks.push({ to: '/admin', label: 'Admin', icon: Shield });
    }

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    const notifLabel = (n) => {
        if (n.type === 'accepted') return 'Your application was accepted';
        if (n.type === 'rejected') return 'Your application was rejected';
        return `New application from ${n.applicant_name}`;
    };

    return (
        <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                            <Waves className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="font-display font-semibold text-lg text-foreground hidden sm:block">SeaSide Jobs</span>
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link key={to} to={to}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                                <Icon className="w-4 h-4" />{label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        {/* Notification bell */}
                        {isAuthenticated && role !== 'admin' && (
                            <Popover open={notifOpen} onOpenChange={handleOpenNotif}>
                                <PopoverTrigger asChild>
                                    <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                                        <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center leading-none">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent align="end" sideOffset={8} className="w-80 p-0 rounded-2xl shadow-xl border-border/50 overflow-hidden">
                                    <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
                                        <span className="font-semibold text-sm text-foreground">Notifications</span>
                                        {notifications.length > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {notifications.length} total
                                            </span>
                                        )}
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto divide-y divide-border/30">
                                        {notifications.length === 0 ? (
                                            <div className="flex flex-col items-center gap-2 py-10 text-center">
                                                <Bell className="w-8 h-8 text-muted-foreground/30" />
                                                <p className="text-sm text-muted-foreground">No notifications yet</p>
                                            </div>
                                        ) : notifications.map(n => (
                                            <div key={n.id} onClick={() => handleReadNotif(n)} className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}>
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${NotificationDot({ type: n.type })}`}>
                                                    <NotificationIcon type={n.type} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-foreground leading-snug">{notifLabel(n)}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.job_title}</p>
                                                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">{moment(n.created_at).fromNow()}</p>
                                                </div>
                                                {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><Globe className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLanguage('en')}>English {lang === 'en' && '✓'}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage('el')}>Ελληνικά {lang === 'el' && '✓'}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {isAuthenticated && role === 'hotel' && (
                            <Link to="/post-job">
                                <Button size="sm" className="hidden sm:flex gap-1.5">
                                    <Plus className="w-4 h-4" />Post Job
                                </Button>
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => navigate('/login')} className="gap-1.5">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden sm:inline">Login</span>
                            </Button>
                        )}

                        <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {mobileOpen && (
                <div className="lg:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl">
                    <nav className="px-4 py-3 space-y-1">
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive(to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                                <Icon className="w-4 h-4" />{label}
                            </Link>
                        ))}
                        {isAuthenticated && role === 'hotel' && (
                            <Link to="/post-job" onClick={() => setMobileOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary">
                                <Plus className="w-4 h-4" />Post Job
                            </Link>
                        )}
                        {isAuthenticated ? (
                            <button onClick={() => { setMobileOpen(false); handleLogout(); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted w-full">
                                <LogOut className="w-4 h-4" />Logout
                            </button>
                        ) : (
                            <button onClick={() => { setMobileOpen(false); navigate('/login'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary w-full">
                                <LogIn className="w-4 h-4" />Login
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
