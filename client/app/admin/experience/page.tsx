'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface Experience {
  _id?: string;
  title: string;
  company: string;
  description: string;
  startDate: string;
  endDate: string | null;
  isCurrentRole: boolean;
  order?: number;
}

export default function ExperiencePage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [form, setForm] = useState<Experience>({
    title: '',
    company: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: null,
    isCurrentRole: false,
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    setToken(t);
    if (t) fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experience`);
      if (res.ok) {
        setExperiences(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch experiences:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company || !token) return;

    setStatus('loading');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/api/experience/${editingId}` : `${API_BASE}/api/experience`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus('success');
        setMessage(editingId ? 'Experience updated!' : 'Experience added!');
        setForm({
          title: '',
          company: '',
          description: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: null,
          isCurrentRole: false,
        });
        setEditingId(null);
        fetchExperiences();
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        throw new Error('Failed to save experience');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error saving experience');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this experience?') || !token) return;

    try {
      await fetch(`${API_BASE}/api/experience/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchExperiences();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEdit = (exp: Experience) => {
    setForm(exp);
    setEditingId(exp._id || null);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Experience Management</h1>
        <p className="admin-page-desc">Add and manage your work experience</p>
      </div>

      {status !== 'idle' && (
        <div className={`admin-message admin-message-${status}`}>
          {message}
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Experience' : 'Add New Experience'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Job Title</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="E.g., Senior React Developer"
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Company</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="E.g., Tech Corp Inc."
                required
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Description</label>
            <textarea
              className="admin-form-textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe your responsibilities and achievements..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Start Date</label>
              <input
                type="date"
                className="admin-form-input"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">End Date</label>
              <input
                type="date"
                className="admin-form-input"
                value={form.endDate || ''}
                onChange={(e) => setForm({ ...form, endDate: e.target.value || null })}
                disabled={form.isCurrentRole}
              />
            </div>

            <div className="admin-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginBottom: 0 }}>
                <input
                  type="checkbox"
                  checked={form.isCurrentRole}
                  onChange={(e) => setForm({ ...form, isCurrentRole: e.target.checked, endDate: e.target.checked ? null : form.endDate })}
                  style={{ cursor: 'pointer' }}
                />
                Current Role
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Saving...' : editingId ? 'Update Experience' : 'Add Experience'}
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    title: '',
                    company: '',
                    description: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: null,
                    isCurrentRole: false,
                  });
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Experience List</h3>
        {experiences.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No experience added yet. Add one to get started!</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Position</th>
                <th>Company</th>
                <th>Period</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {experiences.map((exp) => (
                <tr key={exp._id}>
                  <td>
                    <div>
                      <div style={{ fontWeight: 600 }}>{exp.title}</div>
                      {exp.description && <small style={{ color: 'var(--text-muted)' }}>{exp.description.substring(0, 50)}...</small>}
                    </div>
                  </td>
                  <td>{exp.company}</td>
                  <td>
                    {formatDate(exp.startDate)} - {exp.isCurrentRole ? 'Present' : formatDate(exp.endDate)}
                  </td>
                  <td>
                    {exp.isCurrentRole && (
                      <span style={{ background: '#22c55e20', color: '#22c55e', padding: '0.25rem 0.75rem', borderRadius: '0.375rem', fontSize: '0.85rem' }}>
                        Current
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => handleEdit(exp)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => exp._id && handleDelete(exp._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
