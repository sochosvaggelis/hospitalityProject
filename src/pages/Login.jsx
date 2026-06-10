import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Waves, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import useLanguage from '@/lib/useLanguage';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';
    const { lang } = useLanguage();
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', fullName: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const set = (k, v) => { setError(''); setForm(f => ({ ...f, [k]: v })); };
    const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

    const handleLogin = async () => {
        if (!form.email || !form.password) {
            setError(lang === 'el' ? 'Συμπληρώστε email και κωδικό.' : 'Please enter your email and password.');
            return;
        }
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
        });
        setLoading(false);
        if (error) {
            setError(lang === 'el' ? 'Λάθος email ή κωδικός. Δοκιμάστε ξανά.' : 'Invalid email or password. Please try again.');
        } else {
            navigate(from, { replace: true });
        }
    };

    const handleRegister = async () => {
        if (!form.fullName.trim()) {
            setError(lang === 'el' ? 'Εισάγετε το ονοματεπώνυμό σας.' : 'Please enter your full name.');
            return;
        }
        if (!form.email.trim()) {
            setError(lang === 'el' ? 'Εισάγετε το email σας.' : 'Please enter your email address.');
            return;
        }
        if (!form.password) {
            setError(lang === 'el' ? 'Εισάγετε έναν κωδικό πρόσβασης.' : 'Please enter a password.');
            return;
        }
        if (form.password.length < 6) {
            setError(lang === 'el' ? 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.' : 'Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.fullName } },
        });
        setLoading(false);
        if (error) {
            setError(error.message);
        } else {
            setSuccess(lang === 'el' ? 'Ο λογαριασμός δημιουργήθηκε! Καλωσήρθατε.' : 'Account created! Welcome aboard.');
            navigate(from, { replace: true });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#eef4fd' }}>
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center mb-3">
                        <Waves className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h1 className="font-display text-2xl font-bold text-foreground">SeaSide Jobs</h1>
                </div>

                <div className="bg-card rounded-2xl border border-border/50 p-6 shadow-sm">
                    {/* Toggle */}
                    <div className="flex rounded-xl bg-muted p-1 mb-6">
                        <button
                            onClick={() => switchMode('login')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                            {lang === 'el' ? 'Σύνδεση' : 'Sign In'}
                        </button>
                        <button
                            onClick={() => switchMode('register')}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground'}`}
                        >
                            {lang === 'el' ? 'Εγγραφή' : 'Register'}
                        </button>
                    </div>

                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {success && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-green-50 border border-green-200 text-green-700 px-4 py-3 mb-4 text-sm">
                            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{success}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        {mode === 'register' && (
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {lang === 'el' ? 'Ονοματεπώνυμο' : 'Full Name'}
                                </label>
                                <Input
                                    className="rounded-xl"
                                    value={form.fullName}
                                    onChange={e => set('fullName', e.target.value)}
                                    placeholder={lang === 'el' ? 'π.χ. Γιώργης Παπαδόπουλος' : 'e.g. John Smith'}
                                />
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                            <Input
                                type="email"
                                className="rounded-xl"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                placeholder="email@example.com"
                                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground mb-1.5 block">
                                {lang === 'el' ? 'Κωδικός' : 'Password'}
                            </label>
                            <Input
                                type="password"
                                className="rounded-xl"
                                value={form.password}
                                onChange={e => set('password', e.target.value)}
                                placeholder="••••••••"
                                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                            />
                        </div>

                        <Button
                            className="w-full rounded-xl h-11"
                            disabled={loading}
                            onClick={mode === 'login' ? handleLogin : handleRegister}
                        >
                            {loading
                                ? (lang === 'el' ? 'Φόρτωση...' : 'Loading...')
                                : mode === 'login'
                                    ? (lang === 'el' ? 'Σύνδεση' : 'Sign In')
                                    : (lang === 'el' ? 'Δημιουργία Λογαριασμού' : 'Create Account')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
