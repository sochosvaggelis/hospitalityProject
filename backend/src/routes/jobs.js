import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

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
  res.json(data);
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
  const { title, title_el, listing_lang, location, description, requirements, employment_type, salary_amount, salary_period, positions_available, start_date, category, benefits } = req.body;
  const { data, error } = await supabase.from('jobs').insert({
    title, title_el: title_el || null, listing_lang: listing_lang || 'en', location, description, requirements, employment_type,
    salary_amount: salary_amount || null,
    salary_period: salary_period || null,
    positions_available, start_date, category, benefits,
    status: 'active',
    hotel_name: req.user.hotel_name || req.user.full_name,
    hotel_user_id: req.user.id,
    hotel_logo: req.user.hotel_logo_url || req.user.avatar_url || '',
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
  const { title, title_el, listing_lang, location, description, requirements, employment_type, salary_amount, salary_period, positions_available, start_date, category, benefits, status } = req.body;
  const { data, error } = await supabase.from('jobs').update({
    title, title_el: title_el || null, listing_lang: listing_lang || 'en', location, description, requirements, employment_type,
    salary_amount: salary_amount || null,
    salary_period: salary_period || null,
    positions_available, start_date, category, benefits, status,
  }).eq('id', req.params.id).select().single();
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
