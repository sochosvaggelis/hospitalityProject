import { useNavigate } from 'react-router-dom';
import { LogIn, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useLanguage from '@/lib/useLanguage';

export default function GuestView({ icon: Icon, titleEl, titleEn, descEl, descEn }) {
    const navigate = useNavigate();
    const { lang } = useLanguage();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                {Icon ? <Icon className="w-8 h-8 text-primary" /> : <Waves className="w-8 h-8 text-primary" />}
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                {lang === 'el' ? titleEl : titleEn}
            </h2>
            <p className="text-muted-foreground max-w-sm mb-6">
                {lang === 'el' ? descEl : descEn}
            </p>
            <div className="flex gap-3">
                <Button onClick={() => navigate('/login')} className="rounded-xl gap-2">
                    <LogIn className="w-4 h-4" />
                    {lang === 'el' ? 'Σύνδεση' : 'Sign In'}
                </Button>
                <Button variant="outline" onClick={() => navigate('/login', { state: { mode: 'register' } })} className="rounded-xl">
                    {lang === 'el' ? 'Εγγραφή' : 'Register'}
                </Button>
            </div>
        </div>
    );
}
