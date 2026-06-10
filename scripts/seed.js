import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
);

// ── Users ──────────────────────────────────────────────────────────────────
const USERS = [
    { email: 'admin@seaside.com',         password: 'Admin1234!', full_name: 'Admin',              role: 'admin' },
    { email: 'info@poseidonresort.gr',    password: 'Hotel1234!', full_name: 'Poseidon Resort',    role: 'hotel', hotel_name: 'Poseidon Resort', hotel_description: 'Luxury resort με απεριόριστη θέα στην Καλδέρα της Σαντορίνης.', hotel_website: 'https://poseidonresort.gr', location: 'Santorini' },
    { email: 'jobs@mykonosblue.com',      password: 'Hotel1234!', full_name: 'Mykonos Blue Hotel', role: 'hotel', hotel_name: 'Mykonos Blue Hotel', hotel_description: 'Boutique hotel δίπλα στην παραλία Psarou με 5 αστέρια.', hotel_website: 'https://mykonosblue.com', location: 'Mykonos' },
    { email: 'hr@rhodespalace.gr',        password: 'Hotel1234!', full_name: 'Rhodes Palace',      role: 'hotel', hotel_name: 'Rhodes Palace', hotel_description: 'Ιστορικό ξενοδοχείο στη Μεσαιωνική Πόλη της Ρόδου.', hotel_website: 'https://rhodespalace.gr', location: 'Rhodes' },
    { email: 'careers@cretebeach.gr',     password: 'Hotel1234!', full_name: 'Crete Beach Resort', role: 'hotel', hotel_name: 'Crete Beach Resort', hotel_description: 'All-inclusive resort στην παραλία Ελούντα.', hotel_website: 'https://cretebeach.gr', location: 'Crete' },
    { email: 'giannis.papadopoulos@gmail.com', password: 'User1234!', full_name: 'Γιάννης Παπαδόπουλος', role: 'user', bio: '5 χρόνια εμπειρία σε fine dining εστιατόρια. Αγγλικά & Γερμανικά.', skills: 'Fine dining, Wine service, Bartending', experience_years: 5, languages_spoken: 'Ελληνικά, Αγγλικά, Γερμανικά', location: 'Athens' },
    { email: 'maria.nikolaou@gmail.com',  password: 'User1234!', full_name: 'Μαρία Νικολάου',    role: 'user', bio: 'Αποφοίτος τουριστικής σχολής. Εμπειρία σε beach bar και pool service.', skills: 'Pool service, Cocktails, Customer service', experience_years: 3, languages_spoken: 'Ελληνικά, Αγγλικά, Γαλλικά', location: 'Thessaloniki' },
    { email: 'kostas.alexiou@gmail.com',  password: 'User1234!', full_name: 'Κώστας Αλεξίου',   role: 'user', bio: 'Εξειδικευμένος σε breakfast service και buffet management.', skills: 'Breakfast service, Buffet, Team leadership', experience_years: 7, languages_spoken: 'Ελληνικά, Αγγλικά', location: 'Crete' },
    { email: 'eleni.stavros@gmail.com',   password: 'User1234!', full_name: 'Ελένη Σταύρου',   role: 'user', bio: 'Νέα στον χώρο, ενθουσιώδης και γρήγορη στη μάθηση.', skills: 'Customer service, Teamwork', experience_years: 1, languages_spoken: 'Ελληνικά, Αγγλικά', location: 'Rhodes' },
];

