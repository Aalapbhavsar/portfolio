'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const u = localStorage.getItem('adminUser');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    if (u) setUser(JSON.parse(u));
  }, [router]);

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const menuItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/admin/profile', label: 'Profile', icon: '👤' },
    { href: '/admin/projects', label: 'Projects', icon: '🚀' },
    { href: '/admin/skills', label: 'Skills', icon: '💻' },
    { href: '/admin/experience', label: 'Experience', icon: '📝' },
    { href: '/admin/certifications', label: '🏆 Certifications' },
    { href: '/admin/content', label: 'Content', icon: '📄' },
    { href: '/admin/messages', label: 'Messages', icon: '💬' },
  ];

  return (
    <div className="admin-layout">
      <nav className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <span className="admin-logo">Aalap.</span>
          <span className="admin-badge">Admin</span>
        </div>

        <ul className="admin-menu">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`admin-menu-item ${pathname === item.href ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                {item.icon} {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="admin-footer">
          <div className="admin-user-info">
            <div className="admin-avatar">{user?.username?.[0]?.toUpperCase() || 'A'}</div>
            <div>
              <div className="admin-username">{user?.username}</div>
              <div className="admin-email">{user?.email}</div>
            </div>
          </div>
          <button className="admin-logout-btn" onClick={logout}>
            Logout
          </button>
        </div>
      </nav>

      <main className="admin-main">{children}</main>

      {/* Mobile menu button */}
      <button className="admin-menu-toggle" onClick={() => setIsOpen(!isOpen)}>
        ☰
      </button>
    </div>
  );
}
