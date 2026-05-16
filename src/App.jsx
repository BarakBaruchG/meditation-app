import { useState, useEffect, useRef } from 'react';

export default function MeditationApp() {
  const presets = [
    { label: '5 min', seconds: 300 },
    { label: '10 min', seconds: 600 },
    { label: '15 min', seconds: 900 },
    { label: '20 min', seconds: 1200 },
    { label: '30 min', seconds: 1800 },
  ];

  const [duration, setDuration] = useState(600);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const audioCtxRef = useRef(null);

  // Initialize / reset
  useEffect(() => {
    if (!running) setRemaining(duration);
  }, [duration, running]);

  // Tick
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(id);
          setRunning(false);
          setFinished(true);
          playBell();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  // Bell sound via Web Audio — singing-bowl-ish tone
  const playBell = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      const partials = [
        { freq: 220, gain: 0.35, decay: 6 },
        { freq: 440, gain: 0.25, decay: 5 },
        { freq: 660, gain: 0.12, decay: 4 },
        { freq: 880, gain: 0.06, decay: 3 },
      ];

      partials.forEach(({ freq, gain, decay }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
        osc.connect(g).connect(ctx.destination);
        osc.start(now);
        osc.stop(now + decay + 0.1);
      });
    } catch (e) {
      console.warn('Audio not available', e);
    }
  };

  const handleStart = () => {
    setFinished(false);
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    } catch (e) {}
    setRunning(true);
  };

  const handlePause = () => setRunning(false);

  const handleReset = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(duration);
  };

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const progress = 1 - remaining / duration;
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at top, #c9b896 0%, #a89178 40%, #6b5640 100%)',
        fontFamily: "'Cormorant Garamond', Georgia, serif",
        color: '#3a2e22',
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* subtle grain overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.08,
          pointerEvents: 'none',
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div style={{ textAlign: 'center', marginBottom: '2rem', zIndex: 1 }}>
        <p
          style={{
            letterSpacing: '0.4em',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            margin: 0,
            opacity: 0.7,
          }}
        >
          A quiet moment
        </p>
        <h1
          style={{
            fontSize: '2.75rem',
            fontWeight: 400,
            fontStyle: 'italic',
            margin: '0.25rem 0 0',
            letterSpacing: '0.02em',
          }}
        >
          Stillness
        </h1>
      </div>

      {/* Timer ring */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <svg width="320" height="320" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a3c2a" />
              <stop offset="100%" stopColor="#8a6f4f" />
            </linearGradient>
          </defs>
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="rgba(58, 46, 34, 0.15)"
            strokeWidth="2"
          />
          <circle
            cx="160"
            cy="160"
            r={radius}
            fill="none"
            stroke="url(#ring)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 160 160)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
          <text
            x="160"
            y="165"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="'Cormorant Garamond', Georgia, serif"
            fontSize="56"
            fontWeight="300"
            fill="#3a2e22"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {fmt(remaining)}
          </text>
          <text
            x="160"
            y="200"
            textAnchor="middle"
            fontFamily="'Cormorant Garamond', Georgia, serif"
            fontSize="13"
            letterSpacing="0.3em"
            fill="#3a2e22"
            opacity="0.5"
          >
            {finished ? 'COMPLETE' : running ? 'BREATHE' : 'READY'}
          </text>
        </svg>
      </div>

      {/* Preset selection */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          marginTop: '2rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {presets.map((p) => (
          <button
            key={p.seconds}
            onClick={() => !running && setDuration(p.seconds)}
            disabled={running}
            style={{
              background:
                duration === p.seconds
                  ? 'rgba(58, 46, 34, 0.85)'
                  : 'rgba(255, 255, 255, 0.15)',
              color: duration === p.seconds ? '#f4ead5' : '#3a2e22',
              border: '1px solid rgba(58, 46, 34, 0.3)',
              padding: '0.5rem 1.1rem',
              fontFamily: 'inherit',
              fontSize: '0.95rem',
              letterSpacing: '0.05em',
              cursor: running ? 'not-allowed' : 'pointer',
              opacity: running && duration !== p.seconds ? 0.4 : 1,
              borderRadius: '2px',
              transition: 'all 0.3s ease',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          marginTop: '1.5rem',
          zIndex: 1,
        }}
      >
        {!running ? (
          <button
            onClick={handleStart}
            style={{
              background: '#3a2e22',
              color: '#f4ead5',
              border: 'none',
              padding: '0.9rem 2.5rem',
              fontFamily: 'inherit',
              fontSize: '1.05rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            {remaining < duration && remaining > 0 ? 'Resume' : 'Begin'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            style={{
              background: 'rgba(58, 46, 34, 0.2)',
              color: '#3a2e22',
              border: '1px solid #3a2e22',
              padding: '0.9rem 2.5rem',
              fontFamily: 'inherit',
              fontSize: '1.05rem',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '2px',
            }}
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          style={{
            background: 'transparent',
            color: '#3a2e22',
            border: '1px solid rgba(58, 46, 34, 0.4)',
            padding: '0.9rem 1.5rem',
            fontFamily: 'inherit',
            fontSize: '1.05rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: '2px',
          }}
        >
          Reset
        </button>
      </div>

      <button
        onClick={playBell}
        style={{
          marginTop: '2rem',
          background: 'transparent',
          color: '#3a2e22',
          border: 'none',
          fontFamily: 'inherit',
          fontStyle: 'italic',
          fontSize: '0.95rem',
          opacity: 0.6,
          cursor: 'pointer',
          zIndex: 1,
        }}
      >
        ··· preview bell ···
      </button>
    </div>
  );
}
