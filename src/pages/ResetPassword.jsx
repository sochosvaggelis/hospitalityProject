import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Waves, AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase, recoveryTokens } from '@/lib/supabase';
import RequiredMark from '@/components/RequiredMark';
import useLanguage from '@/lib/useLanguage';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { lang } = useLanguage();
    const [ready, setReady] = useState(false);   // recovery session established
    const [invalid, setInvalid] = useState(false); // opened without valid recovery tokens
    const [password, setPassword] = useState('');
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Explicitly switch to the recovery user's session from the link tokens. This
    // replaces any session that was already signed in, so the password change can
    // only ever apply to the account the reset link was issued for.
    useEffect(() => {
        if (!recoveryTokens) { setInvalid(true); return; }
        supabase.auth.setSession({
            access_token: recoveryTokens.access_token,
            refresh_token: recoveryTokens.refresh_token,
        }).then(({ error }) => {
            if (error) setInvalid(true);
            else setReady(true);
        });
    }, []);

    const handleSubmit = async () => {
        if (password.length < 6) {
            setError(lang === 'el' ? 'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.' : 'Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        setError('');
        const { error } = await supabase.auth.updateUser({ password });
        if (error) {
            setLoading(false);
            setError(error.message);
            return;
        }
        // Sign out the recovery session for a clean state, then send the user to
        // log in fresh with their new password. Avoids the ambiguous half-session.
        await supabase.auth.signOut();
        navigate('/login', { replace: true, state: { resetSuccess: true } });
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
                    <h2 className="font-display text-lg font-bold text-foreground mb-1">
                        {lang === 'el' ? 'Ορισμός νέου κωδικού' : 'Set a new password'}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-5">
                        {lang === 'el' ? 'Επίλεξε έναν νέο κωδικό για τον λογαριασμό σου.' : 'Choose a new password for your account.'}
                    </p>

                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-4 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    {invalid ? (
                        <div className="text-center py-6 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {lang === 'el'
                                    ? 'Ο σύνδεσμος δεν είναι έγκυρος ή έχει λήξει. Ζητήστε νέο από τη σελίδα σύνδεσης.'
                                    : 'This link is invalid or has expired. Request a new one from the sign-in page.'}
                            </p>
                            <Button variant="outline" className="rounded-xl" onClick={() => navigate('/login', { replace: true })}>
                                {lang === 'el' ? 'Πίσω στη σύνδεση' : 'Back to sign in'}
                            </Button>
                        </div>
                    ) : !ready ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground mb-1.5 block">
                                    {lang === 'el' ? 'Νέος κωδικός' : 'New password'}<RequiredMark />
                                </label>
                                <div className="relative">
                                    <Input
                                        type={show ? 'text' : 'password'}
                                        className="rounded-xl pr-10"
                                        value={password}
                                        onChange={e => { setError(''); setPassword(e.target.value); }}
                                        placeholder="••••••••"
                                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                                    />
                                    <button type="button" onClick={() => setShow(s => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button className="w-full rounded-xl h-11" disabled={loading} onClick={handleSubmit}>
                                {loading
                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                    : (lang === 'el' ? 'Αποθήκευση κωδικού' : 'Save password')}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
