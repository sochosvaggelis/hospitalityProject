import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Get all notifications for current user
router.get('/', authenticate, async (req, res) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_email', req.user.email)
        .order('created_at', { ascending: false })
        .limit(50);
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// Mark single notification as read
router.patch('/:id/read', authenticate, async (req, res) => {
    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', req.params.id)
        .eq('user_email', req.user.email);
    if (error) return res.status(500).json({ error: error.message });
    res.status(204).end();
});

export default router;
