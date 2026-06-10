import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';

const router = Router();
router.use(authenticate, requireRole('admin'));

router.get('/users', async (req, res) => {
  const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/jobs', async (req, res) => {
  const { data, error } = await supabase.from('jobs').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/applications', async (req, res) => {
  const { data, error } = await supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.patch('/users/:id/role', async (req, res) => {
  const { role } = req.body;
  const { error } = await supabase.rpc('update_user_role', { target_user_id: req.params.id, new_role: role });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

router.delete('/jobs/:id', async (req, res) => {
  const { error } = await supabase.from('jobs').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).end();
});

export default router;
