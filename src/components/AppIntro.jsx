import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const img = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=80`;

const SLIDES = {
    server: [
        {
            title: 'Discover the right job',
            desc: 'Browse hand-picked hospitality openings from top hotels and resorts, filtered by role, island, and season.',
            image: '/applyToJobs.png',
            shot: true,
        },
        {
            title: 'Apply in a tap',
            desc: 'Build your profile once, attach your resume, and apply to any position in seconds — no paperwork.',
            image: '/applyToJob.png',
            shot: true,
        },
        {
            title: 'Get hired & stay in touch',
            desc: 'Chat directly with employers, track your applications, and land your next summer role.',
            image: img('photo-1559339352-11d035aa65de'),
        },
    ],
    hotel: [
        {
            title: 'Post your openings',
            desc: 'Create rich job listings with photos and details, and reach qualified hospitality talent instantly.',
            image: '/jobpostplaceholder.png',
            shot: true,
        },
        {
            title: 'Review applicants with ease',
            desc: 'See candidates in one place, add private notes, and shortlist the people who fit your team.',
            image: '/applicants.png',
            shot: true,
        },
        {
            title: 'Hire the best talent',
            desc: 'Message candidates directly and fill your roles before the season starts.',
            image: img('photo-1571896349842-33c89424de2d'),
        },
    ],
};

const spring = { type: 'spring', stiffness: 380, damping: 34 };

export default function AppIntro({ role, onDone }) {
    const slides = SLIDES[role] || SLIDES.server;
    const [step, setStep] = useState(0);
    const [dir, setDir] = useState(1);

    const isLast = step === slides.length - 1;

    const go = (next) => {
        setDir(next > step ? 1 : -1);
        setStep(next);
    };

    const slide = slides[step];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="relative w-full max-w-4xl px-4">
                <div className="rounded-3xl overflow-hidden border-2 border-border/50 bg-card shadow-xl grid grid-cols-1 md:grid-cols-2 min-h-[28rem]">
                    {/* Image side */}
                    <div className="relative h-60 md:h-auto overflow-hidden bg-muted">
                        <AnimatePresence mode="wait" custom={dir}>
                            {slide.shot ? (
                                <motion.div
                                    key={slide.image}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.4, ease: 'easeOut' }}
                                    className="absolute inset-0 flex items-center justify-center p-5"
                                    style={{ background: 'linear-gradient(135deg, hsl(205 78% 38%) 0%, hsl(190 80% 55%) 100%)' }}>
                                    {/* Browser window mockup */}
                                    <div className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl ring-1 ring-black/10 bg-white">
                                        <div className="flex items-center gap-1.5 px-3 h-7 bg-slate-100 border-b border-slate-200">
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                            <div className="ml-2 flex-1 h-3.5 rounded bg-slate-200" />
                                        </div>
                                        <img src={slide.image} alt="" className="w-full h-auto block" />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.img
                                    key={slide.image}
                                    src={slide.image}
                                    alt=""
                                    initial={{ opacity: 0, scale: 1.05 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.02 }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                    className="absolute inset-0 w-full h-full object-cover"
                                />
                            )}
                        </AnimatePresence>
                        {!slide.shot && <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r" />}
                    </div>

                    {/* Text side */}
                    <div className="relative flex flex-col p-8 md:p-10">
                        <h1 className="font-display text-3xl font-bold text-foreground leading-tight mb-6">
                            {role === 'hotel' ? 'For hotels' : 'For job seekers'}
                        </h1>

                        <div className="flex-1 flex flex-col justify-center overflow-hidden">
                            <AnimatePresence mode="wait" custom={dir}>
                                <motion.div
                                    key={step}
                                    custom={dir}
                                    initial={{ opacity: 0, x: dir * 24 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: dir * -24 }}
                                    transition={spring}
                                >
                                    <h2 className="font-display text-2xl font-bold text-foreground leading-tight">
                                        {slide.title}
                                    </h2>
                                    <p className="mt-3 text-muted-foreground leading-relaxed">
                                        {slide.desc}
                                    </p>
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Controls */}
                        <div className="mt-8 flex items-center justify-between">
                            <div className="flex gap-2">
                                {slides.map((_, i) => (
                                    <button key={i} type="button" onClick={() => go(i)} aria-label={`Go to step ${i + 1}`}>
                                        <motion.div
                                            animate={{ width: i === step ? 24 : 8, opacity: i === step ? 1 : 0.4 }}
                                            transition={spring}
                                            className="h-2 rounded-full bg-primary"
                                        />
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2">
                                {step > 0 && (
                                    <Button variant="ghost" onClick={() => go(step - 1)} className="h-11 px-4 rounded-2xl gap-2">
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>
                                )}
                                {isLast ? (
                                    <Button onClick={onDone} className="h-11 px-8 rounded-2xl text-base gap-2">
                                        Get started
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <Button onClick={() => go(step + 1)} className="h-11 px-6 rounded-2xl text-base gap-2">
                                        Next
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-5">
                    <button type="button" onClick={onDone} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        Skip intro
                    </button>
                </div>
            </div>
        </div>
    );
}
