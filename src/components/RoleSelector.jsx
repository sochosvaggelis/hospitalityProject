import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UtensilsCrossed, Building2, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';

export default function RoleSelector({ onComplete }) {
    const { user } = useAuth();
    const [selected, setSelected] = useState(null);
    const [saving, setSaving] = useState(false);

    const handleConfirm = async () => {
        setSaving(true);
        await api.setRole(selected === 'hotel' ? 'hotel' : 'user');
        await onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative w-full max-w-3xl px-4">
                <div className="text-center mb-10">
                    <h1 className="font-display text-4xl font-bold text-foreground">Welcome to SeaSide Jobs</h1>
                    <p className="mt-3 text-muted-foreground text-lg">I am joining as a…</p>
                </div>

                <div className="flex gap-4 h-72 relative">
                    {[
                        { key: 'server', icon: UtensilsCrossed, title: 'Server', desc: 'Browse job listings, apply to positions, and get hired at top hotels.' },
                        { key: 'hotel', icon: Building2, title: 'Hotel', desc: 'Post job openings, review applications, and find the best hospitality talent.' },
                    ].map(({ key, icon: Icon, title, desc }) => (
                        <motion.div key={key}
                            onClick={() => !saving && setSelected(key)}
                            animate={{
                                flex: selected && selected !== key ? 0.3 : selected === key ? 1.7 : 1,
                                opacity: selected && selected !== key ? 0.4 : 1,
                            }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className={`relative rounded-3xl overflow-hidden cursor-pointer border-2 transition-colors duration-300 ${selected === key ? 'border-primary' : 'border-border/50'}`}
                            style={{ background: 'hsl(var(--card))' }}>
                            <div className="relative h-full flex flex-col items-center justify-center gap-4 p-6">
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors duration-300 ${selected === key ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}`}>
                                    <Icon className="w-8 h-8" />
                                </div>
                                <AnimatePresence mode="wait">
                                    {selected !== (key === 'server' ? 'hotel' : 'server') && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="text-center">
                                            <p className="font-display text-2xl font-bold text-foreground">{title}</p>
                                            {selected === key && (
                                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="text-sm text-muted-foreground mt-2 max-w-xs">
                                                    {desc}
                                                </motion.p>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                {selected === key && (
                                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}>
                                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                                            <Check className="w-4 h-4 text-white" />
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <AnimatePresence>
                    {selected && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="flex justify-center mt-8">
                            <Button onClick={handleConfirm} disabled={saving} className="h-12 px-10 rounded-2xl text-base gap-2">
                                {saving ? 'Setting up your account…' : `Continue as ${selected === 'hotel' ? 'Hotel' : 'Server'}`}
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
