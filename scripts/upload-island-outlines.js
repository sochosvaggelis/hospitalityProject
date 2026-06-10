// Ανεβάζει τα local *_outline.webp στο Supabase Storage και ενημερώνει τον islands πίνακα
// Εκτέλεση: node scripts/upload-island-outlines.js

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = 'https://gqgiiohrammlcrhghzmk.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxZ2lpb2hyYW1tbGNyaGdoem1rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzgwMjE2MywiZXhwIjoyMDkzMzc4MTYzfQ.fpGUV9LpwAOPeoZ7i7T4wij3ZV0v05NMLdIXSHz5Jvo';
const BUCKET = 'hospitalityBucket';
const SCRIPTS_DIR = join(__dirname, '..', 'pythonscripts');

// filename (χωρίς _outline.webp) → island name στη βάση
const FILE_TO_ISLAND = {
    crete:      'Crete',
    kerkira:    'Corfu',
    mikonos:    'Mykonos',
    rode:       'Rhodes',
    zakinthos:  'Zakynthos',
    santorini:  'Santorini',
    milos:      'Milos',
    naxos:      'Naxos',
    paros:      'Paros',
    lefkada:    'Lefkada',
    skiathos:   'Skiathos',
    hydra:      'Hydra',
    ios:        'Ios',
    kefalonia:  'Kefalonia',
    samos:      'Samos',
};

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function run() {
    for (const [fileKey, islandName] of Object.entries(FILE_TO_ISLAND)) {
        const localPath = join(SCRIPTS_DIR, `${fileKey}_outline.webp`);
        const storagePath = `islands/${islandName.toLowerCase()}.webp`;

        try {
            const buffer = readFileSync(localPath);

            const { error: uploadError } = await supabase.storage
                .from(BUCKET)
                .upload(storagePath, buffer, { contentType: 'image/webp', upsert: true });

            if (uploadError) throw new Error(uploadError.message);

            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(storagePath);

            const { error: updateError } = await supabase
                .from('islands')
                .update({ outline_url: publicUrl })
                .eq('name', islandName);

            if (updateError) throw new Error(updateError.message);

            console.log(`ok  ${islandName}`);
        } catch (err) {
            console.error(`ERR ${islandName}: ${err.message}`);
        }
    }

    console.log('\nOloklirothhke!');
}

run();
