'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface ContentItem {
  _id?: string;
  key: string;
  section: 'Hero' | 'About' | 'Services' | 'Contact' | 'Footer' | 'General';
  value: string;
  description: string;
}

const SECTIONS = ['Hero', 'About', 'Services', 'Contact', 'Footer', 'General'] as const;

export default function ContentPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [form, setForm] = useState<ContentItem>({
    key: '',
    section: 'General',
    value: '',
    description: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<typeof SECTIONS[number] | 'All'>('All');

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    setToken(t);
    if (t) fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/content`);
      if (res.ok) {
        setContent(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch content:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.key || !form.value || !token) return;

    setStatus('loading');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/api/content/${editingId}` : `${API_BASE}/api/content`;

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
        setMessage(editingId ? 'Content updated!' : 'Content added!');
        setForm({ key: '', section: 'General', value: '', description: '' });
        setEditingId(null);
        fetchContent();
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        throw new Error('Failed to save content');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error saving content');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content?') || !token) return;

    try {
      await fetch(`${API_BASE}/api/content/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchContent();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEdit = (item: ContentItem) => {
    setForm(item);
    setEditingId(item._id || null);
  };

  const filteredContent = selectedSection === 'All' ? content : content.filter(c => c.section === selectedSection);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Content Management</h1>
        <p className="admin-page-desc">Manage website text content and copy</p>
      </div>

      {status !== 'idle' && (
        <div className={`admin-message admin-message-${status}`}>
          {message}
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Content' : 'Add New Content'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label className="admin-form-label">Content Key *</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.key}
                onChange={(e) => setForm({ ...form, key: e.target.value })}
                placeholder="E.g., hero_title, about_description"
                disabled={!!editingId}
                required
              />
              <small style={{ color: 'var(--text-muted)' }}>Unique identifier (cannot be changed)</small>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Section *</label>
              <select
                className="admin-form-select"
                value={form.section}
                onChange={(e) => setForm({ ...form, section: e.target.value as any })}
                disabled={!!editingId}
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Description</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What is this content for?"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Content Value *</label>
              <textarea
                className="admin-form-textarea"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                placeholder="Enter the content text..."
                rows={6}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Saving...' : editingId ? 'Update Content' : 'Add Content'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ key: '', section: 'General', value: '', description: '' });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Filter by Section</h3>
          <select
            className="admin-form-select"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value as any)}
          >
            <option>All</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Total: {filteredContent.length} content items
          </p>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Content List</h3>
        {filteredContent.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No content found. Add one to get started!</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th>Section</th>
                  <th>Description</th>
                  <th>Content Preview</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContent.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <code style={{ background: 'var(--bg-surface-hover)', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.85rem' }}>
                        {item.key}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          background: 'var(--primary)',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        {item.section}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{item.description || '-'}</td>
                    <td style={{ fontSize: '0.9rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.value}
                    </td>
                    <td>
                      <div className="admin-table-actions">
                        <button
                          className="admin-btn admin-btn-secondary"
                          onClick={() => handleEdit(item)}
                        >
                          Edit
                        </button>
                        <button
                          className="admin-btn admin-btn-danger"
                          onClick={() => item._id && handleDelete(item._id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
