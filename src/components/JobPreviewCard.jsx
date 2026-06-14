import { MapPin, Clock, Users, Briefcase, Calendar, DollarSign, Award, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatSalary } from '@/lib/i18n';
import { monthRange } from '@/lib/utils';
import JobImage from './JobImage';

// A non-interactive replica of the public listing, rendered from the PostJob form
// in a single language. `lang` is 'en' | 'el'.
export default function JobPreviewCard({ form, photoPreview, lang, hotelName, hotelLogo, empMap, catMap, islands }) {
    const el = lang === 'el';
    const title = (el ? form.title_el : form.title) || (el ? 'Τίτλος θέσης' : 'Job title');
    const description = el ? form.description_el : form.description;
    const requirements = el ? form.requirements_el : form.requirements;
    const benefits = el ? form.benefits_el : form.benefits;

    const empLabel = empMap[form.employment_type]?.[lang] ?? empMap[form.employment_type]?.en ?? form.employment_type;
    const job = { ...form, photo_url: photoPreview || null };

    return (
        <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
            <div className="relative h-40">
                <JobImage job={job} islands={islands} />
                {hotelLogo ? (
                    <img src={hotelLogo} alt="" className="absolute bottom-0 left-6 translate-y-1/2 w-14 h-14 rounded-2xl object-cover border-2 border-card shadow-md" />
                ) : (
                    <div className="absolute bottom-0 left-6 translate-y-1/2 w-14 h-14 rounded-2xl bg-primary border-2 border-card shadow-md flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-primary-foreground" />
                    </div>
                )}
            </div>

            <div className="p-6 pt-10">
                <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
                {hotelName && <p className="text-muted-foreground mt-1">{hotelName}</p>}

                <div className="flex flex-wrap gap-2 mt-4 mb-6">
                    {form.location && <Badge variant="secondary" className="gap-1 rounded-lg py-1.5 px-3"><MapPin className="w-3.5 h-3.5" />{form.location}</Badge>}
                    {form.employment_type && <Badge variant="outline" className="gap-1 rounded-lg py-1.5 px-3"><Clock className="w-3.5 h-3.5" />{empLabel}</Badge>}
                    {form.positions_available > 0 && <Badge variant="outline" className="gap-1 rounded-lg py-1.5 px-3"><Users className="w-3.5 h-3.5" />{form.positions_available} {el ? 'θέσεις' : 'positions'}</Badge>}
                    {form.salary_amount && <Badge variant="secondary" className="gap-1 rounded-lg py-1.5 px-3 bg-primary/10 text-primary border-0"><DollarSign className="w-3.5 h-3.5" />{formatSalary(form.salary_amount, form.salary_period, lang)}</Badge>}
                    {form.salary_negotiable && <Badge variant="outline" className="rounded-lg py-1.5 px-3">{el ? 'Συζητήσιμη τιμή' : 'Negotiable'}</Badge>}
                    {(form.start_date || form.end_date) && <Badge variant="outline" className="gap-1 rounded-lg py-1.5 px-3"><Calendar className="w-3.5 h-3.5" />{monthRange(form.start_date, form.end_date, lang)}</Badge>}
                </div>

                <div className="space-y-5">
                    <div>
                        <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Briefcase className="w-4 h-4 text-primary" />{el ? 'Περιγραφή Θέσης' : 'Job Description'}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{description || <span className="italic opacity-60">{el ? 'Η περιγραφή θα εμφανιστεί εδώ…' : 'The description will appear here…'}</span>}</p>
                    </div>
                    {requirements && (
                        <div>
                            <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-primary" />{el ? 'Απαιτήσεις' : 'Requirements'}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{requirements}</p>
                        </div>
                    )}
                    {benefits && (
                        <div>
                            <h2 className="font-semibold text-foreground mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />{el ? 'Παροχές' : 'Benefits'}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{benefits}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
