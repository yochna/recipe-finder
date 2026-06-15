// cache bust deploy trigger 2026
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import './AiChef.css';

const CHEF_IMG = 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=560&h=600&q=85';
const SUGGESTIONS = [
  'I have chicken, garlic and lemon — what can I make in 30 minutes?',
  'Two eggs, some spinach and feta cheese',
  'I want something spicy, vegetarian, quick',
  'Leftover rice, soy sauce and vegetables',
];

const SYSTEM_PROMPT = `You are Chef Olive, a warm and witty AI sous-chef for the recipe app "Saffron & Stove". 
When a user tells you what ingredients they have, their mood, or what they're craving, 
suggest exactly 3 honest, doable recipes in a concise format.
For each recipe give: name, a 1-line description, key ingredients, and rough cook time.
Keep your tone friendly, down-to-earth, like a helpful chef friend — not a textbook.`;

export default function AiChef() {
  const { user, loading: authLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello — I'm Chef Olive. Tell me what's on your counter (ingredients, mood, time you have) and I'll plate three honest recipes for you." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (authLoading) {
    return <main className="ai-chef"><div style={{ textAlign: 'center', padding: '4rem' }}>Loading…</div></main>;
  }

  if (!user) {
    return (
      <main className="ai-chef">
        <div className="ai-chef__layout">
          <div className="ai-chef__left">
            <div className="ai-chef__photo-wrap">
              <img src={CHEF_IMG} alt="Fresh ingredients" className="ai-chef__photo" />
            </div>
            <p className="eyebrow ai-chef__eyebrow">In Conversation With</p>
            <h1 className="ai-chef__name">Chef Olive</h1>
            <p className="ai-chef__desc">A consultation, not a chatbot. Tell her what you have. She'll keep it doable.</p>
          </div>
          <div className="ai-chef__chat" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.25rem' }}>
            <p className="eyebrow" style={{ textAlign: 'center' }}>Members Only</p>
            <h2 style={{ textAlign: 'center', fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
              Sign in to chat with Chef Olive
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--color-muted, #888)', maxWidth: 360 }}>
              Create a free account or sign in to get personalised recipe suggestions from your ingredients.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="navbar__btn navbar__btn--ghost" onClick={() => setShowModal('login')}>Sign In</button>
              <button className="navbar__btn navbar__btn--solid" onClick={() => setShowModal('register')}>Create Account</button>
            </div>
          </div>
        </div>
        {showModal && <AuthModal mode={showModal} onClose={() => setShowModal(false)} />}
      </main>
    );
  }

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setLoading(true);

    // Resolves to your Vercel Environment Variable or falls back directly to your live Render backend URL
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://saffron-stove-backend.onrender.com';

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: SYSTEM_PROMPT,
          messages: [
            ...messages.slice(1).map(m => ({ role: m.role, content: m.text })),
            { role: 'user', content: msg },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Server returned status code ${response.status}`);
      }

      const data = await response.json();
      const reply = data.content?.[0]?.text || "Sorry, I couldn't think of anything right now!";
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);

    } catch (err) {
      console.error("Chat Execution Error:", err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: err.message || "My kitchen wifi is acting up — try again in a moment!" 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="ai-chef">
      <div className="ai-chef__layout">
        <div className="ai-chef__left">
          <div className="ai-chef__photo-wrap">
            <img src={CHEF_IMG} alt="Fresh ingredients" className="ai-chef__photo" />
          </div>
          <p className="eyebrow ai-chef__eyebrow">In Conversation With</p>
          <h1 className="ai-chef__name">Chef Olive</h1>
          <p className="ai-chef__desc">A consultation, not a chatbot. Tell her what you have. She'll keep it doable.</p>
          <div className="ai-chef__try">
            <p className="ai-chef__try-label eyebrow">Try</p>
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="ai-chef__suggestion" onClick={() => send(s)}>
                "{s}"
              </button>
            ))}
          </div>
        </div>
        <div className="ai-chef__chat">
          <div className="ai-chef__messages">
            {messages.map((m, i) => (
              <div key={i} className={`ai-chef__msg ai-chef__msg--${m.role}`}>
                {m.role === 'assistant' && (
                  <div className="ai-chef__avatar"><img src={CHEF_IMG} alt="Chef Olive" /></div>
                )}
                <div className="ai-chef__bubble">
                  {m.text.split('\n').map((line, j) => (
                    <p key={j}>{line || <br/>}</p>
                  ))}
                </div>
              </div>
            ))}
            {loading && (
              <div className="ai-chef__msg ai-chef__msg--assistant">
                <div className="ai-chef__avatar"><img src={CHEF_IMG} alt="" /></div>
                <div className="ai-chef__bubble ai-chef__bubble--typing"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
          <div className="ai-chef__input-area">
            <input
              className="ai-chef__input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="What's in your kitchen?"
              disabled={loading}
            />
            <button className="ai-chef__send" onClick={() => send()} disabled={loading || !input.trim()}>
              <i className="fas fa-paper-plane" /> Ask
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}