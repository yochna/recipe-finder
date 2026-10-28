import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/AuthModal';
import RecipeCard from '../components/RecipeCard';
import { scanIngredients, getRecipesByIngredients } from '../api';
import './FridgeScan.css';

const MAX_EDGE = 768; // downscale before upload — keeps the payload small and Gemini-accurate

const drawToDataUrl = (source) => {
  const w = source.videoWidth || source.width;
  const h = source.videoHeight || source.height;
  if (!w || !h) return null;
  const scale = Math.min(1, MAX_EDGE / Math.max(w, h));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
};

export default function FridgeScan() {
  const { user, loading: authLoading } = useAuth();
  const [showModal, setShowModal] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [photo, setPhoto] = useState(null);          // captured data URL
  const [scanning, setScanning] = useState(false);
  const [detected, setDetected] = useState(null);    // null = not scanned yet
  const [chips, setChips] = useState([]);
  const [chipInput, setChipInput] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState(null);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => stopCamera, [stopCamera]);

  const startCamera = async () => {
    setError(null);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      // video element mounts after setCameraOn — attach in an effect below
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission was blocked. Allow it in your browser settings, or upload a photo instead.'
          : 'No camera found on this device — upload a photo instead.'
      );
    }
  };

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  const capture = () => {
    if (!videoRef.current) return;
    const url = drawToDataUrl(videoRef.current);
    if (!url) return;
    setPhoto(url);
    stopCamera();
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      setError('That image is larger than 6 MB — pick a smaller one.');
      return;
    }
    stopCamera();
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result);
    reader.onerror = () => setError('Could not read that file.');
    reader.readAsDataURL(file);
  };

  const scan = async () => {
    if (!photo) return;
    setScanning(true);
    setError(null);
    try {
      const list = await scanIngredients(photo);
      if (!list.length) {
        setError('No ingredients were recognised. Try better light, or type them in below.');
      }
      setDetected(list);
      setChips(list);
    } catch (err) {
      setError(err.message || 'The scan failed — try again.');
    } finally {
      setScanning(false);
    }
  };

  const addChip = () => {
    const value = chipInput.trim().toLowerCase();
    if (value && !chips.some(c => c === value)) setChips(prev => [...prev, value]);
    setChipInput('');
  };

  const findRecipes = async () => {
    if (!chips.length) return;
    setMatching(true);
    setError(null);
    try {
      const results = await getRecipesByIngredients(chips);
      setRecipes(results);
      if (!results.length) setError('Nothing matched these ingredients yet — try removing a few items or adding staples like onion, garlic or tomato.');
    } catch (err) {
      setError(err.message || 'Recipe matching failed — try again.');
    } finally {
      setMatching(false);
    }
  };

  const reset = () => {
    setPhoto(null);
    setDetected(null);
    setChips([]);
    setRecipes([]);
    setError(null);
  };

  if (authLoading) {
    return <main className="fs"><div className="fs__loading">Loading…</div></main>;
  }

  if (!user) {
    return (
      <main className="fs">
        <div className="fs__gate">
          <p className="eyebrow">Members Only</p>
          <h1 className="fs__gate-title">Scan your fridge, find your dinner</h1>
          <p className="fs__gate-desc">
            Sign in to point your camera at your ingredients and get instant recipe matches for what you already have.
          </p>
          <div className="fs__gate-actions">
            <button className="navbar__btn navbar__btn--ghost" onClick={() => setShowModal('login')}>Sign In</button>
            <button className="navbar__btn navbar__btn--solid" onClick={() => setShowModal('register')}>Create Account</button>
          </div>
        </div>
        {showModal && <AuthModal mode={showModal} onClose={() => setShowModal(false)} />}
      </main>
    );
  }

  return (
    <main className="fs">
      <header className="fs__header">
        <p className="eyebrow">Kitchen Vision</p>
        <h1 className="fs__title">Fridge Scan</h1>
        <p className="fs__sub">
          Show me what you've got — I'll tell you what you can cook with it.
        </p>
      </header>

      {/* ── Step 1: capture ── */}
      {!photo && (
        <section className="fs__capture" aria-label="Capture a photo of your ingredients">
          {cameraOn ? (
            <div className="fs__camera">
              <video ref={videoRef} className="fs__video" autoPlay playsInline muted />
              <div className="fs__camera-actions">
                <button className="fs__btn fs__btn--solid" onClick={capture}>
                  <i className="fas fa-camera" aria-hidden="true" /> Capture
                </button>
                <button className="fs__btn" onClick={stopCamera}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="fs__capture-cta">
              <button className="fs__btn fs__btn--solid fs__btn--lg" onClick={startCamera}>
                <i className="fas fa-camera" aria-hidden="true" /> Open camera
              </button>
              <span className="fs__or">or</span>
              <button className="fs__btn fs__btn--lg" onClick={() => fileInputRef.current?.click()}>
                <i className="fas fa-image" aria-hidden="true" /> Upload a photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onFile}
                hidden
              />
            </div>
          )}
          {cameraError && <p className="fs__note" role="alert">{cameraError}</p>}
        </section>
      )}

      {/* ── Step 2: review photo + scan ── */}
      {photo && !detected && (
        <section className="fs__review" aria-label="Review your photo">
          <img src={photo} alt="Your ingredients" className="fs__photo" />
          <div className="fs__review-actions">
            <button className="fs__btn fs__btn--solid" onClick={scan} disabled={scanning}>
              {scanning
                ? <><i className="fas fa-spinner fa-spin" aria-hidden="true" /> Scanning…</>
                : <><i className="fas fa-wand-magic-sparkles" aria-hidden="true" /> Identify ingredients</>}
            </button>
            <button className="fs__btn" onClick={reset} disabled={scanning}>Retake</button>
          </div>
        </section>
      )}

      {/* ── Step 3: editable chips + match ── */}
      {detected !== null && (
        <section className="fs__chips-panel" aria-label="Your ingredients">
          <h2 className="fs__chips-title">
            {detected.length
              ? `We spotted ${detected.length} ingredient${detected.length === 1 ? '' : 's'}. Fix the list if it misread anything:`
              : 'Nothing was recognised — type your ingredients in:'}
          </h2>
          <div className="fs__chips">
            {chips.map(chip => (
              <span key={chip} className="fs__chip">
                {chip}
                <button
                  className="fs__chip-x"
                  onClick={() => setChips(prev => prev.filter(c => c !== chip))}
                  aria-label={`Remove ${chip}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              className="fs__chip-input"
              value={chipInput}
              onChange={e => setChipInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); addChip(); }
                if (e.key === 'Backspace' && !chipInput && chips.length) setChips(prev => prev.slice(0, -1));
              }}
              placeholder={chips.length ? 'Add another…' : 'e.g. chicken, tomatoes, rice'}
              aria-label="Add an ingredient"
            />
          </div>
          <div className="fs__match-actions">
            <button className="fs__btn fs__btn--solid" onClick={findRecipes} disabled={!chips.length || matching}>
              {matching
                ? <><i className="fas fa-spinner fa-spin" aria-hidden="true" /> Cooking up matches…</>
                : <><i className="fas fa-utensils" aria-hidden="true" /> What can I make? ({chips.length})</>}
            </button>
            <button className="fs__btn" onClick={reset}>Start over</button>
          </div>
        </section>
      )}

      {error && <p className="fs__error" role="alert">{error}</p>}

      {/* ── Step 4: results ── */}
      {recipes.length > 0 && (
        <section className="fs__results" aria-label="Recipe matches">
          <h2 className="fs__results-title">You can make {recipes.length} dish{recipes.length === 1 ? '' : 'es'}</h2>
          <div className="fs__grid">
            {recipes.map(r => {
              const missed = (r.missedIngredients || []).slice(0, 3);
              return (
                <div key={r.id} className="fs__card-wrap">
                  <div className="fs__match-badge">
                    {r.usedIngredientCount > 0
                      ? <>✓ {r.usedIngredientCount} of your ingredients</>
                      : 'Close match'}
                    {missed.length > 0 && (
                      <span className="fs__miss"> · missing {missed.map(m => m.name).join(', ')}</span>
                    )}
                  </div>
                  <RecipeCard recipe={r} onLoginRequired={() => setShowModal('login')} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
