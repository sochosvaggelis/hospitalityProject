import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all conversations for current user
router.get('/', authenticate, async (req, res) => {
  const email = req.user.email;
  const [{ data: asP1 }, { data: asP2 }] = await Promise.all([
    supabase.from('conversations').select('*').eq('participant_1', email).order('updated_at', { ascending: false }).limit(50),
    supabase.from('conversations').select('*').eq('participant_2', email).order('updated_at', { ascending: false }).limit(50),
  ]);
  const all = [...(asP1 || []), ...(asP2 || [])];
  all.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  res.json(all);
});

// Find or create a conversation (hotel initiates with applicant)
router.post('/', authenticate, async (req, res) => {
  const { other_email, other_name, job_id, job_title } = req.body;
  if (!other_email) return res.status(400).json({ error: 'other_email required' });

  const myEmail = req.user.email;
  const myName = req.user.full_name;

  // Check if conversation already exists between these two for this job
  const { data: existing } = await supabase.from('conversations')
    .select('*')
    .eq('job_id', job_id)
    .or(`and(participant_1.eq.${myEmail},participant_2.eq.${other_email}),and(participant_1.eq.${other_email},participant_2.eq.${myEmail})`)
    .maybeSingle();

  if (existing) return res.json(existing);

  const { data, error } = await supabase.from('conversations').insert({
    participant_1: myEmail,
    participant_2: other_email,
    participant_1_name: myName,
    participant_2_name: other_name,
    job_id: job_id || null,
    job_title: job_title || null,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// Get messages in a conversation
router.get('/:id/messages', authenticate, async (req, res) => {
  const { data: conv } = await supabase.from('conversations').select('participant_1, participant_2').eq('id', req.params.id).single();
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.participant_1 !== req.user.email && conv.participant_2 !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { data, error } = await supabase.from('messages').select('*').eq('conversation_id', req.params.id).order('created_at', { ascending: true }).limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Send a message
router.post('/:id/messages', authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: 'Content required' });

  const { data: conv } = await supabase.from('conversations').select('*').eq('id', req.params.id).single();
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.participant_1 !== req.user.email && conv.participant_2 !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const otherEmail = conv.participant_1 === req.user.email ? conv.participant_2 : conv.participant_1;
  const { data: message, error } = await supabase.from('messages').insert({
    conversation_id: req.params.id,
    sender_email: req.user.email,
    sender_name: req.user.full_name,
    content: content.trim(),
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  await supabase.from('conversations').update({
    last_message: content.trim().substring(0, 100),
    last_message_date: new Date().toISOString(),
    unread_by: otherEmail,
    updated_at: new Date().toISOString(),
  }).eq('id', req.params.id);

  res.status(201).json(message);
});

// Mark conversation as read
router.patch('/:id/read', authenticate, async (req, res) => {
  const { data: conv } = await supabase.from('conversations').select('participant_1, participant_2, unread_by').eq('id', req.params.id).single();
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.participant_1 !== req.user.email && conv.participant_2 !== req.user.email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (conv.unread_by !== req.user.email) return res.json({ ok: true });

  const { error } = await supabase.from('conversations').update({ unread_by: '' }).eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Toggle a per-user flag stored as an array of emails (archived_by / muted_by)
async function toggleMembership(req, res, column) {
  const email = req.user.email;
  const { data: conv } = await supabase
    .from('conversations')
    .select(`participant_1, participant_2, ${column}`)
    .eq('id', req.params.id)
    .single();
  if (!conv) return res.status(404).json({ error: 'Conversation not found' });
  if (conv.participant_1 !== email && conv.participant_2 !== email) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const current = conv[column] || [];
  const next = current.includes(email) ? current.filter(e => e !== email) : [...current, email];
  const { data, error } = await supabase
    .from('conversations')
    .update({ [column]: next })
    .eq('id', req.params.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
}

// Archive / unarchive for the current user (archived = hidden from their list)
router.patch('/:id/archive', authenticate, (req, res) => toggleMembership(req, res, 'archived_by'));

// Mute / unmute for the current user
router.patch('/:id/mute', authenticate, (req, res) => toggleMembership(req, res, 'muted_by'));

export default router;
