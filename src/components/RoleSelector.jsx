import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Users, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import AppIntro from './AppIntro';

const ROLES = [
    { key: 'server', icon: Search, title: "I'm looking for work", desc: 'Browse job listings, apply to positions, and get hired at top hotels.' },
    { key: 'hotel', icon: Users, title: "I'm looking for staff", desc: 'Post job openings, review applications, and find the best hospitality talent.' },
];

const spring = { type: 'spring', stiffness: 400, damping: 32 };

export default function RoleSelector({ onComplete }) {
    const { user } = useAuth();
    const [selected, setSelected] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showIntro, setShowIntro] = useState(false);

    const handleConfirm = async () => {
        setSaving(true);
        await api.setRole(selected === 'hotel' ? 'hotel' : 'user');
        setShowIntro(true);
    };

    if (showIntro) {
        return <AppIntro role={selected === 'hotel' ? 'hotel' : 'server'} onDone={onComplete} />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative w-full max-w-3xl px-4">
                <div className="text-center mb-10">
                    <h1 className="font-display text-4xl font-bold text-foreground">Welcome to SeaSide Jobs</h1>
                    <p className="mt-3 text-muted-foreground text-lg">What brings you here?</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ROLES.map(({ key, icon: Icon, title, desc }) => {
                        const isSelected = selected === key;
                        const isDimmed = selected && !isSelected;
                        return (
                            <motion.button key={key} type="button"
                                onClick={() => !saving && setSelected(key)}
                                whileHover={saving ? undefined : { y: -4 }}
                                whileTap={saving ? undefined : { scale: 0.98 }}
                                animate={{ opacity: isDimmed ? 0.45 : 1, scale: isSelected ? 1.02 : 1 }}
                                transition={spring}
                                className={`relative text-left rounded-3xl border-2 p-6 cursor-pointer transition-colors duration-300 focus:outline-none ${isSelected ? 'border-primary shadow-lg shadow-primary/10' : 'border-border/50 hover:border-primary/40'}`}
                                style={{ background: 'hsl(var(--card))' }}>
                                <motion.div
                                    animate={{ backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.1)' }}
                                    transition={{ duration: 0.25 }}
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center">
                                    <Icon className={`w-7 h-7 transition-colors duration-300 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                                </motion.div>

                                <p className="font-display text-xl font-bold text-foreground mt-4">{title}</p>
                                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{desc}</p>

                                <AnimatePresence>
                                    {isSelected && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.6 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.6 }}
                                            transition={spring}
                                            className="absolute top-5 right-5 w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-4 h-4 text-primary-foreground" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.button>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {selected && (
                        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={spring} className="flex justify-center mt-8">
                            <Button onClick={handleConfirm} disabled={saving} className="h-12 px-10 rounded-2xl text-base gap-2">
                                {saving ? 'Setting up your account…' : 'Continue'}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
