'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

export default function AdminLogin() {
  const router = useRouter();
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await res.json();
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify({ username: data.username, email: data.email }));
      router.push('/admin/dashboard');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Login failed. Check credentials.');
    }
  };

  return (
    <main className={styles.page}>
      {/* Background orbs */}
      <div className={`orb orb-cyan ${styles.orb1}`}></div>
      <div className={`orb orb-violet ${styles.orb2}`}></div>

      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div className={styles.logo}>
            <span className="gradient-text" style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.8rem' }}>Aalap.</span>
          </div>
          <h1 className={styles.title}>Admin Portal</h1>
          <p className={styles.subtitle}>Sign in to manage your portfolio</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} id="admin-login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              className="form-input"
              placeholder="Enter your username"
              required
              autoComplete="username"
              value={creds.username}
              onChange={e => setCreds({ ...creds, username: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              value={creds.password}
              onChange={e => setCreds({ ...creds, password: e.target.value })}
            />
          </div>

          {status === 'error' && (
            <div className={styles.error}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === 'loading'}
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
            id="admin-login-submit"
          >
            {status === 'loading' ? (
              <><span className={styles.spinner}></span>Signing in...</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Sign In
              </>
            )}
          </button>
        </form>

        <a href="/" className={styles.backLink}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Back to Portfolio
        </a>
      </div>
    </main>
  );
}
