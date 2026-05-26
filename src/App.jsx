import { useState, useEffect, useRef } from 'react';

const RED = '#E10600';
const RED_DIM = 'rgba(225,6,0,0.15)';
const WHITE = '#FFFFFF';
const GRAY = '#888888';
const SURFACE = '#141414';
const BORDER = 'rgba(255,255,255,0.08)';
const FONT = "'Barlow Condensed', sans-serif";

export default function MeditationApp() {
  const presets = [
    { label: '5 MIN', seconds: 300 },
    { label: '10 MIN', seconds: 600 },
    { label: '15 MIN', seconds: 900 },
    { label: '20 MIN', seconds: 1200 },
    { label: '30 MIN', seconds: 1800 },
  ];

  const [duration, setDuration] = useState(600);
  const [remaining, setRemaining] = useState(600);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [blink, setBlink] = useState(true);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    if (!running) setRemaining(duration);
  }, [duration, running]);

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

  // Blinking dot when running
  useEffect(() => {
    if (!running) { setBlink(true); return; }
    const id = setInterval(() => setBlink((b) => !b), 600);
    return () => clearInterval(id);
  }, [running]);

  const playBell = () => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // ── Strike transient: filtered noise burst (the mallet hit) ──────────
      const bufSize = Math.floor(ctx.sampleRate * 0.09);
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < bufSize; i++) nd[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuf;
      const noiseBp = ctx.createBiquadFilter();
      noiseBp.type = 'bandpass';
      noiseBp.frequency.value = 2800;
      noiseBp.Q.value = 0.8;
      const noiseG = ctx.createGain();
      noiseG.gain.setValueAtTime(0.5, now);
      noiseG.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      noise.connect(noiseBp).connect(noiseG).connect(ctx.destination);
      noise.start(now);

      // ── Inharmonic resonant partials (gong body) ──────────────────────
      // Real gongs have non-integer frequency ratios — that's the key
      // to their metallic shimmer vs. a pure bell.
      // The fundamental also swells slightly in pitch after the strike.
      [
        { freq: 76,   gain: 0.42, decay: 11.0, swell: true  },
        { freq: 183,  gain: 0.28, decay:  9.0, swell: false },
        { freq: 308,  gain: 0.18, decay:  7.0, swell: false },
        { freq: 492,  gain: 0.10, decay:  5.0, swell: false },
        { freq: 724,  gain: 0.06, decay:  3.5, swell: false },
        { freq: 1090, gain: 0.03, decay:  2.0, swell: false },
        { freq: 1840, gain: 0.015,decay:  0.9, swell: false },
      ].forEach(({ freq, gain, decay, swell }) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        // Characteristic gong pitch swell on the fundamental
        if (swell) {
          osc.frequency.setValueAtTime(freq * 0.975, now);
          osc.frequency.linearRampToValueAtTime(freq, now + 0.35);
        } else {
          osc.frequency.value = freq;
        }
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(gain, now + 0.012);
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
  const handleReset = () => { setRunning(false); setFinished(false); setRemaining(duration); };

  const fmt = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const progress = 1 - remaining / duration;
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  const statusLabel = finished ? 'SESSION COMPLETE' : running ? 'IN PROGRESS' : remaining < duration && remaining > 0 ? 'PAUSED' : 'READY';
  const statusColor = finished ? RED : running ? WHITE : GRAY;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      fontFamily: FONT,
      color: WHITE,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      {/* Red accent line top */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '3px',
        background: RED,
      }} />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', zIndex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          marginBottom: '0.6rem',
        }}>
          <div style={{ width: '24px', height: '2px', background: RED }} />
          <p style={{
            letterSpacing: '0.35em',
            fontSize: '0.7rem',
            color: GRAY,
            textTransform: 'uppercase',
            fontFamily: FONT,
            fontWeight: 500,
          }}>
            Official Timekeeper
          </p>
          <div style={{ width: '24px', height: '2px', background: RED }} />
        </div>
        <h1 style={{
          fontSize: '2.8rem',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          margin: 0,
          fontFamily: FONT,
          lineHeight: 1,
        }}>
          Precision<span style={{ color: RED }}> ·</span> Stillness
        </h1>
      </div>

      {/* Chronograph ring */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <svg width="320" height="320" style={{ display: 'block' }}>
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Tick marks */}
          {Array.from({ length: 60 }).map((_, i) => {
            const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const isMajor = i % 5 === 0;
            const r1 = isMajor ? 148 : 151;
            const r2 = 155;
            return (
              <line
                key={i}
                x1={160 + r1 * Math.cos(angle)}
                y1={160 + r1 * Math.sin(angle)}
                x2={160 + r2 * Math.cos(angle)}
                y2={160 + r2 * Math.sin(angle)}
                stroke={isMajor ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.12)'}
                strokeWidth={isMajor ? 2 : 1}
              />
            );
          })}

          {/* Track */}
          <circle cx="160" cy="160" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />

          {/* Progress arc */}
          <circle
            cx="160" cy="160" r={radius}
            fill="none"
            stroke={finished ? RED : RED}
            strokeWidth="6"
            strokeLinecap="butt"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 160 160)"
            style={{ transition: 'stroke-dashoffset 1s linear' }}
            filter="url(#glow)"
          />

          {/* Center surface */}
          <circle cx="160" cy="160" r="110" fill={SURFACE} />
          <circle cx="160" cy="160" r="110" fill="none" stroke={BORDER} strokeWidth="1" />

          {/* Timer digits */}
          <text
            x="160" y="158"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily={FONT}
            fontSize="52"
            fontWeight="300"
            fill={WHITE}
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}
          >
            {fmt(remaining)}
          </text>

          {/* Status */}
          <text
            x="160" y="192"
            textAnchor="middle"
            fontFamily={FONT}
            fontSize="11"
            fontWeight="600"
            letterSpacing="0.3em"
            fill={statusColor}
          >
            {statusLabel}
          </text>

          {/* Blinking dot when running */}
          {running && (
            <circle cx="160" cy="214" r="3" fill={RED} opacity={blink ? 1 : 0} />
          )}

          {/* Sector label top */}
          <text x="160" y="80" textAnchor="middle" fontFamily={FONT} fontSize="10" fontWeight="500" letterSpacing="0.25em" fill={GRAY}>
            CHRONOGRAPH
          </text>
        </svg>
      </div>

      {/* Preset selector */}
      <div style={{
        display: 'flex',
        gap: '0.4rem',
        marginTop: '2rem',
        flexWrap: 'wrap',
        justifyContent: 'center',
        zIndex: 1,
      }}>
        {presets.map((p) => {
          const active = duration === p.seconds;
          return (
            <button
              key={p.seconds}
              onClick={() => !running && setDuration(p.seconds)}
              disabled={running}
              style={{
                background: active ? RED : 'transparent',
                color: active ? WHITE : GRAY,
                border: `1px solid ${active ? RED : 'rgba(255,255,255,0.12)'}`,
                padding: '0.45rem 1rem',
                fontFamily: FONT,
                fontSize: '0.8rem',
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: running ? 'not-allowed' : 'pointer',
                opacity: running && !active ? 0.3 : 1,
                borderRadius: '0',
                transition: 'all 0.2s ease',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        marginTop: '1.25rem',
        zIndex: 1,
      }}>
        {!running ? (
          <button
            onClick={handleStart}
            style={{
              background: RED,
              color: WHITE,
              border: 'none',
              padding: '0.85rem 2.8rem',
              fontFamily: FONT,
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 0,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            {remaining < duration && remaining > 0 ? 'Resume' : 'Begin'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            style={{
              background: 'transparent',
              color: RED,
              border: `1px solid ${RED}`,
              padding: '0.85rem 2.8rem',
              fontFamily: FONT,
              fontSize: '0.95rem',
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: 0,
            }}
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          style={{
            background: 'transparent',
            color: GRAY,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '0.85rem 1.6rem',
            fontFamily: FONT,
            fontSize: '0.95rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            cursor: 'pointer',
            borderRadius: 0,
            transition: 'color 0.2s, border-color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = WHITE; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = GRAY; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
        >
          Reset
        </button>
      </div>

      {/* Bell preview */}
      <button
        onClick={playBell}
        style={{
          marginTop: '2rem',
          background: 'transparent',
          color: GRAY,
          border: 'none',
          fontFamily: FONT,
          fontSize: '0.75rem',
          fontWeight: 500,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          zIndex: 1,
          opacity: 0.5,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
      >
        ▶ Preview Gong
      </button>

      {/* Bottom red line */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${RED}, transparent)`,
      }} />
    </div>
  );
}
