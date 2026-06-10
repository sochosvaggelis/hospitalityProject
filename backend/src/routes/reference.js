import { Router } from 'express';
import supabase from '../lib/supabase.js';

const router = Router();

router.get('/islands', async (req, res) => {
  const { data, error } = await supabase.from('islands').select('*').order('display_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/categories', async (req, res) => {
  const { data, error } = await supabase.from('categories').select('key, label_en, label_el').order('display_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.get('/employment-types', async (req, res) => {
  const { data, error } = await supabase.from('employment_types').select('key, label_en, label_el').order('display_order');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
