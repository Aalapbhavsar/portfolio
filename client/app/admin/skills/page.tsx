'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface Skill {
  _id?: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'Tools' | 'Other';
  name: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  order?: number;
}

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [form, setForm] = useState<Skill>({
    category: 'Frontend',
    name: '',
    proficiency: 'Intermediate',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'Frontend' | 'Backend' | 'Database' | 'Tools' | 'Other' | 'All'>('All');

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    setToken(t);
    if (t) fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/skills`);
      if (res.ok) {
        setSkills(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch skills:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !token) return;

    setStatus('loading');

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `${API_BASE}/api/skills/${editingId}` : `${API_BASE}/api/skills`;

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
        setMessage(editingId ? 'Skill updated!' : 'Skill added!');
        setForm({ category: 'Frontend', name: '', proficiency: 'Intermediate' });
        setEditingId(null);
        fetchSkills();
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        throw new Error('Failed to save skill');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error saving skill');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this skill?') || !token) return;

    try {
      await fetch(`${API_BASE}/api/skills/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchSkills();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleEdit = (skill: Skill) => {
    setForm(skill);
    setEditingId(skill._id || null);
  };

  const filteredSkills = selectedCategory === 'All' ? skills : skills.filter(s => s.category === selectedCategory);

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Skills Management</h1>
        <p className="admin-page-desc">Add and manage your skills</p>
      </div>

      {status !== 'idle' && (
        <div className={`admin-message admin-message-${status}`}>
          {message}
        </div>
      )}

      <div className="admin-grid">
        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Skill' : 'Add New Skill'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label className="admin-form-label">Category</label>
              <select
                className="admin-form-select"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as any })}
              >
                <option>Frontend</option>
                <option>Backend</option>
                <option>Database</option>
                <option>Tools</option>
                <option>Other</option>
              </select>
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Skill Name</label>
              <input
                type="text"
                className="admin-form-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="E.g., React, Node.js, MongoDB"
                required
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Proficiency Level</label>
              <select
                className="admin-form-select"
                value={form.proficiency}
                onChange={(e) => setForm({ ...form, proficiency: e.target.value as any })}
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
                <option>Expert</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Saving...' : editingId ? 'Update Skill' : 'Add Skill'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="admin-btn admin-btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setForm({ category: 'Frontend', name: '', proficiency: 'Intermediate' });
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="admin-card">
          <h3 style={{ marginTop: 0 }}>Filter</h3>
          <select
            className="admin-form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
          >
            <option>All</option>
            <option>Frontend</option>
            <option>Backend</option>
            <option>Database</option>
            <option>Tools</option>
            <option>Other</option>
          </select>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Total: {filteredSkills.length} skills
          </p>
        </div>
      </div>

      <div className="admin-card">
        <h3 style={{ marginTop: 0 }}>Skills List</h3>
        {filteredSkills.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No skills found. Add one to get started!</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Proficiency</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSkills.map((skill) => (
                <tr key={skill._id}>
                  <td>{skill.name}</td>
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
                      {skill.category}
                    </span>
                  </td>
                  <td>{skill.proficiency}</td>
                  <td>
                    <div className="admin-table-actions">
                      <button
                        className="admin-btn admin-btn-secondary"
                        onClick={() => handleEdit(skill)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-btn admin-btn-danger"
                        onClick={() => skill._id && handleDelete(skill._id)}
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
