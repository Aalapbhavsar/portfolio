'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './AIChatWidget.module.css';

const API_BASE = process.env.NEXT_PUBLIC_API_URL!;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  "What are Aalap's main skills?",
  "Is he available for hire?",
  "What projects has he built?",
  "How can I contact Aalap?",
];

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm Aalap's AI Assistant. Ask me anything about his skills, projects, or experience!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, isOpen]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: content.trim() },
    ];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!response.ok) throw new Error('API error');
      const data = await response.json();

      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            "Sorry, I'm having trouble connecting right now. Please try again or use the contact form below!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle AI Chat"
        id="ai-chat-trigger"
      >
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" strokeLinecap="round"/>
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 17h.01" strokeLinecap="round"/>
          </svg>
        )}
        <span className={styles.triggerLabel}>Ask AI</span>
      </button>

      {/* Chat panel */}
      <div className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`} role="dialog" aria-label="AI Chat">
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              <span>AI</span>
            </div>
            <div>
              <div className={styles.headerTitle}>Aalap's Assistant</div>
              <div className={styles.headerStatus}>
                <span className={styles.statusDot}></span>
                Online
              </div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setIsOpen(false)} aria-label="Close chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className={styles.messages} id="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.assistantMessage}`}>
              {msg.role === 'assistant' && (
                <div className={styles.msgAvatar}>AI</div>
              )}
              <div className={styles.bubble}>{msg.content}</div>
            </div>
          ))}

          {isLoading && (
            <div className={`${styles.message} ${styles.assistantMessage}`}>
              <div className={styles.msgAvatar}>AI</div>
              <div className={`${styles.bubble} ${styles.typingBubble}`}>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
                <span className={styles.dot}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions (only on first message) */}
        {messages.length === 1 && (
          <div className={styles.suggestions}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                className={styles.suggestion}
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className={styles.inputArea}>
          <input
            ref={inputRef}
            type="text"
            className={styles.chatInput}
            placeholder="Ask me anything..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            id="chat-input"
            aria-label="Chat message input"
          />
          <button
            className={styles.sendBtn}
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
            id="chat-send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
