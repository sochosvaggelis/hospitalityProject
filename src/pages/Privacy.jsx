import useLanguage from '@/lib/useLanguage';

const sections = {
    el: [
        ['1. Ποια Δεδομένα Συλλέγουμε', 'Συλλέγουμε τα στοιχεία που μας παρέχετε κατά την εγγραφή και τη συμπλήρωση του προφίλ σας: όνομα, email, τηλέφωνο, εμπειρία, βιογραφικό και τοποθεσία. Για επιχειρήσεις, συλλέγουμε επωνυμία και στοιχεία επικοινωνίας.'],
        ['2. Πώς τα Χρησιμοποιούμε', 'Τα δεδομένα σας χρησιμοποιούνται αποκλειστικά για τη λειτουργία της πλατφόρμας: σύνδεση υποψηφίων με επιχειρήσεις, ειδοποιήσεις για αιτήσεις και μηνύματα, και βελτίωση της υπηρεσίας.'],
        ['3. Κοινοποίηση σε Τρίτους', 'Το προφίλ σας γίνεται ορατό σε επιχειρήσεις μόνο όταν υποβάλλετε αίτηση στην αγγελία τους. Δεν πουλάμε ούτε ενοικιάζουμε προσωπικά δεδομένα σε τρίτους.'],
        ['4. Διατήρηση Δεδομένων', 'Τα δεδομένα σας διατηρούνται όσο ο λογαριασμός σας είναι ενεργός. Μπορείτε να ζητήσετε διαγραφή του λογαριασμού και των δεδομένων σας ανά πάσα στιγμή.'],
        ['5. Τα Δικαιώματά σας (GDPR)', 'Έχετε δικαίωμα πρόσβασης, διόρθωσης, διαγραφής και φορητότητας των δεδομένων σας, καθώς και δικαίωμα εναντίωσης στην επεξεργασία τους. Για την άσκηση των δικαιωμάτων σας, επικοινωνήστε μαζί μας.'],
        ['6. Ασφάλεια', 'Εφαρμόζουμε κατάλληλα τεχνικά μέτρα για την προστασία των δεδομένων σας. Η πρόσβαση στα δεδομένα περιορίζεται σε όσους τη χρειάζονται για τη λειτουργία της υπηρεσίας.'],
        ['7. Επικοινωνία', 'Για οποιοδήποτε θέμα σχετικό με τα προσωπικά σας δεδομένα, επικοινωνήστε στο info@seasidejobs.gr.'],
    ],
    en: [
        ['1. What Data We Collect', 'We collect the information you provide when registering and completing your profile: name, email, phone, experience, CV and location. For businesses, we collect company name and contact details.'],
        ['2. How We Use It', 'Your data is used solely to operate the platform: connecting candidates with businesses, notifications about applications and messages, and improving the service.'],
        ['3. Sharing with Third Parties', 'Your profile becomes visible to a business only when you apply to their job listing. We do not sell or rent personal data to third parties.'],
        ['4. Data Retention', 'Your data is kept for as long as your account is active. You can request deletion of your account and data at any time.'],
        ['5. Your Rights (GDPR)', 'You have the right to access, rectify, delete and port your data, as well as the right to object to its processing. To exercise your rights, contact us.'],
        ['6. Security', 'We apply appropriate technical measures to protect your data. Access to data is limited to those who need it to operate the service.'],
        ['7. Contact', 'For any matter concerning your personal data, contact us at info@seasidejobs.gr.'],
    ],
};

export default function Privacy() {
    const { lang } = useLanguage();

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground">
                {lang === 'el' ? 'Πολιτική Απορρήτου' : 'Privacy Policy'}
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
