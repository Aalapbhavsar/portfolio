'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface Message {
  _id?: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('adminToken');
    setToken(t);
    if (t) fetchMessages();
  }, []);

  const fetchMessages = async () => {
    const t = localStorage.getItem('adminToken');
    if (!t) return;

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        headers: { 'Authorization': `Bearer ${t}` },
      });
      if (res.ok) {
        setMessages(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  };

  const toggleRead = async (id: string) => {
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/contact/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        fetchMessages();
        if (selectedMessage?._id === id) {
          const updatedMessage = await res.json();
          setSelectedMessage(updatedMessage);
        }
      }
    } catch (err) {
      console.error('Failed to toggle read status:', err);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?') || !token) return;

    try {
      await fetch(`${API_BASE}/api/contact/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      fetchMessages();
      setSelectedMessage(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === 'unread') return !msg.read;
    if (filter === 'read') return msg.read;
    return true;
  });

  const unreadCount = messages.filter((m) => !m.read).length;

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="admin-page-title">Messages</h1>
        <p className="admin-page-desc">
          {unreadCount > 0 ? `${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}` : 'All messages read'}
        </p>
      </div>

      <div className="admin-card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            className="admin-btn"
            style={{
              background: filter === 'all' ? 'var(--primary)' : 'var(--bg-surface-hover)',
              color: filter === 'all' ? 'white' : 'var(--text-primary)',
            }}
            onClick={() => setFilter('all')}
          >
            All ({messages.length})
          </button>
          <button
            className="admin-btn"
            style={{
              background: filter === 'unread' ? 'var(--primary)' : 'var(--bg-surface-hover)',
              color: filter === 'unread' ? 'white' : 'var(--text-primary)',
            }}
            onClick={() => setFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            className="admin-btn"
            style={{
              background: filter === 'read' ? 'var(--primary)' : 'var(--bg-surface-hover)',
              color: filter === 'read' ? 'white' : 'var(--text-primary)',
            }}
            onClick={() => setFilter('read')}
          >
            Read ({messages.length - unreadCount})
          </button>
        </div>

        {filteredMessages.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No messages found.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', minHeight: '500px' }}>
            {/* Message List */}
            <div style={{ borderRight: '1px solid var(--border-medium)', overflowY: 'auto', maxHeight: '600px' }}>
              {filteredMessages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => setSelectedMessage(msg)}
                  style={{
                    padding: '1rem',
                    borderBottom: '1px solid var(--border-medium)',
                    cursor: 'pointer',
                    background: selectedMessage?._id === msg._id ? 'var(--bg-surface-hover)' : 'transparent',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                    {!msg.read && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--primary)',
                        }}
                      />
                    )}
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{msg.name}</div>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    {msg.subject}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-disabled)' }}>
                    {formatDate(msg.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Message Detail */}
            {selectedMessage ? (
              <div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div>
                      <h2 style={{ margin: 0, marginBottom: '0.5rem' }}>{selectedMessage.subject}</h2>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        From: <strong>{selectedMessage.name}</strong> ({selectedMessage.email})
                      </p>
                      <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {formatDate(selectedMessage.createdAt)}
                      </p>
                    </div>
                    {!selectedMessage.read && (
                      <button
                        className="admin-btn admin-btn-primary"
                        onClick={() => selectedMessage._id && toggleRead(selectedMessage._id)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    background: 'var(--bg-surface-hover)',
                    padding: '1.5rem',
                    borderRadius: '0.5rem',
                    marginBottom: '1.5rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    lineHeight: '1.6',
                  }}
                >
                  {selectedMessage.message}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="admin-btn admin-btn-secondary"
                  >
                    ✉️ Reply
                  </a>
                  <button
                    className="admin-btn admin-btn-danger"
                    onClick={() => selectedMessage._id && deleteMessage(selectedMessage._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                Select a message to view details
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