// ── Jobs ───────────────────────────────────────────────────────────────────
// Filled after users are created (hotel_user_id needed)
const JOBS_TEMPLATE = [
    // Poseidon Resort (Santorini) — index 1
    { hotelIdx: 1, title: 'Head Waiter / Fine Dining', category: 'head_waiter', employment_type: 'seasonal', location: 'Santorini', salary_range: '€1.400–€1.800/μήνα', positions_available: 2, start_date: 'Απρίλιος 2026', description: 'Αναζητούμε έμπειρο Head Waiter για το fine dining εστιατόριό μας με θέα στην Καλδέρα. Απαιτείται εμπειρία σε 5* περιβάλλον.', requirements: 'Τουλάχιστον 3 χρόνια εμπειρία σε fine dining. Άριστα Αγγλικά. Γνώση wine pairing.', benefits: 'Διαμονή, Γεύματα, Tips' },
    { hotelIdx: 1, title: 'Σομελιέ / Wine Expert', category: 'wine_expert', employment_type: 'seasonal', location: 'Santorini', salary_range: '€1.600–€2.000/μήνα', positions_available: 1, start_date: 'Μάιος 2026', description: 'Θέση για Sommelier με εξειδικευμένες γνώσεις ελληνικών και διεθνών οίνων.', requirements: 'Πιστοποίηση WSET Level 2 ή ανώτερη. Εμπειρία σε πολυτελή εστιατόρια.', benefits: 'Διαμονή, Γεύματα, Bonus' },
    { hotelIdx: 1, title: 'Pool & Beach Service', category: 'pool_beach', employment_type: 'seasonal', location: 'Santorini', salary_range: '€900–€1.100/μήνα', positions_available: 4, start_date: 'Ιούνιος 2026', description: 'Εξυπηρέτηση πελατών σε πισίνα και ξαπλώστρες. Ευχάριστο περιβάλλον εργασίας.', requirements: 'Εμπειρία σε hotel environment. Ευχάριστη προσωπικότητα.', benefits: 'Γεύματα, Tips' },

    // Mykonos Blue (Mykonos) — index 2
    { hotelIdx: 2, title: 'Σερβιτόρος Πρωινού', category: 'breakfast', employment_type: 'seasonal', location: 'Mykonos', salary_range: '€1.000–€1.200/μήνα', positions_available: 3, start_date: 'Μάιος 2026', description: 'Εξυπηρέτηση πρωινού σε breakfast room & terrace. Βάρδιες πρωί.', requirements: '1+ χρόνο εμπειρία. Βασικά Αγγλικά.', benefits: 'Γεύματα, Δυνατότητα ανανέωσης συμβολαίου' },
    { hotelIdx: 2, title: 'Bartender', category: 'fine_dining', employment_type: 'full_time', location: 'Mykonos', salary_range: '€1.300–€1.700/μήνα', positions_available: 2, start_date: 'Αμέσως', description: 'Bartender για το pool bar και το beach club μας. Δυνατότητα για μεγάλα tips.', requirements: 'Εμπειρία σε cocktail bar. Δημιουργικότητα. Αγγλικά.', benefits: 'Διαμονή, Γεύματα, Tips' },
    { hotelIdx: 2, title: 'Room Service Waiter', category: 'room_service', employment_type: 'seasonal', location: 'Mykonos', salary_range: '€950–€1.150/μήνα', positions_available: 2, start_date: 'Ιούνιος 2026', description: 'Room service για τις σουίτες του ξενοδοχείου. Βάρδιες πρωί–βράδυ.', requirements: 'Εμπειρία σε room service. Προσοχή στη λεπτομέρεια.', benefits: 'Γεύματα' },

    // Rhodes Palace (Rhodes) — index 3
    { hotelIdx: 3, title: 'Αρχισερβιτόρος Banquet', category: 'banquet', employment_type: 'full_time', location: 'Rhodes', salary_range: '€1.200–€1.500/μήνα', positions_available: 1, start_date: 'Αμέσως', description: 'Διαχείριση banquet events και γαμήλιων δεξιώσεων σε ιστορικό περιβάλλον.', requirements: '3+ χρόνια σε banquet service. Ηγετικές ικανότητες.', benefits: 'Γεύματα, Bonus ανά event' },
    { hotelIdx: 3, title: 'Σερβιτόρος / Σερβιτόρα', category: 'fine_dining', employment_type: 'seasonal', location: 'Rhodes', salary_range: '€900–€1.100/μήνα', positions_available: 5, start_date: 'Απρίλιος 2026', description: 'Εξυπηρέτηση στο κεντρικό εστιατόριο του ξενοδοχείου. Μεσαιωνική ατμόσφαιρα.', requirements: 'Εμπειρία σε ξενοδοχειακό εστιατόριο. Αγγλικά.', benefits: 'Διαμονή, Γεύματα, Tips' },
    { hotelIdx: 3, title: 'Catering Coordinator', category: 'catering', employment_type: 'part_time', location: 'Rhodes', salary_range: '€700–€900/μήνα', positions_available: 2, start_date: 'Ιούνιος 2026', description: 'Οργάνωση και εξυπηρέτηση catering events εκτός ξενοδοχείου.', requirements: 'Εμπειρία σε catering. Άδεια οδήγησης.', benefits: 'Γεύματα' },

    // Crete Beach Resort (Crete) — index 4
    { hotelIdx: 4, title: 'Head Waiter All-Inclusive', category: 'head_waiter', employment_type: 'seasonal', location: 'Crete', salary_range: '€1.300–€1.600/μήνα', positions_available: 2, start_date: 'Μάιος 2026', description: 'Υπεύθυνος εξυπηρέτησης σε all-inclusive resort. Διαχείριση ομάδας 8 ατόμων.', requirements: '4+ χρόνια εμπειρία. Αγγλικά, επιπλέον γλώσσα θα εκτιμηθεί.', benefits: 'Διαμονή, Γεύματα, Bonus απόδοσης' },
    { hotelIdx: 4, title: 'Pool Bar Waiter', category: 'pool_beach', employment_type: 'seasonal', location: 'Crete', salary_range: '€850–€1.050/μήνα', positions_available: 6, start_date: 'Ιούνιος 2026', description: 'Εξυπηρέτηση πισίνας και beach bar. Ζωντανό περιβάλλον εργασίας.', requirements: 'Εμπειρία σε pool/beach service. Καλή φυσική κατάσταση.', benefits: 'Γεύματα, Tips' },
    { hotelIdx: 4, title: 'Breakfast & Buffet Waiter', category: 'breakfast', employment_type: 'seasonal', location: 'Crete', salary_range: '€900–€1.100/μήνα', positions_available: 4, start_date: 'Μάιος 2026', description: 'Ετοιμασία και εξυπηρέτηση πλούσιου πρωινού buffet για 500+ πελάτες.', requirements: 'Εμπειρία σε buffet management. Οργανωτικές ικανότητες.', benefits: 'Γεύματα, Δωρεάν διαμονή' },
];

