import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();

// Hotel: all private notes keyed by applicant email
router.get('/', authenticate, requireRole('hotel'), async (req, res) => {
  const { data, error } = await supabase
    .from('applicant_notes')
    .select('applicant_email, note')
    .eq('hotel_user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  const map = Object.fromEntries((data || []).map(r => [r.applicant_email, r.note]));
  res.json(map);
});

// Hotel: upsert a note for one applicant
router.put('/', authenticate, requireRole('hotel'), async (req, res) => {
  const { applicant_email, note } = req.body;
  if (!applicant_email) return res.status(400).json({ error: 'applicant_email required' });
  const { error } = await supabase.from('applicant_notes').upsert({
    hotel_user_id: req.user.id,
    applicant_email,
    note: note || '',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'hotel_user_id,applicant_email' });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

export default router;
