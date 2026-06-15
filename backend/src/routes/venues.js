import { Router } from 'express';
import multer from 'multer';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Hotel: upload a venue image/logo, returns the public URL (stored on the venue
// via create/update, mirroring the job-photo flow).
router.post('/logo', authenticate, requireRole('hotel'), upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  if (!req.file.mimetype.startsWith('image/')) return res.status(400).json({ error: 'Only image files are allowed' });
  const ext = req.file.originalname.split('.').pop();
  const path = `venue-logos/${req.user.id}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('hospitalityBucket')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });
  const { data: { publicUrl } } = supabase.storage.from('hospitalityBucket').getPublicUrl(path);
  res.json({ url: publicUrl });
});

// Public: venues for a hotel account (used by hotel profile pages later)
router.get('/by-owner/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('venues').select('*')
    .eq('owner_user_id', req.params.userId)
    .order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Public: a single venue's profile + its active job listings (as a job seeker
// would see it). Keyed by the venue id, so each venue gets its own page.
router.get('/:id/profile', async (req, res) => {
  const { data: venue } = await supabase.from('venues').select('*').eq('id', req.params.id).single();
  if (!venue) return res.status(404).json({ error: 'Venue not found' });
  const { data: jobs } = await supabase
    .from('jobs').select('*')
    .eq('venue_id', req.params.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  res.json({ ...venue, jobs: jobs || [] });
});

// Hotel: own venues
router.get('/mine', authenticate, requireRole('hotel'), async (req, res) => {
  const { data, error } = await supabase
    .from('venues').select('*')
    .eq('owner_user_id', req.user.id)
    .order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// Hotel: create a venue
router.post('/', authenticate, requireRole('hotel'), async (req, res) => {
  const { name, location, type, lat, lng, logo_url, stars, website, description, phone, email, photos } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'name and location are required' });
  const { data, error } = await supabase.from('venues').insert({
    owner_user_id: req.user.id,
    name, location, type: type || null,
    lat: lat ?? null, lng: lng ?? null,
    logo_url: logo_url || null,
    stars: stars ?? null, website: website || null, description: description || null, phone: phone || null, email: email || null,
    photos: Array.isArray(photos) ? photos.slice(0, 3) : [],
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Owner/admin: update a venue
router.put('/:id', authenticate, async (req, res) => {
  const { data: venue } = await supabase.from('venues').select('owner_user_id').eq('id', req.params.id).single();
  if (!venue) return res.status(404).json({ error: 'Venue not found' });
  if (venue.owner_user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const ALLOWED_FIELDS = ['name', 'location', 'type', 'lat', 'lng', 'logo_url', 'stars', 'website', 'description', 'phone', 'email', 'photos'];
  const updates = {};
  for (const key of ALLOWED_FIELDS) if (key in req.body) updates[key] = req.body[key];
  if ('photos' in updates) updates.photos = Array.isArray(updates.photos) ? updates.photos.slice(0, 3) : [];
  if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'No fields to update' });

  const { data, error } = await supabase.from('venues').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Owner/admin: delete a venue along with its job listings (applications cascade
// on job delete). A venue is an independent business, so removing it removes its
// listings too.
router.delete('/:id', authenticate, async (req, res) => {
  const { data: venue } = await supabase.from('venues').select('owner_user_id').eq('id', req.params.id).single();
  if (!venue) return res.status(404).json({ error: 'Venue not found' });
  if (venue.owner_user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { error: jobsError } = await supabase.from('jobs').delete().eq('venue_id', req.params.id);
  if (jobsError) return res.status(500).json({ error: jobsError.message });

  const { error } = await supabase.from('venues').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
