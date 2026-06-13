import { Router } from 'express';
import supabase from '../lib/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/requireRole.js';
import { sendEmail, newApplicationEmail, applicationDecisionEmail } from '../lib/mailer.js';

const router = Router();

// Get applications: hotel sees own job apps, user sees own submitted apps
router.get('/', authenticate, async (req, res) => {
  let query = supabase.from('applications').select('*').order('created_at', { ascending: false }).limit(50);
  if (req.user.role === 'hotel') {
    query = query.eq('hotel_user_id', req.user.id);
  } else {
    query = query.eq('applicant_email', req.user.email);
  }
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Check if current user already applied to a job
router.get('/check', authenticate, async (req, res) => {
  const { job_id } = req.query;
  if (!job_id) return res.status(400).json({ error: 'job_id required' });
  const { data } = await supabase
    .from('applications')
    .select('id')
    .eq('job_id', job_id)
    .eq('applicant_email', req.user.email)
    .single();
  res.json({ applied: !!data });
});

// Submit application (servers only — hotels cannot apply)
router.post('/', authenticate, requireRole('user'), async (req, res) => {
  const { job_id, cover_letter, resume_url } = req.body;
  const { data: job } = await supabase.from('jobs').select('title, hotel_name, hotel_user_id').eq('id', job_id).single();
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const { data, error } = await supabase.from('applications').insert({
    job_id,
    job_title: job.title,
    hotel_name: job.hotel_name,
    hotel_user_id: job.hotel_user_id,
    applicant_name: req.user.full_name,
    applicant_email: req.user.email,
    cover_letter,
    resume_url: resume_url || null,
    status: 'pending',
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });

  // Notify the hotel owner
  const { data: hotelProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', job.hotel_user_id)
    .single();
  // Fall back to the auth email if the profile row has no email set
  let hotelEmail = hotelProfile?.email;
  if (!hotelEmail) {
    const { data: authUser } = await supabase.auth.admin.getUserById(job.hotel_user_id);
    hotelEmail = authUser?.user?.email;
  }
  if (hotelEmail) {
    const { error: notifError } = await supabase.from('notifications').insert({
      user_email: hotelEmail,
      type: 'new_application',
      job_title: job.title,
      hotel_name: job.hotel_name,
      applicant_name: req.user.full_name,
      job_id,
    });
    if (notifError) console.error('Failed to create new_application notification:', notifError.message);
    sendEmail(newApplicationEmail({ hotelEmail, applicantName: req.user.full_name, jobTitle: job.title }));
  } else {
    console.error('No hotel email found for job', job_id, 'hotel_user_id', job.hotel_user_id);
  }

  res.status(201).json(data);
});

// Hotel: mark all applications for a job as seen
router.post('/mark-seen', authenticate, requireRole('hotel'), async (req, res) => {
  const { job_id } = req.body;
  if (!job_id) return res.status(400).json({ error: 'job_id required' });
  const { error } = await supabase
    .from('applications')
    .update({ hotel_seen: true })
    .eq('job_id', job_id)
    .eq('hotel_user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Hotel only: update application status
router.patch('/:id/status', authenticate, async (req, res) => {
  const { status } = req.body;
  const { data: app } = await supabase
    .from('applications')
    .select('hotel_user_id, applicant_email, job_title, hotel_name, job_id')
    .eq('id', req.params.id)
    .single();
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (app.hotel_user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });

  const { data, error } = await supabase.from('applications').update({ status }).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });

  if (status === 'accepted' || status === 'rejected') {
    await supabase.from('notifications').insert({
      user_email: app.applicant_email,
      type: status,
      job_title: app.job_title,
      hotel_name: app.hotel_name,
      job_id: app.job_id,
    });
    sendEmail(applicationDecisionEmail({
      applicantEmail: app.applicant_email,
      status,
      jobTitle: app.job_title,
      hotelName: app.hotel_name,
    }));
  }

  res.json(data);
});

export default router;