async function createUser({ email, password, full_name, role, ...profileData }) {
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
    });
    if (error) {
        if (error.message.includes('already been registered')) {
            console.log(`  ⚠ User already exists: ${email}`);
            const { data: list } = await supabase.auth.admin.listUsers();
            return list.users.find(u => u.email === email);
        }
        throw error;
    }

    await supabase.from('profiles').update({
        full_name,
        role,
        role_chosen: true,
        ...profileData,
    }).eq('id', data.user.id);

    console.log(`  ✓ ${role.padEnd(6)} ${email}`);
    return data.user;
}

async function main() {
    console.log('\n🌊 SeaSide Jobs — Seed Script\n');

    console.log('Creating users...');
    const createdUsers = [];
    for (const u of USERS) {
        const user = await createUser(u);
        createdUsers.push(user);
    }

    console.log('\nCreating jobs...');
    const jobIds = [];
    for (const tmpl of JOBS_TEMPLATE) {
        const hotelUser = createdUsers[tmpl.hotelIdx];
        const { data: profile } = await supabase.from('profiles').select('hotel_name, avatar_url').eq('id', hotelUser.id).single();
        const { data: job, error } = await supabase.from('jobs').insert({
            title: tmpl.title,
            category: tmpl.category,
            employment_type: tmpl.employment_type,
            location: tmpl.location,
            salary_range: tmpl.salary_range,
            positions_available: tmpl.positions_available,
            start_date: tmpl.start_date,
            description: tmpl.description,
            requirements: tmpl.requirements,
            benefits: tmpl.benefits,
            status: 'active',
            hotel_name: profile?.hotel_name || USERS[tmpl.hotelIdx].full_name,
            hotel_user_id: hotelUser.id,
            hotel_logo: profile?.avatar_url || '',
        }).select().single();
        if (error) { console.log(`  ✗ ${tmpl.title}: ${error.message}`); continue; }
        jobIds.push(job.id);
        console.log(`  ✓ [${tmpl.location}] ${tmpl.title}`);
    }

    console.log('\nCreating applications...');
    // Giannis applies to 3 jobs
    const giannisUser = createdUsers[5];
    const { data: giannisProfile } = await supabase.from('profiles').select('full_name, email').eq('id', giannisUser.id).single();

    // Maria applies to 2 jobs
    const mariaUser = createdUsers[6];
    const { data: mariaProfile } = await supabase.from('profiles').select('full_name, email').eq('id', mariaUser.id).single();

    // Kostas applies to 2 jobs
    const kostasUser = createdUsers[7];
    const { data: kostasProfile } = await supabase.from('profiles').select('full_name, email').eq('id', kostasUser.id).single();

    const applications = [
        { jobIdx: 0, applicant: giannisProfile, status: 'reviewed',  cover_letter: 'Έχω 5 χρόνια εμπειρία σε fine dining και θα χαρώ πολύ να συνεισφέρω στο εστιατόριό σας.' },
        { jobIdx: 3, applicant: giannisProfile, status: 'pending',   cover_letter: 'Ενδιαφέρομαι πολύ για τη θέση breakfast waiter.' },
        { jobIdx: 6, applicant: giannisProfile, status: 'accepted',  cover_letter: 'Εξειδικευμένος σε banquet events, θα ήταν χαρά μου να εργαστώ στο Rhodes Palace.' },
        { jobIdx: 1, applicant: mariaProfile,   status: 'pending',   cover_letter: 'Έχω πιστοποίηση WSET Level 2 και εμπειρία σε ελληνικούς οίνους.' },
        { jobIdx: 9, applicant: mariaProfile,   status: 'reviewed',  cover_letter: 'Αγαπώ το all-inclusive περιβάλλον και έχω εμπειρία σε μεγάλα resorts.' },
        { jobIdx: 10, applicant: kostasProfile, status: 'accepted',  cover_letter: 'Ειδικεύομαι σε pool bar service και cocktails. Διαθέσιμος άμεσα.' },
        { jobIdx: 11, applicant: kostasProfile, status: 'pending',   cover_letter: 'Εμπειρία σε buffet management για 400+ άτομα. Οργανωτικός και αξιόπιστος.' },
    ];

    for (const app of applications) {
        const { data: job } = await supabase.from('jobs').select('title, hotel_name, hotel_user_id').eq('id', jobIds[app.jobIdx]).single();
        if (!job) continue;
        const { error } = await supabase.from('applications').insert({
            job_id: jobIds[app.jobIdx],
            job_title: job.title,
            hotel_name: job.hotel_name,
            hotel_user_id: job.hotel_user_id,
            applicant_name: app.applicant.full_name,
            applicant_email: app.applicant.email || USERS[5 + applications.indexOf(app) % 3].email,
            cover_letter: app.cover_letter,
            status: app.status,
        });
        if (!error) console.log(`  ✓ ${app.applicant.full_name} → ${job.title} (${app.status})`);
    }

    console.log('\n✅ Done!\n');
}

main().catch(console.error);
