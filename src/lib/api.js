import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL;

async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

async function request(method, path, body, isFormData = false) {
    const token = await getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isFormData) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });

    if (res.status === 204) return null;
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const patch = (path, body) => request('PATCH', path, body);
const del = (path) => request('DELETE', path);

// Reference
export const api = {
    islands: () => get('/api/islands'),
    categories: () => get('/api/categories'),
    employmentTypes: () => get('/api/employment-types'),

    // Jobs
    getJobs: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        return get(`/api/jobs${params ? `?${params}` : ''}`);
    },
    getJob: (id) => get(`/api/jobs/${id}`),
    getMyJobs: () => get('/api/jobs/mine'),
    createJob: (body) => post('/api/jobs', body),
    updateJob: (id, body) => request('PUT', `/api/jobs/${id}`, body),
    deleteJob: (id) => del(`/api/jobs/${id}`),

    // Applications
    getApplications: () => get('/api/applications'),
    checkApplied: (jobId) => get(`/api/applications/check?job_id=${jobId}`),
    apply: (body) => post('/api/applications', body), // body: { job_id, cover_letter, resume_url? }
    updateApplicationStatus: (id, status) => patch(`/api/applications/${id}/status`, { status }),

    // Profile
    getProfile: () => get('/api/profile'),
    getPublicProfile: (email) => get(`/api/profile/public?email=${encodeURIComponent(email)}`),
    getHotelProfile: (userId) => get(`/api/profile/hotel/${userId}`),
    updateProfile: (body) => patch('/api/profile', body),
    setRole: (role) => patch('/api/profile/role', { role }),
    uploadAvatar: async (file) => {
        const token = await getToken();
        const form = new FormData();
        form.append('avatar', file);
        return request('POST', '/api/profile/avatar', form, true);
    },
    uploadResume: async (file) => {
        const form = new FormData();
        form.append('resume', file);
        return request('POST', '/api/profile/resume', form, true);
    },

    // Conversations & Messages
    getConversations: () => get('/api/conversations'),
    startConversation: (body) => post('/api/conversations', body),
    getMessages: (convId) => get(`/api/conversations/${convId}/messages`),
    sendMessage: (convId, content) => post(`/api/conversations/${convId}/messages`, { content }),
    markRead: (convId) => patch(`/api/conversations/${convId}/read`, {}),

    // Favorites
    getFavorites: () => get('/api/favorites'),
    toggleFavorite: (applicant_email, applicant_name) => post('/api/favorites/toggle', { applicant_email, applicant_name }),

    // Admin
    adminUsers: () => get('/api/admin/users'),
    adminJobs: () => get('/api/admin/jobs'),
    adminApplications: () => get('/api/admin/applications'),
    adminSetRole: (userId, role) => patch(`/api/admin/users/${userId}/role`, { role }),
    adminDeleteJob: (id) => del(`/api/admin/jobs/${id}`),
};
