import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('hotel_user_id', req.user.id)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Toggle: add if not exists, remove if exists
router.post('/toggle', authenticate, async (req, res) => {
  const { applicant_email, applicant_name } = req.body;
  if (!applicant_email) return res.status(400).json({ error: 'applicant_email required' });

  const { data: existing } = await supabase
    .from('favorites')
    .select('id')
    .eq('hotel_user_id', req.user.id)
    .eq('applicant_email', applicant_email)
    .maybeSingle();

  if (existing) {
    await supabase.from('favorites').delete().eq('id', existing.id);
    return res.json({ favorited: false });
  }

  await supabase.from('favorites').insert({
    hotel_user_id: req.user.id,
    applicant_email,
    applicant_name,
  });
  res.json({ favorited: true });
});

export default router;
