import useLanguage from '@/lib/useLanguage';

const sections = {
    el: [
        ['1. Αποδοχή των Όρων', 'Με την πρόσβαση και τη χρήση του SeaSide Jobs αποδέχεστε τους παρόντες Όρους Χρήσης. Εάν δεν συμφωνείτε, παρακαλούμε μην χρησιμοποιείτε την πλατφόρμα.'],
        ['2. Περιγραφή Υπηρεσίας', 'Το SeaSide Jobs είναι πλατφόρμα που συνδέει επαγγελματίες φιλοξενίας με ξενοδοχεία και καταστήματα στα ελληνικά νησιά. Δεν είμαστε εργοδότης και δεν εγγυόμαστε την πρόσληψη ή την ποιότητα των αγγελιών.'],
        ['3. Λογαριασμοί Χρηστών', 'Είστε υπεύθυνοι για την ακρίβεια των στοιχείων του προφίλ σας και για τη διαφύλαξη των στοιχείων σύνδεσής σας. Απαγορεύεται η δημιουργία ψευδών προφίλ ή αγγελιών.'],
        ['4. Υποχρεώσεις Επιχειρήσεων', 'Οι επιχειρήσεις που δημοσιεύουν αγγελίες οφείλουν να παρέχουν ακριβείς πληροφορίες για τη θέση, την αμοιβή και τις συνθήκες εργασίας, σύμφωνα με την ελληνική εργατική νομοθεσία.'],
        ['5. Περιορισμός Ευθύνης', 'Η πλατφόρμα παρέχεται "ως έχει". Δεν φέρουμε ευθύνη για συμφωνίες ή διαφορές που προκύπτουν μεταξύ υποψηφίων και επιχειρήσεων.'],
        ['6. Τροποποιήσεις', 'Διατηρούμε το δικαίωμα να τροποποιούμε τους παρόντες όρους. Οι αλλαγές ισχύουν από τη δημοσίευσή τους στην πλατφόρμα.'],
        ['7. Επικοινωνία', 'Για οποιαδήποτε απορία σχετικά με τους Όρους Χρήσης, επικοινωνήστε στο info@seasidejobs.gr.'],
    ],
    en: [
        ['1. Acceptance of Terms', 'By accessing and using SeaSide Jobs you accept these Terms of Use. If you do not agree, please do not use the platform.'],
        ['2. Service Description', 'SeaSide Jobs is a platform connecting hospitality professionals with hotels and venues on the Greek islands. We are not an employer and do not guarantee hiring or the quality of job listings.'],
        ['3. User Accounts', 'You are responsible for the accuracy of your profile information and for keeping your login credentials secure. Creating false profiles or listings is prohibited.'],
        ['4. Business Obligations', 'Businesses posting jobs must provide accurate information about the position, pay and working conditions, in accordance with Greek labour law.'],
        ['5. Limitation of Liability', 'The platform is provided "as is". We are not liable for agreements or disputes arising between candidates and businesses.'],
        ['6. Changes', 'We reserve the right to modify these terms. Changes take effect upon publication on the platform.'],
        ['7. Contact', 'For any questions about these Terms of Use, contact us at info@seasidejobs.gr.'],
    ],
};

export default function Terms() {
    const { lang } = useLanguage();

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground">
                {lang === 'el' ? 'Όροι Χρήσης' : 'Terms of Use'}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
                {lang === 'el' ? 'Τελευταία ενημέρωση: Ιούνιος 2026' : 'Last updated: June 2026'}
            </p>
            <div className="mt-8 space-y-8">
                {sections[lang === 'el' ? 'el' : 'en'].map(([title, body]) => (
                    <section key={title}>
                        <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-2">{title}</h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{body}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}
