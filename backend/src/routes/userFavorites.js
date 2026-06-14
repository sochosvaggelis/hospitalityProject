import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Lightweight list of favourited ref_ids — used to render heart toggle state.
router.get('/ids', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('kind, ref_id')
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Full list, enriched with hotel/job details for the Favourites page.
router.get('/', authenticate, async (req, res) => {
  const { data: favs, error } = await supabase
    .from('user_favorites')
    .select('kind, ref_id, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });

  const hotelIds = favs.filter(f => f.kind === 'hotel').map(f => f.ref_id);
  const jobIds = favs.filter(f => f.kind === 'job').map(f => f.ref_id);

  const [{ data: hotels }, { data: jobs }] = await Promise.all([
    hotelIds.length
      ? supabase.from('profiles')
          .select('id, hotel_name, full_name, hotel_logo_url, avatar_url, location, hotel_stars, hotel_description')
          .in('id', hotelIds)
      : Promise.resolve({ data: [] }),
    jobIds.length
      ? supabase.from('jobs').select('*').in('id', jobIds)
      : Promise.resolve({ data: [] }),
  ]);

  // Preserve favourite order (most recent first)
  const order = (arr, ids) => ids.map(id => arr.find(x => x.id === id)).filter(Boolean);
  res.json({
    hotels: order(hotels || [], hotelIds),
    jobs: order(jobs || [], jobIds),
  });
});

// Toggle: add if missing, remove if present.
router.post('/toggle', authenticate, async (req, res) => {
  const { kind, ref_id } = req.body;
  if (!['hotel', 'job'].includes(kind) || !ref_id) {
    return res.status(400).json({ error: 'kind (hotel|job) and ref_id required' });
  }

  const { data: existing } = await supabase
    .from('user_favorites')
    .select('id')
    .eq('user_id', req.user.id)
    .eq('kind', kind)
    .eq('ref_id', ref_id)
    .maybeSingle();

  if (existing) {
    await supabase.from('user_favorites').delete().eq('id', existing.id);
    return res.json({ favorited: false });
  }

  const { error } = await supabase.from('user_favorites').insert({
    user_id: req.user.id, kind, ref_id,
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ favorited: true });
});

export default router;
