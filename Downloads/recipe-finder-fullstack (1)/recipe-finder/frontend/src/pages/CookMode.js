import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './CookMode.css';

export default function CookMode() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [steps, setSteps] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Timer state
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`/api/recipes/${id}/steps`)
      .then(r => r.json())
      .then(data => {
        if (!data.length) setError('No step-by-step instructions available for this recipe.');
        setSteps(data);
      })
      .catch(() => setError('Failed to load steps.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Reset timer when step changes
  useEffect(() => {
    clearInterval(intervalRef.current);
    setTimerRunning(false);
    const step = steps[current];
    const mins = step?.length?.number;
    const unit = step?.length?.unit;
    if (mins && unit) {
      const seconds = unit === 'minutes' ? mins * 60 : mins;
      setTimeLeft(seconds);
    } else {
      setTimeLeft(null);
    }
  }, [current, steps]);

  // Countdown tick
  useEffect(() => {
    if (timerRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [timerRunning]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const goNext = () => { if (current < steps.length - 1) setCurrent(c => c + 1); };
  const goPrev = () => { if (current > 0) setCurrent(c => c - 1); };

  if (loading) return (
    <div className="cook__fullscreen">
      <div className="cook__loading">Loading steps…</div>
    </div>
  );

  if (error) return (
    <div className="cook__fullscreen">
      <div className="cook__error">
        <p>{error}</p>
        <button className="cook__btn" onClick={() => navigate(-1)}>Go Back</button>
      </div>
    </div>
  );

  const step = steps[current];
  const isLast = current === steps.length - 1;
  const progress = ((current + 1) / steps.length) * 100;

  return (
    <div className="cook__fullscreen">

      {/* Top bar */}
      <div className="cook__topbar">
        <button className="cook__exit" onClick={() => navigate(-1)}>
          <i className="fas fa-times"/> Exit Cook Mode
        </button>
        <span className="cook__counter">Step {current + 1} of {steps.length}</span>
      </div>

      {/* Progress bar */}
      <div className="cook__progress-track">
        <div className="cook__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Step content */}
      <div className="cook__body">
        <div className="cook__step-number">Step {step.number}</div>
        <p className="cook__step-text">{step.step}</p>

        {/* Ingredients for this step */}
        {step.ingredients?.length > 0 && (
          <div className="cook__ingredients">
            <p className="cook__ingredients-label">You'll need:</p>
            <div className="cook__ingredients-list">
              {step.ingredients.map(ing => (
                <span key={ing.id} className="cook__ingredient-tag">{ing.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* Timer */}
        {timeLeft !== null && (
          <div className="cook__timer">
            <div className="cook__timer-display">{formatTime(timeLeft)}</div>
            <div className="cook__timer-btns">
              <button
                className="cook__btn cook__btn--outline"
                onClick={() => setTimerRunning(r => !r)}
              >
                <i className={`fas fa-${timerRunning ? 'pause' : 'play'}`}/>
                {timerRunning ? ' Pause' : ' Start Timer'}
              </button>
              <button
                className="cook__btn cook__btn--ghost"
                onClick={() => {
                  setTimerRunning(false);
                  const mins = step.length.number;
                  const unit = step.length.unit;
                  setTimeLeft(unit === 'minutes' ? mins * 60 : mins);
                }}
              >
                <i className="fas fa-redo"/> Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="cook__nav">
        <button
          className="cook__btn cook__btn--outline"
          onClick={goPrev}
          disabled={current === 0}
        >
          <i className="fas fa-arrow-left"/> Previous
        </button>

        {isLast ? (
          <button className="cook__btn cook__btn--done" onClick={() => navigate(-1)}>
            <i className="fas fa-check"/> Done!
          </button>
        ) : (
          <button className="cook__btn cook__btn--next" onClick={goNext}>
            Next <i className="fas fa-arrow-right"/>
          </button>
        )}
      </div>

    </div>
  );
}