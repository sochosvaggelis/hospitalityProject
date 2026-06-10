// Κατεβάζει τις εικόνες νησιών από base44 και τις ανεβάζει στο Supabase Storage
// Εκτέλεση: node scripts/migrate-island-images.js

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gqgiiohrammlcrhghzmk.supabase.co';
const SERVICE_ROLE_KEY = '';
const BUCKET = 'hospitalityBucket';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
    const { data: islands, error } = await supabase
        .from('islands')
        .select('id, name, outline_url')
        .order('display_order');

    if (error) { console.error('Σφάλμα φόρτωσης νησιών:', error.message); process.exit(1); }

    console.log(`Βρέθηκαν ${islands.length} νησιά\n`);

    for (const island of islands) {
        const srcUrl = island.outline_url;
        if (!srcUrl || !srcUrl.includes('base44')) {
            console.log(`⏭  ${island.name} — παραλείπεται (δεν είναι base44 URL)`);
            continue;
        }

        try {
            console.log(`⬇  ${island.name} — κατεβαίνει...`);
            const res = await fetch(srcUrl);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const buffer = await res.arrayBuffer();
            const contentType = res.headers.get('content-type') || 'image/webp';
            const ext = srcUrl.split('.').pop().split('?')[0] || 'webp';
            const filename = `islands/${island.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(filename, buffer, { contentType, upsert: true });

            if (uploadError) throw new Error(uploadError.message);

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(filename);

            const { error: updateError } = await supabase
                .from('islands')
                .update({ outline_url: publicUrl })
                .eq('id', island.id);

            if (updateError) throw new Error(updateError.message);

            console.log(`✅  ${island.name} → ${publicUrl}`);
        } catch (err) {
            console.error(`❌  ${island.name} — σφάλμα: ${err.message}`);
        }
    }

    console.log('\nΟλοκληρώθηκε!');
}

run();
