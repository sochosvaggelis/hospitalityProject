import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Waves, MessageCircle, LayoutDashboard, User, Briefcase, Globe, LogIn, Shield, Plus, LogOut, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import useLanguage from '@/lib/useLanguage';
import { useAuth } from '@/lib/AuthContext';

export default function Navbar() {
    const { t, lang, setLanguage } = useLanguage();
    const { isAuthenticated, me, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isActive = (path) => location.pathname === path;
    const role = me?.role;

    const navLinks = [
        { to: '/', label: t('nav_home'), icon: Waves },
        { to: '/jobs', label: t('nav_jobs'), icon: Briefcase },
        { to: '/dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
        { to: '/messages', label: t('nav_messages'), icon: MessageCircle },
        { to: '/profile', label: t('nav_profile'), icon: User },
    ];

    if (isAuthenticated) {
        if (role === 'hotel') navLinks.splice(3, 0, { to: '/favorites', label: lang === 'el' ? 'Αγαπημένα' : 'Favourites', icon: Star });
        if (role === 'admin') navLinks.push({ to: '/admin', label: t('nav_admin'), icon: Shield });
    }

    const handleLogout = async () => {
        await logout();
        navigate('/');
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

                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ to, label, icon: Icon }) => (
                            <Link key={to} to={to}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(to) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}>
                                <Icon className="w-4 h-4" />{label}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9"><Globe className="w-4 h-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setLanguage('en')}>{t('lang_en')} {lang === 'en' && '✓'}</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setLanguage('el')}>{t('lang_el')} {lang === 'el' && '✓'}</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {isAuthenticated && role === 'hotel' && (
                            <Link to="/post-job">
                                <Button size="sm" className="hidden sm:flex gap-1.5">
                                    <Plus className="w-4 h-4" />{t('nav_post_job')}
                                </Button>
                            </Link>
                        )}

                        {isAuthenticated ? (
                            <Button size="sm" variant="ghost" onClick={handleLogout} className="gap-1.5 text-muted-foreground">
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">{lang === 'el' ? 'Αποσύνδεση' : 'Logout'}</span>
                            </Button>
                        ) : (
                            <Button size="sm" onClick={() => navigate('/login')} className="gap-1.5">
                                <LogIn className="w-4 h-4" />
                                <span className="hidden sm:inline">{t('nav_login')}</span>
                            </Button>
                        )}

                        <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {mobileOpen && (
                <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-xl">
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
                                <Plus className="w-4 h-4" />{t('nav_post_job')}
                            </Link>
                        )}
                        {!isAuthenticated && (
                            <button onClick={() => { setMobileOpen(false); navigate('/login'); }}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary w-full">
                                <LogIn className="w-4 h-4" />{t('nav_login')}
                            </button>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
