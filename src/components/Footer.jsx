import { Link } from 'react-router-dom';
import { Waves } from 'lucide-react';
import useLanguage from '@/lib/useLanguage';

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="mt-auto" style={{ background: '#0f172a' }}>
            <div className="w-full overflow-hidden leading-[0]">
                <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-16 sm:h-20 block" style={{ fill: '#eef4fd' }}>
                    <path d="M0,0 C180,80 360,0 540,60 C720,80 900,10 1080,60 C1260,80 1380,20 1440,40 L1440,0 Z" />
                </svg>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <Waves className="w-4 h-4 text-primary-foreground" />
                            </div>
                            <span className="font-display font-semibold text-white">SeaSide Jobs</span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">
                            {t('footer_about_text')}
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">{t('footer_links')}</h4>
                        <div className="space-y-2">
                            <Link to="/jobs" className="block text-sm text-white/60 hover:text-[#38d4f5] transition-colors">
                                {t('nav_jobs')}
                            </Link>
                            <Link to="/dashboard" className="block text-sm text-white/60 hover:text-[#38d4f5] transition-colors">
                                {t('nav_dashboard')}
                            </Link>
                            <Link to="/profile" className="block text-sm text-white/60 hover:text-[#38d4f5] transition-colors">
                                {t('nav_profile')}
                            </Link>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-4">{t('footer_contact')}</h4>
                        <p className="text-sm text-white/60">info@seasidejobs.gr</p>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center text-xs text-white/50">
                    <span>© {new Date().getFullYear()} SeaSide Jobs. {t('footer_rights')}</span>
                    <div className="flex items-center gap-4">
                        <Link to="/terms" className="hover:text-[#38d4f5] transition-colors">{t('footer_terms')}</Link>
                        <span className="text-white/20">·</span>
                        <Link to="/privacy" className="hover:text-[#38d4f5] transition-colors">{t('footer_privacy')}</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}