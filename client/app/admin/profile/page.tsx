'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
interface Profile {
  _id?: string;
  name: string;
  headline: string;
  bio: string;
  email: string;
  phone: string;
  location: string;
  profileImage: string;
  resumeUrl: string;
  yearsOfExperience: number;
  projectsCompleted: number;
  clientsServed: number;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState<Profile>({
    name: 'Aalap Bhavsar',
    headline: 'Full Stack Developer | React | Next.js | Node.js',
    bio: '',
    email: 'hello@aalap.dev',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    profileImage: '',
    resumeUrl: '',
    yearsOfExperience: 5,
    projectsCompleted: 50,
    clientsServed: 30,
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    setToken(t);
    if (t) fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/profile`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setForm(data);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleResumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  const uploadToCloudinary = async (file: File, folder: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'portfolio_unsigned');
    formData.append('folder', folder);

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/YOUR_CLOUD_NAME/auto/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.secure_url;
    } catch (err) {
      console.error('Upload failed:', err);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setStatus('loading');
    setMessage('');

    try {
      // Upload image if selected
      if (imageFile) {
        const imageUrl = await uploadToCloudinary(imageFile, 'portfolio/profile');
        if (imageUrl) {
          form.profileImage = imageUrl;
        }
      }

      // Upload resume if selected
      if (resumeFile) {
        const resumeUrl = await uploadToCloudinary(resumeFile, 'portfolio/resume');
        if (resumeUrl) {
          form.resumeUrl = resumeUrl;
        }
      }

      // Update profile
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('Profile updated successfully!');
        setImageFile(null);
        setResumeFile(null);
        fetchProfile();
        setTimeout(() => setStatus('idle'), 2000);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Error updating profile');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Profile Management</h1>
        <p className="admin-page-desc">Update your profile information</p>
      </div>

      {status !== 'idle' && (
        <div className={`admin-message admin-message-${status}`}>
          {message}
        </div>
      )}

      <div className="admin-card">
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label className="admin-form-label">Profile Image</label>
            {form.profileImage && (
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={form.profileImage}
                  alt="Profile"
                  style={{ width: '100px', height: '100px', borderRadius: '8px', objectFit: 'cover' }}
                />
              </div>
            )}
            <input
              type="file"
              className="admin-form-input"
              accept="image/*"
              onChange={handleImageChange}
            />
            <small style={{ color: 'var(--text-muted)' }}>
              {imageFile ? `Selected: ${imageFile.name}` : 'No file selected'}
            </small>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Full Name</label>
            <input
              type="text"
              className="admin-form-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Headline</label>
            <input
              type="text"
              className="admin-form-input"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
              placeholder="E.g., Full Stack Developer | React | Next.js"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Bio</label>
            <textarea
              className="admin-form-textarea"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Email</label>
              <input
                type="email"
                className="admin-form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Phone</label>
              <input
                type="tel"
                className="admin-form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Location</label>
            <input
              type="text"
              className="admin-form-input"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="admin-form-group">
              <label className="admin-form-label">Years of Experience</label>
              <input
                type="number"
                className="admin-form-input"
                value={form.yearsOfExperience}
                onChange={(e) => setForm({ ...form, yearsOfExperience: parseInt(e.target.value) })}
                min="0"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Projects Completed</label>
              <input
                type="number"
                className="admin-form-input"
                value={form.projectsCompleted}
                onChange={(e) => setForm({ ...form, projectsCompleted: parseInt(e.target.value) })}
                min="0"
              />
            </div>

            <div className="admin-form-group">
              <label className="admin-form-label">Clients Served</label>
              <input
                type="number"
                className="admin-form-input"
                value={form.clientsServed}
                onChange={(e) => setForm({ ...form, clientsServed: parseInt(e.target.value) })}
                min="0"
              />
            </div>
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Resume/CV</label>
            {form.resumeUrl && (
              <div style={{ marginBottom: '1rem' }}>
                <a href={form.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                  📄 View current resume
                </a>
              </div>
            )}
            <input
              type="file"
              className="admin-form-input"
              accept=".pdf,.doc,.docx"
              onChange={handleResumeChange}
            />
            <small style={{ color: 'var(--text-muted)' }}>
              {resumeFile ? `Selected: ${resumeFile.name}` : 'No file selected'}
            </small>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" disabled={status === 'loading'}>
            {status === 'loading' ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
