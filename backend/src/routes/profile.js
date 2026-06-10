import { Router } from 'express';
import multer from 'multer';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public hotel profile by hotel_user_id (no auth required)
router.get('/hotel/:userId', async (req, res) => {
  const { userId } = req.params;
  const [{ data: profile }, { data: jobs }] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, hotel_name, hotel_description, hotel_website, hotel_logo_url, hotel_stars, location, avatar_url')
      .eq('id', userId)
      .eq('role', 'hotel')
      .single(),
    supabase
      .from('jobs')
      .select('id, title, location, employment_type, salary_range, positions_available, start_date, category, created_at')
      .eq('hotel_user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
  ]);
  if (!profile) return res.status(404).json({ error: 'Hotel not found' });
  res.json({ ...profile, jobs: jobs || [] });
});

// Public profile by email (for hotels viewing applicants)
router.get('/public', authenticate, async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: 'email required' });
  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, bio, location, experience_years, skills, languages_spoken, role')
    .eq('email', email)
    .single();
  if (error || !data) return res.status(404).json({ error: 'Profile not found' });
  res.json({ ...data, email });
});

router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', req.user.id).single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ...data, email: req.user.email });
});

router.patch('/', authenticate, async (req, res) => {
  const allowed = ['phone', 'bio', 'location', 'experience_years', 'skills', 'languages_spoken', 'hotel_name', 'hotel_description', 'hotel_website', 'hotel_stars', 'full_name'];
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Set initial role after registration
router.patch('/role', authenticate, async (req, res) => {
  const { role } = req.body;
  if (!['user', 'hotel'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  const { data, error } = await supabase.from('profiles').update({ role, role_chosen: true }).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Upload resume (PDF only, servers)
router.post('/resume', authenticate, upload.single('resume'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Only PDF files are allowed' });
  const path = `resumes/${req.user.id}.pdf`;
  const { error: uploadError } = await supabase.storage
    .from('hospitalityBucket')
    .upload(path, req.file.buffer, { contentType: 'application/pdf', upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });
  const { data: { publicUrl } } = supabase.storage.from('hospitalityBucket').getPublicUrl(path);
  const { data, error } = await supabase.from('profiles').update({ resume_url: publicUrl }).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Upload avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  const ext = req.file.originalname.split('.').pop();
  const path = `avatars/${req.user.id}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('hospitalityBucket')
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true });
  if (uploadError) return res.status(500).json({ error: uploadError.message });

  const { data: { publicUrl } } = supabase.storage.from('hospitalityBucket').getPublicUrl(path);
  const { data, error } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', req.user.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
