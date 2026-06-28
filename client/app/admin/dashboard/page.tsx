'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styles from './dashboard.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

// ──────────────────────────────────
// Types
// ──────────────────────────────────
interface Project {
  _id: string; title: string; description: string; category: string;
  image: string; techStack: string[]; githubLink: string; liveLink: string;
  views: number; featured: boolean;
}

interface Message {
  _id: string; name: string; email: string; subject: string;
  message: string; read: boolean; createdAt: string;
}

interface Analytics {
  totals: {
    visitors: number; downloads: number; projectViews: number;
    messages: number; unreadMessages: number; projects: number;
  };
  chartData: { date: string; visitors: number; downloads: number; projectViews: number }[];
  topProjects: { _id: string; title: string; views: number; category: string }[];
}

interface Settings {
  resumeUrl: string;
  socialLinks: { linkedin: string; github: string; instagram: string; email: string };
  aiPrompt: string;
}

type Tab = 'analytics' | 'projects' | 'messages' | 'settings';

const PROJECT_INITIAL = {
  title: '', description: '', category: 'Frontend Projects',
  techStack: '', githubLink: '', liveLink: '', featured: false,
};

// ──────────────────────────────────
// Main Dashboard Component
// ──────────────────────────────────
export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('analytics');
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  // Data state
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Project form state
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState(PROJECT_INITIAL);
  const [projectImage, setProjectImage] = useState<File | null>(null);
  const [projectStatus, setProjectStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Settings state
  const [settingsForm, setSettingsForm] = useState({ linkedin: '', github: '', instagram: '', email: '', aiPrompt: '' });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [settingsStatus, setSettingsStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  // Auth guard
  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    const u = localStorage.getItem('adminUser');
    if (!t) { router.push('/admin/login'); return; }
    setToken(t);
    if (u) setUser(JSON.parse(u));
  }, [router]);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  // Fetch data when token is ready
  useEffect(() => {
    if (!token) return;
    fetchAnalytics();
    fetchProjects();
    fetchMessages();
    fetchSettings();
  }, [token]);

  const fetchAnalytics = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/analytics/report`, { headers: authHeaders() });
      if (r.ok) setAnalytics(await r.json());
    } catch {}
  };

  const fetchProjects = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/projects`);
      if (r.ok) setProjects(await r.json());
    } catch {}
  };

  const fetchMessages = async () => {
    if (!token) return;
    try {
      const r = await fetch(`${API_BASE}/api/contact`, { headers: authHeaders() });
      if (r.ok) setMessages(await r.json());
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/settings`);
      if (r.ok) {
        const s: Settings = await r.json();
        setSettings(s);
        setSettingsForm({
          linkedin: s.socialLinks.linkedin || '',
          github: s.socialLinks.github || '',
          instagram: s.socialLinks.instagram || '',
          email: s.socialLinks.email || '',
          aiPrompt: s.aiPrompt || '',
        });
      }
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  // ── PROJECT CRUD ──
  const openCreateProject = () => {
    setEditingProject(null);
    setProjectForm(PROJECT_INITIAL);
    setProjectImage(null);
    setShowProjectForm(true);
  };

  const openEditProject = (p: Project) => {
    setEditingProject(p);
    setProjectForm({
      title: p.title, description: p.description, category: p.category,
      techStack: p.techStack.join(', '), githubLink: p.githubLink,
      liveLink: p.liveLink, featured: p.featured,
    });
    setProjectImage(null);
    setShowProjectForm(true);
  };

  const submitProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProjectStatus('loading');

    const fd = new FormData();
    fd.append('title', projectForm.title);
    fd.append('description', projectForm.description);
    fd.append('category', projectForm.category);
    fd.append('techStack', projectForm.techStack);
    fd.append('githubLink', projectForm.githubLink);
    fd.append('liveLink', projectForm.liveLink);
    fd.append('featured', String(projectForm.featured));
    if (projectImage) fd.append('image', projectImage);

    try {
      const url = editingProject
        ? `${API_BASE}/api/projects/${editingProject._id}`
        : `${API_BASE}/api/projects`;
      const method = editingProject ? 'PUT' : 'POST';
      const r = await fetch(url, { method, headers: authHeaders(), body: fd });
      if (!r.ok) throw new Error();
      setProjectStatus('success');
      setTimeout(() => { setProjectStatus('idle'); setShowProjectForm(false); }, 1200);
      fetchProjects();
    } catch {
      setProjectStatus('error');
      setTimeout(() => setProjectStatus('idle'), 2000);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Delete this project?')) return;
    try {
      await fetch(`${API_BASE}/api/projects/${id}`, { method: 'DELETE', headers: authHeaders() });
      fetchProjects();
    } catch {}
  };

  // ── MESSAGES ──
  const toggleRead = async (id: string) => {
    try {
      await fetch(`${API_BASE}/api/contact/${id}/read`, { method: 'PUT', headers: authHeaders() });
      fetchMessages();
    } catch {}
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await fetch(`${API_BASE}/api/contact/${id}`, { method: 'DELETE', headers: authHeaders() });
      fetchMessages();
    } catch {}
  };

  // ── SETTINGS ──
  const submitSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSettingsStatus('loading');

    const fd = new FormData();
    fd.append('linkedin', settingsForm.linkedin);
    fd.append('github', settingsForm.github);
    fd.append('instagram', settingsForm.instagram);
    fd.append('email', settingsForm.email);
    fd.append('aiPrompt', settingsForm.aiPrompt);
    if (resumeFile) fd.append('resume', resumeFile);

    try {
      const r = await fetch(`${API_BASE}/api/settings`, { method: 'PUT', headers: authHeaders(), body: fd });
      if (!r.ok) throw new Error();
      setSettingsStatus('success');
      setTimeout(() => setSettingsStatus('idle'), 2000);
    } catch {
      setSettingsStatus('error');
      setTimeout(() => setSettingsStatus('idle'), 2000);
    }
  };

  if (!token) return null;

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'analytics', label: 'Analytics', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
    { id: 'projects', label: 'Projects', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { id: 'messages', label: 'Messages', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
    { id: 'settings', label: 'Settings', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.42 1.42M4.93 4.93l1.42 1.42M12 2v2M12 20v2M20 12h2M2 12h2M16.95 16.95l1.42 1.42M5.63 16.95l-1.42 1.42"/></svg> },
  ];

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <span className="gradient-text" style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.4rem' }}>Aalap.</span>
          <span className={styles.sidebarBadge}>Admin</span>
        </div>

        <nav className={styles.sidebarNav}>
          {TABS.map(t => (
            <button
              key={t.id}
              className={`${styles.navItem} ${tab === t.id ? styles.navItemActive : ''}`}
              onClick={() => setTab(t.id)}
              id={`admin-tab-${t.id}`}
            >
              {t.icon}
              {t.label}
              {t.id === 'messages' && analytics?.totals.unreadMessages ? (
                <span className={styles.unreadBadge}>{analytics.totals.unreadMessages}</span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{user?.username?.[0]?.toUpperCase() || 'A'}</div>
            <div>
              <div className={styles.userName}>{user?.username}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
          <button className={styles.logoutBtn} onClick={logout} id="admin-logout">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className={styles.main}>
        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <div className={styles.tabContent}>
            <h1 className={styles.pageTitle}>Analytics Dashboard</h1>
            <p className={styles.pageDesc}>Overview of your portfolio performance</p>

            {analytics ? (
              <>
                <div className={styles.statsGrid}>
                  {[
                    { label: 'Total Visitors', value: analytics.totals.visitors, icon: '👁️', color: '#00e5ff' },
                    { label: 'Resume Downloads', value: analytics.totals.downloads, icon: '📄', color: '#a855f7' },
                    { label: 'Project Views', value: analytics.totals.projectViews, icon: '🚀', color: '#ec4899' },
                    { label: 'Messages', value: analytics.totals.messages, icon: '💬', color: '#f59e0b' },
                    { label: 'Projects', value: analytics.totals.projects, icon: '💻', color: '#22c55e' },
                    { label: 'Unread Messages', value: analytics.totals.unreadMessages, icon: '🔔', color: '#ef4444' },
                  ].map(s => (
                    <div key={s.label} className={`glass-card ${styles.statCard}`}>
                      <div className={styles.statCardIcon} style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                      <div className={styles.statCardValue} style={{ color: s.color }}>{s.value.toLocaleString()}</div>
                      <div className={styles.statCardLabel}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {analytics.topProjects.length > 0 && (
                  <div className={`glass-card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Top Viewed Projects</h3>
                    <div className={styles.topProjectsList}>
                      {analytics.topProjects.map((p, i) => (
                        <div key={p._id} className={styles.topProjectRow}>
                          <span className={styles.topProjectRank}>#{i + 1}</span>
                          <span className={styles.topProjectName}>{p.title}</span>
                          <span className={styles.topProjectCat}>{p.category}</span>
                          <span className={styles.topProjectViews}>{p.views} views</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analytics.chartData.length > 0 && (
                  <div className={`glass-card ${styles.chartCard}`}>
                    <h3 className={styles.chartTitle}>Daily Activity (Last 30 Days)</h3>
                    <div className={styles.chartBars}>
                      {analytics.chartData.slice(-14).map(d => {
                        const max = Math.max(...analytics.chartData.map(x => x.visitors + x.projectViews), 1);
                        const h = ((d.visitors + d.projectViews) / max) * 100;
                        return (
                          <div key={d.date} className={styles.chartBarGroup} title={`${d.date}: ${d.visitors} visitors, ${d.projectViews} project views`}>
                            <div className={styles.chartBar} style={{ height: `${Math.max(h, 4)}%` }}></div>
                            <span className={styles.chartBarLabel}>{d.date.slice(5)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.loading}>Loading analytics...</div>
            )}
          </div>
        )}

        {/* ── PROJECTS TAB ── */}
        {tab === 'projects' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <div>
                <h1 className={styles.pageTitle}>Projects</h1>
                <p className={styles.pageDesc}>Manage your portfolio projects</p>
              </div>
              <button className="btn btn-primary" onClick={openCreateProject} id="admin-add-project">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Project
              </button>
            </div>

            {/* Project Form Modal */}
            {showProjectForm && (
              <div className={styles.modal} role="dialog" aria-label="Project form">
                <div className={styles.modalBackdrop} onClick={() => setShowProjectForm(false)}></div>
                <div className={`glass-card ${styles.modalCard}`}>
                  <div className={styles.modalHeader}>
                    <h2>{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
                    <button onClick={() => setShowProjectForm(false)} className={styles.modalClose} aria-label="Close modal">×</button>
                  </div>

                  <form onSubmit={submitProject} className={styles.projectForm} id="project-form">
                    <div className={styles.formGrid}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="proj-title">Title *</label>
                        <input id="proj-title" className="form-input" required placeholder="Project title"
                          value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="proj-category">Category *</label>
                        <select id="proj-category" className="form-select"
                          value={projectForm.category} onChange={e => setProjectForm({ ...projectForm, category: e.target.value })}>
                          <option>Frontend Projects</option>
                          <option>React Projects</option>
                          <option>Full Stack Projects</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="proj-description">Description *</label>
                      <textarea id="proj-description" className="form-textarea" required rows={3} placeholder="Project description"
                        value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="proj-tech">Tech Stack (comma-separated) *</label>
                      <input id="proj-tech" className="form-input" required placeholder="React, Node.js, MongoDB"
                        value={projectForm.techStack} onChange={e => setProjectForm({ ...projectForm, techStack: e.target.value })} />
                    </div>

                    <div className={styles.formGrid}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="proj-github">GitHub Link</label>
                        <input id="proj-github" className="form-input" type="url" placeholder="https://github.com/..."
                          value={projectForm.githubLink} onChange={e => setProjectForm({ ...projectForm, githubLink: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="proj-live">Live Link</label>
                        <input id="proj-live" className="form-input" type="url" placeholder="https://..."
                          value={projectForm.liveLink} onChange={e => setProjectForm({ ...projectForm, liveLink: e.target.value })} />
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="proj-image">
                        Project Image {!editingProject && '*'}
                      </label>
                      <input id="proj-image" type="file" accept="image/*"
                        className={styles.fileInput}
                        required={!editingProject}
                        onChange={e => setProjectImage(e.target.files?.[0] || null)} />
                      {editingProject && <p className={styles.fileHint}>Leave empty to keep current image</p>}
                    </div>

                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" checked={projectForm.featured}
                        onChange={e => setProjectForm({ ...projectForm, featured: e.target.checked })} />
                      Mark as Featured Project
                    </label>

                    <div className={styles.formActions}>
                      <button type="button" className="btn btn-outline" onClick={() => setShowProjectForm(false)}>Cancel</button>
                      <button type="submit" className="btn btn-primary" disabled={projectStatus === 'loading'} id="project-submit">
                        {projectStatus === 'loading' ? 'Saving...' : projectStatus === 'success' ? '✅ Saved!' : editingProject ? 'Update Project' : 'Create Project'}
                      </button>
                    </div>

                    {projectStatus === 'error' && (
                      <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>Failed to save. Try again.</p>
                    )}
                  </form>
                </div>
              </div>
            )}

            {/* Projects list */}
            <div className={styles.projectsList}>
              {projects.length === 0 ? (
                <div className={styles.emptyState}>No projects yet. Click "Add Project" to get started.</div>
              ) : (
                projects.map(p => (
                  <div key={p._id} className={`glass-card ${styles.projectRow}`}>
                    <img
                      src={p.image.startsWith('/') ? `${API_BASE}${p.image}` : p.image}
                      alt={p.title}
                      className={styles.projectThumb}
                    />
                    <div className={styles.projectRowInfo}>
                      <div className={styles.projectRowTitle}>
                        {p.title}
                        {p.featured && <span className={styles.featuredTag}>Featured</span>}
                      </div>
                      <div className={styles.projectRowMeta}>{p.category} · {p.views} views</div>
                      <div className={styles.projectRowTech}>
                        {p.techStack.slice(0, 3).map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                    <div className={styles.projectRowActions}>
                      <button className="btn btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        onClick={() => openEditProject(p)} id={`edit-project-${p._id}`}>
                        Edit
                      </button>
                      <button className={styles.deleteBtn}
                        onClick={() => deleteProject(p._id)} id={`delete-project-${p._id}`}
                        aria-label={`Delete ${p.title}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── MESSAGES TAB ── */}
        {tab === 'messages' && (
          <div className={styles.tabContent}>
            <div className={styles.tabHeader}>
              <div>
                <h1 className={styles.pageTitle}>Messages</h1>
                <p className={styles.pageDesc}>Contact form submissions from visitors</p>
              </div>
              {analytics?.totals.unreadMessages ? (
                <div className={styles.unreadInfo}>
                  <span className="status-dot"></span>
                  {analytics.totals.unreadMessages} unread
                </div>
              ) : null}
            </div>

            <div className={styles.messagesList}>
              {messages.length === 0 ? (
                <div className={styles.emptyState}>No messages yet.</div>
              ) : (
                messages.map(m => (
                  <div key={m._id} className={`glass-card ${styles.messageCard} ${!m.read ? styles.messageUnread : ''}`}>
                    <div className={styles.messageHeader}>
                      <div>
                        <div className={styles.messageSender}>
                          {!m.read && <span className={styles.unreadDot}></span>}
                          {m.name}
                          <span className={styles.messageEmail}>{m.email}</span>
                        </div>
                        <div className={styles.messageSubject}>{m.subject}</div>
                      </div>
                      <div className={styles.messageActions}>
                        <span className={styles.messageDate}>{new Date(m.createdAt).toLocaleDateString()}</span>
                        <button className={styles.readBtn} onClick={() => toggleRead(m._id)}
                          title={m.read ? 'Mark unread' : 'Mark read'}>
                          {m.read ? '👁️' : '✉️'}
                        </button>
                        <button className={styles.deleteBtn} onClick={() => deleteMessage(m._id)} aria-label="Delete message">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                        </button>
                      </div>
                    </div>
                    <p className={styles.messageBody}>{m.message}</p>
                    <a href={`mailto:${m.email}?subject=Re: ${m.subject}`} className={styles.replyBtn}>
                      ↩ Reply via Email
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {tab === 'settings' && (
          <div className={styles.tabContent}>
            <h1 className={styles.pageTitle}>Settings</h1>
            <p className={styles.pageDesc}>Configure your portfolio content and AI assistant</p>

            <form onSubmit={submitSettings} className={styles.settingsForm} id="settings-form">
              {/* Social Links */}
              <div className={`glass-card ${styles.settingsSection}`}>
                <h3 className={styles.sectionTitle}>Social Links</h3>
                <div className={styles.settingsGrid}>
                  {(['linkedin', 'github', 'instagram', 'email'] as const).map(key => (
                    <div key={key} className="form-group">
                      <label className="form-label" htmlFor={`settings-${key}`}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <input
                        id={`settings-${key}`}
                        className="form-input"
                        type={key === 'email' ? 'email' : 'url'}
                        placeholder={key === 'email' ? 'your@email.com' : `https://${key}.com/...`}
                        value={settingsForm[key]}
                        onChange={e => setSettingsForm({ ...settingsForm, [key]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Resume Upload */}
              <div className={`glass-card ${styles.settingsSection}`}>
                <h3 className={styles.sectionTitle}>Resume</h3>
                {settings?.resumeUrl && (
                  <p className={styles.currentFile}>
                    Current: <a href={settings.resumeUrl.startsWith('/') ? `${API_BASE}${settings.resumeUrl}` : settings.resumeUrl}
                      target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)' }}>View Resume</a>
                  </p>
                )}
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-resume">Upload New Resume (PDF)</label>
                  <input id="settings-resume" type="file" accept=".pdf" className={styles.fileInput}
                    onChange={e => setResumeFile(e.target.files?.[0] || null)} />
                </div>
              </div>

              {/* AI Prompt */}
              <div className={`glass-card ${styles.settingsSection}`}>
                <h3 className={styles.sectionTitle}>AI Assistant Prompt</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Customize how the AI chatbot represents you. This prompt is the system instruction given to the AI model.
                </p>
                <div className="form-group">
                  <label className="form-label" htmlFor="settings-prompt">System Prompt</label>
                  <textarea
                    id="settings-prompt"
                    className="form-textarea"
                    rows={8}
                    value={settingsForm.aiPrompt}
                    onChange={e => setSettingsForm({ ...settingsForm, aiPrompt: e.target.value })}
                    placeholder="Describe Aalap, his skills, and how the AI should respond..."
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={settingsStatus === 'loading'}
                style={{ alignSelf: 'flex-start' }} id="settings-submit">
                {settingsStatus === 'loading' ? 'Saving...' : settingsStatus === 'success' ? '✅ Saved!' : settingsStatus === 'error' ? '❌ Error' : 'Save Settings'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
