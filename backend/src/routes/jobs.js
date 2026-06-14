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

// Public: list active jobs with optional filters
router.get('/', async (req, res) => {
  const { category, employment_type, location, listing_lang } = req.query;
  let query = supabase.from('jobs').select('*').eq('status', 'active').order('created_at', { ascending: false }).limit(50);
  if (category && category !== 'all') query = query.eq('category', category);
  if (employment_type && employment_type !== 'all') query = query.eq('employment_type', employment_type);
  if (location && location !== 'all') query = query.ilike('location', `%${location}%`);
  if (listing_lang && listing_lang !== 'all') {
    if (listing_lang === 'both') query = query.eq('listing_lang', 'both');
    else query = query.in('listing_lang', [listing_lang, 'both']);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  // Hide listings whose start date has already passed. Legacy free-text dates
  // (e.g. "June 2026") aren't parseable and are treated as no-expiry.
  const todayStr = new Date().toISOString().slice(0, 10);
  const visible = (data || []).filter(j => {
    if (!j.start_date) return true;
    const isIsoDate = /^\d{4}-\d{2}-\d{2}$/.test(j.start_date);
    if (!isIsoDate) return true;
    return j.start_date >= todayStr;
  });
  res.json(visible);
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
  const { title, title_el, listing_lang, location, description, description_el, requirements, requirements_el, employment_type, salary_amount, salary_period, positions_available, start_date, category, benefits, benefits_el, photo_url, photo_position, status } = req.body;
  const { data: hotelProfile } = await supabase.from('profiles').select('lat, lng').eq('id', req.user.id).single();
  const { data, error } = await supabase.from('jobs').insert({
    title, title_el: title_el || null, listing_lang: listing_lang || 'en', location, description, requirements, employment_type,
    description_el: description_el || null,
    requirements_el: requirements_el || null,
    benefits_el: benefits_el || null,
    photo_url: photo_url || null,
    photo_position: photo_url ? (photo_position || null) : null,
    salary_amount: salary_amount || null,
    salary_period: salary_period || null,
    positions_available, start_date, category, benefits,
    status: status === 'draft' ? 'draft' : 'active',
    hotel_name: req.user.hotel_name || req.user.full_name,
    hotel_user_id: req.user.id,
    hotel_logo: req.user.hotel_logo_url || req.user.avatar_url || '',
    lat: hotelProfile?.lat || null, lng: hotelProfile?.lng || null,
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
    'employment_type', 'salary_amount', 'salary_period',
    'positions_available', 'start_date', 'category', 'status', 'photo_url', 'photo_position',
  ];
  const NULLABLE_FIELDS = ['title_el', 'description_el', 'requirements_el', 'benefits_el', 'salary_amount', 'salary_period', 'photo_url', 'photo_position'];
  const updates = {};
  for (const key of ALLOWED_FIELDS) {
    if (key in req.body) updates[key] = NULLABLE_FIELDS.includes(key) ? (req.body[key] || null) : req.body[key];
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
