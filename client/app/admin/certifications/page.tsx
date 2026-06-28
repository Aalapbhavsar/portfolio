'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface Certification {
  _id?: string;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string | null;
  credentialId: string;
  credentialUrl: string;
  emoji: string;
  order?: number;
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [form, setForm] = useState<Certification>({
    title: '',
    issuer: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: null,
    credentialId: '',
    credentialUrl: '',
    emoji: '🏆',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    setToken(t);
    if (t) fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/certifications`);
      if (res.ok) {
        setCertifications(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch certifications:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.issuer || !token) return;

    setStatus('loading');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/api/certifications/${editingId}` : `${API_BASE}/api/certifications`;

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
        setMessage(editingId ? 'Certification updated!' : 'Certification added!');
        setForm({
          title: '',
          issuer: '',
          issueDate: new Date().toISOString().split('T')[0],
          expiryDate: null,
          credentialId: '',
          credentialUrl: '',
          emoji: '🏆',
        });
        setEditingId(null);
        fetchCertifications();
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        throw new Error('Failed to save certification');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error saving certification');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this certification?') || !token) return;

    try {
      await fetch(`${API_BASE}/api/certifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchCertifications();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEdit = (cert: Certification) => {
    setForm(cert);
    setEditingId(cert._id || null);
  };

  const emojis = ['🏆', '🎓', '📜', '⭐', '✅', '🚀', '💎', '🔧', '📱', '🌟'];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Certifications Management</h1>
        <p className="admin-page-desc">Manage your professional certifications</p>
      </div>

      {status !== 'idle' && (
        <div className={`admin-message admin-message-${status}`}>
          {message}
        </div>
      )}

      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Certification' : 'Add New Certification'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Certificate Title</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="E.g., AWS Solutions Architect"
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Issuing Organization</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.issuer}
                onChange={(e) => setForm({ ...form, issuer: e.target.value })}
                placeholder="E.g., Amazon Web Services"
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Issue Date</label>
              <input
                type="date"
                className="admin-form-input"
                value={form.issueDate}
                onChange={(e) => setForm({ ...form, issueDate: e.target.value })}
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Expiry Date (Optional)</label>
              <input
                type="date"
                className="admin-form-input"
                value={form.expiryDate || ''}
                onChange={(e) => setForm({ ...form, expiryDate: e.target.value || null })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Credential ID</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.credentialId}
                onChange={(e) => setForm({ ...form, credentialId: e.target.value })}
                placeholder="Optional credential ID"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Credential URL</label>
              <input
                type="url"
                className="admin-form-input"
                value={form.credentialUrl}
                onChange={(e) => setForm({ ...form, credentialUrl: e.target.value })}
                placeholder="Link to certificate"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Emoji Icon</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, emoji })}
                  style={{
                    fontSize: '1.5rem',
                    padding: '0.5rem',
                    border: form.emoji === emoji ? '2px solid var(--primary)' : '1px solid var(--border-medium)',
                    background: form.emoji === emoji ? 'var(--primary)20' : 'transparent',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Saving...' : editingId ? 'Update Certification' : 'Add Certification'}
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm({
                    title: '',
                    issuer: '',
                    issueDate: new Date().toISOString().split('T')[0],
                    expiryDate: null,
                    credentialId: '',
                    credentialUrl: '',
                    emoji: '🏆',
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
        <h3 style={{ marginTop: 0 }}>Certifications List</h3>
        {certifications.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No certifications added yet. Add one to get started!</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Issuer</th>
                <th>Issue Date</th>
                <th>Expiry Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certifications.map((cert) => (
                <tr key={cert._id}>
                  <td>
                    <div>
                      <span style={{ marginRight: '0.5rem' }}>{cert.emoji}</span>
                      {cert.title}
                    </div>
                  </td>
                  <td>{cert.issuer}</td>
                  <td>{formatDate(cert.issueDate)}</td>
                  <td>{cert.expiryDate ? formatDate(cert.expiryDate) : '-'}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => handleEdit(cert)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => cert._id && handleDelete(cert._id)}
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
