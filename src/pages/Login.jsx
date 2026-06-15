import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Waves, AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import RequiredMark from '@/components/RequiredMark';
import useLanguage from '@/lib/useLanguage';

export default function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from || '/';
    const { lang } = useLanguage();
    const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ email: '', password: '', fullName: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(
        location.state?.resetSuccess
            ? (lang === 'el' ? 'Ο κωδικός ενημερώθηκε! Συνδεθείτε με τον νέο σας κωδικό.' : 'Password updated! Please sign in with your new password.')
            : ''
    );

    const set = (k, v) => { setError(''); setForm(f => ({ ...f, [k]: v })); };
    const switchMode = (m) => { setMode(m); setError(''); setSuccess(''); };

    // Map raw Supabase errors to friendly, translated messages
    const friendlyError = (err) => {
        const msg = (err?.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('already exists'))
            return lang === 'el' ? 'Υπάρχει ήδη λογαριασμός με αυτό το email.' : 'An account with this email already exists.';
        if (msg.includes('invalid login') || msg.includes('invalid credentials'))
            return lang === 'el' ? 'Λάθος email ή κωδικός. Δοκιμάστε ξανά.' : 'Invalid email or password. Please try again.';
        if (msg.includes('email not confirmed'))
            return lang === 'el' ? 'Επιβεβαιώστε πρώτα το email σας από το μήνυμα που σας στείλαμε.' : 'Please confirm your email first via the message we sent you.';
        if (msg.includes('rate limit') || msg.includes('too many'))
            return lang === 'el' ? 'Πολλές προσπάθειες. Δοκιμάστε ξανά σε λίγο.' : 'Too many attempts. Please try again shortly.';
        return err?.message || (lang === 'el' ? 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.' : 'Something went wrong. Please try again.');
    };

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
        if (error) setError(friendlyError(error));
        else navigate(from, { replace: true });
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
        if (form.password.length < 6) {
            setError(lang === 'el' ? 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.' : 'Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        setError('');
        const { data, error } = await supabase.auth.signUp({
            email: form.email,
            password: form.password,
            options: { data: { full_name: form.fullName } },
        });
        setLoading(false);
        if (error) {
            setError(friendlyError(error));
            return;
        }
        // If no session is returned, the project requires email confirmation.
        if (!data.session) {
            setSuccess(lang === 'el'
                ? 'Σχεδόν έτοιμα! Σας στείλαμε email επιβεβαίωσης — ελέγξτε τα εισερχόμενά σας για να ενεργοποιήσετε τον λογαριασμό.'
                : 'Almost there! We sent you a confirmation email — check your inbox to activate your account.');
        } else {
            navigate(from, { replace: true });
        }
    };

    const handleForgot = async () => {
        if (!form.email.trim()) {
            setError(lang === 'el' ? 'Εισάγετε το email σας.' : 'Please enter your email address.');
            return;
        }
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
            redirectTo: `${window.location.origin}${import.meta.env.BASE_URL}reset-password`,
        });
        setLoading(false);
        if (error) setError(friendlyError(error));
        else setSuccess(lang === 'el'
            ? 'Αν υπάρχει λογαριασμός με αυτό το email, θα λάβετε σύνδεσμο επαναφοράς κωδικού.'
            : "If an account exists for this email, you'll receive a password reset link.");
    };

    const submit = mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgot;

    const submitLabel = loading
        ? null
        : mode === 'login'
            ? (lang === 'el' ? 'Σύνδεση' : 'Sign In')
            : mode === 'register'
                ? (lang === 'el' ? 'Δημιουργία Λογαριασμού' : 'Create Account')
                : (lang === 'el' ? 'Αποστολή συνδέσμου' : 'Send reset link');

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
                    {/* Toggle (hidden in forgot mode) */}
                    {mode !== 'forgot' && (
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
                    )}

                    {mode === 'forgot' && (
                        <div className="mb-5">
                            <h2 className="font-display text-lg font-bold text-foreground">{lang === 'el' ? 'Επαναφορά κωδικού' : 'Reset password'}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{lang === 'el' ? 'Θα σας στείλουμε έναν σύνδεσμο για να ορίσετε νέο κωδικό.' : "We'll email you a link to set a new password."}</p>
                        </div>
                    )}

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
                                    {lang === 'el' ? 'Ονοματεπώνυμο' : 'Full Name'}<RequiredMark />
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
                            <label className="text-sm font-medium text-foreground mb-1.5 block">Email<RequiredMark /></label>
                            <Input
                                type="email"
                                className="rounded-xl"
                                value={form.email}
                                onChange={e => set('email', e.target.value)}
                                placeholder="email@example.com"
                                onKeyDown={e => e.key === 'Enter' && submit()}
                            />
                        </div>

                        {mode !== 'forgot' && (
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-sm font-medium text-foreground">
                                        {lang === 'el' ? 'Κωδικός' : 'Password'}<RequiredMark />
                                    </label>
                                    {mode === 'login' && (
                                        <button type="button" onClick={() => switchMode('forgot')}
                                            className="text-xs text-primary hover:underline">
                                            {lang === 'el' ? 'Ξεχάσατε τον κωδικό;' : 'Forgot password?'}
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        className="rounded-xl pr-10"
                                        value={form.password}
                                        onChange={e => set('password', e.target.value)}
                                        placeholder="••••••••"
                                        onKeyDown={e => e.key === 'Enter' && submit()}
                                    />
                                    <button type="button" onClick={() => setShowPassword(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        title={showPassword ? (lang === 'el' ? 'Απόκρυψη' : 'Hide') : (lang === 'el' ? 'Εμφάνιση' : 'Show')}>
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        <Button
                            className="w-full rounded-xl h-11"
                            disabled={loading}
                            onClick={submit}
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
                        </Button>

                        {mode === 'forgot' && (
                            <button type="button" onClick={() => switchMode('login')}
                                className="w-full text-center text-sm text-muted-foreground hover:text-foreground">
                                {lang === 'el' ? '← Πίσω στη σύνδεση' : '← Back to sign in'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
