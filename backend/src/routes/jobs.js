import { Router } from 'express';
import multer from 'multer';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';


const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Hotel: upload a job photo, returns the public URL
router.post('/photo', authenticate, requireRole('hotel'), upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Only image files are allowed' });
  const ext = req.file.originalname.split('.').pop();
  const path = `job-photos/${req.user.id}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('hospitalityBucket')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });
  const { data: { publicUrl } } = supabase.storage.from('hospitalityBucket').getPublicUrl(path);
  res.json({ url: publicUrl });
});

// Applies the public visibility rules + all list filters to a query builder.
// The start/end dates are informative only and never affect visibility.
function applyJobFilters(query, { category, employment_type, location, listing_lang, search }) {
  query = query.eq('status', 'active');
  if (category && category !== 'all') query = query.eq('category', category);
  if (employment_type && employment_type !== 'all') query = query.eq('employment_type', employment_type);
  if (location && location !== 'all') query = query.ilike('location', `%${location}%`);
  if (listing_lang && listing_lang !== 'all') {
    query = listing_lang === 'both' ? query.eq('listing_lang', 'both') : query.in('listing_lang', [listing_lang, 'both']);
  }
  if (search && search.trim()) {
    const term = search.trim().replace(/[,%()*]/g, ' ');
    query = query.or(`title.ilike.%${term}%,title_el.ilike.%${term}%,hotel_name.ilike.%${term}%,location.ilike.%${term}%`);
  }
  return query;
}

// Public: paginated list of active jobs with server-side filters & search.
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit, 10) || 12));
  const offset = (page - 1) * limit;

  let query = applyJobFilters(
    supabase.from('jobs').select('*', { count: 'exact' }),
    req.query,
  ).order('created_at', { ascending: false }).range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json({
    jobs: data || [],
    total: count ?? 0,
    page,
    limit,
    hasMore: offset + (data?.length || 0) < (count ?? 0),
  });
});

// Public: aggregate counts for the home page (total + per island). Computed
// server-side so the client never loads every job just to count them.
router.get('/stats', async (req, res) => {
  const countActive = (loc) => {
    let q = supabase.from('jobs').select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    if (loc) q = q.ilike('location', `%${loc}%`);
    return q;
  };
  const { data: islands } = await supabase.from('islands').select('name');
  const [{ count: total }, perIsland] = await Promise.all([
    countActive(),
    Promise.all((islands || []).map(async i => [i.name, (await countActive(i.name)).count || 0])),
  ]);
  res.json({ total: total || 0, byIsland: Object.fromEntries(perIsland) });
});

// Public: lightweight markers for the island map (active jobs with coordinates).
router.get('/map', async (req, res) => {
  let query = applyJobFilters(
    supabase.from('jobs').select('id, title, title_el, hotel_user_id, hotel_name, location, lat, lng'),
    req.query,
  ).not('lat', 'is', null).order('created_at', { ascending: false }).limit(2000);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Hotel: own jobs (all statuses)
router.get('/mine', authenticate, requireRole('hotel'), async (req, res) => {
  const { data, error } = await supabase.from('jobs').select('*').eq('hotel_user_id', req.user.id).order('created_at', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Public: single job
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Job not found' });
  res.json(data);
});

// Hotel only: create job
router.post('/', authenticate, requireRole('hotel'), async (req, res) => {
  const { title, title_el, listing_lang, location, description, description_el, requirements, requirements_el, employment_type, salary_amount, salary_period, salary_negotiable, positions_available, start_date, end_date, category, benefits, benefits_el, photo_url, photo_position, status, venue_id } = req.body;

  // Snapshot the listing's hotel identity from the chosen venue when present,
  // falling back to the account profile (keeps single-venue accounts working).
  let venue = null;
  if (venue_id) {
    const { data } = await supabase.from('venues').select('*').eq('id', venue_id).eq('owner_user_id', req.user.id).single();
    venue = data;
  }
  const { data: hotelProfile } = await supabase.from('profiles').select('lat, lng').eq('id', req.user.id).single();

  const { data, error } = await supabase.from('jobs').insert({
    title, title_el: title_el || null, listing_lang: listing_lang || 'en',
    location: venue?.location || location,
    description, requirements, employment_type,
    description_el: description_el || null,
    requirements_el: requirements_el || null,
    benefits_el: benefits_el || null,
    photo_url: photo_url || null,
    photo_position: photo_url ? (photo_position || null) : null,
    salary_amount: salary_amount || null,
    salary_period: salary_period || null,
    salary_negotiable: salary_negotiable || false,
    positions_available, start_date: start_date || null, end_date: end_date || null, category, benefits,
    status: status === 'draft' ? 'draft' : 'active',
    venue_id: venue?.id || null,
    hotel_name: venue?.name || req.user.hotel_name || req.user.full_name,
    hotel_user_id: req.user.id,
    hotel_logo: venue?.logo_url || req.user.hotel_logo_url || req.user.avatar_url || '',
    lat: venue ? (venue.lat ?? null) : (hotelProfile?.lat || null),
    lng: venue ? (venue.lng ?? null) : (hotelProfile?.lng || null),
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Hotel owner: edit job
router.put('/:id', authenticate, async (req, res) => {
  const { data: job } = await supabase.from('jobs').select('hotel_user_id').eq('id', req.params.id).single();
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.hotel_user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Partial update: only fields present in the body are touched, so callers
  // (e.g. a status-only toggle) can't accidentally wipe salary or photo.
  const ALLOWED_FIELDS = [
    'title', 'title_el', 'listing_lang', 'location',
    'description', 'description_el', 'requirements', 'requirements_el', 'benefits', 'benefits_el',
    'employment_type', 'salary_amount', 'salary_period', 'salary_negotiable',
    'positions_available', 'start_date', 'end_date', 'category', 'status', 'photo_url', 'photo_position',
  ];
  const NULLABLE_FIELDS = ['title_el', 'description_el', 'requirements_el', 'benefits_el', 'salary_amount', 'salary_period', 'photo_url', 'photo_position', 'start_date', 'end_date'];
  const updates = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in req.body) updates[key] = NULLABLE_FIELDS.includes(key) ? (req.body[key] || null) : req.body[key];
  }
  // Changing the venue re-snapshots the listing's hotel identity from it.
  if ('venue_id' in req.body) {
    const { data: venue } = req.body.venue_id
      ? await supabase.from('venues').select('*').eq('id', req.body.venue_id).eq('owner_user_id', job.hotel_user_id).single()
      : { data: null };
    updates.venue_id = venue?.id || null;
    if (venue) {
      updates.hotel_name = venue.name;
      updates.location = venue.location;
      updates.hotel_logo = venue.logo_url || updates.hotel_logo || '';
      updates.lat = venue.lat ?? null;
      updates.lng = venue.lng ?? null;
    }
  }
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });
  const { data, error } = await supabase.from('jobs').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Hotel owner or admin: delete job
router.delete('/:id', authenticate, async (req, res) => {
  const { data: job } = await supabase.from('jobs').select('hotel_user_id').eq('id', req.params.id).single();
  if (!job) return res.status(404).json({ error: 'Job not found' });
  if (job.hotel_user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
