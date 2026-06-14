import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Capture password-recovery tokens from the URL hash synchronously at load, before
// the client consumes the hash. Lets the reset page switch to the *recovery* user's
// session explicitly, instead of acting on whatever session was already signed in.
function parseRecoveryTokens() {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (params.get('type') === 'recovery' && params.get('access_token')) {
        const tokens = {
            access_token: params.get('access_token'),
            refresh_token: params.get('refresh_token'),
        };
        // Strip the tokens from the visible URL / browser history immediately after
        // capturing them, so the recovery secret doesn't linger where it could leak.
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        return tokens;
    }
    return null;
}

export const recoveryTokens = parseRecoveryTokens();

export async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    return profile ? { ...profile, id: user.id, email: user.email } : null;
}

export async function getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
}

export async function uploadFile(file) {
    const ext = file.name.split('.').pop();
    const filename = `${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filename, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);
    return { file_url: publicUrl };
}
