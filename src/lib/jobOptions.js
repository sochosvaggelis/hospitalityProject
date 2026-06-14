// Predefined, bilingual options for the checkbox-style job fields. Each option
// carries its canonical EN + EL label so a single checklist can populate both
// the *_en and *_el text columns at once. Stored values stay plain newline-
// separated text, so display/preview/backend code needs no changes.

export const BENEFIT_OPTIONS = [
    { key: 'accommodation', en: 'Accommodation', el: 'Διαμονή' },
    { key: 'meals', en: 'Meals', el: 'Γεύματα' },
    { key: 'transport', en: 'Transport', el: 'Μεταφορά' },
    { key: 'tips', en: 'Tips', el: 'Φιλοδωρήματα' },
    { key: 'bonus', en: 'End-of-season bonus', el: 'Bonus τέλους σεζόν' },
    { key: 'insurance', en: 'Health insurance', el: 'Ιατροφαρμακευτική κάλυψη' },
    { key: 'training', en: 'Training', el: 'Εκπαίδευση' },
    { key: 'uniform', en: 'Uniform provided', el: 'Στολή εργασίας' },
    { key: 'weekly_off', en: 'Weekly day off', el: 'Ρεπό εβδομαδιαίως' },
    { key: 'career', en: 'Career growth', el: 'Προοπτικές εξέλιξης' },
];

export const REQUIREMENT_OPTIONS = [
    { key: 'experience', en: 'Previous experience', el: 'Προϋπηρεσία' },
    { key: 'english', en: 'Good English', el: 'Καλά Αγγλικά' },
    { key: 'greek', en: 'Greek language', el: 'Ελληνικά' },
    { key: 'languages', en: 'Additional languages', el: 'Επιπλέον γλώσσες' },
    { key: 'teamwork', en: 'Team player', el: 'Ομαδικό πνεύμα' },
    { key: 'availability', en: 'Full-season availability', el: 'Διαθεσιμότητα όλη τη σεζόν' },
    { key: 'appearance', en: 'Well-groomed appearance', el: 'Ευπαρουσίαστο' },
    { key: 'driving', en: 'Driving license', el: 'Δίπλωμα οδήγησης' },
    { key: 'eu_permit', en: 'EU work permit', el: 'Άδεια εργασίας ΕΕ' },
    { key: 'hygiene', en: 'Food hygiene certificate', el: 'Πιστοποιητικό υγιεινής' },
];
