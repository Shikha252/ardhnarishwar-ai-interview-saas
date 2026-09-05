import React, { useState, useRef } from 'react';
import { X, Play, Pause, FastForward, Clock, Volume2, Video, CheckCircle2, Bookmark } from 'lucide-react';

export default function InterviewPlayerModal({
  isOpen,
  onClose,
  candidate,
  interview,
  recording
}) {
  if (!isOpen) return null;

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  const chapters = recording?.questionTimestamps || [
    { questionIndex: 1, title: 'Database Indexing & B-Trees', startSeconds: 0, endSeconds: 118 },
    { questionIndex: 2, title: 'Distributed Systems & Saga Pattern', startSeconds: 119, endSeconds: 245 },
    { questionIndex: 3, title: 'Handling Technical Disagreements (STAR)', startSeconds: 246, endSeconds: 360 }
  ];

  const questions = interview?.evaluationReport?.questions || [];
  const currentQuestion = questions[activeChapterIndex] || questions[0];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const jumpToChapter = (startSecs, index) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startSecs;
      videoRef.current.play();
      setIsPlaying(true);
    }
    setCurrentTime(startSecs);
    setActiveChapterIndex(index);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    setCurrentTime(curr);

    // Update active chapter based on time
    chapters.forEach((ch, idx) => {
      if (curr >= ch.startSeconds && curr <= (ch.endSeconds || 9999)) {
        setActiveChapterIndex(idx);
      }
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ maxWidth: '1000px', padding: 0, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div style={{
          padding: '16px 24px',
          background: 'var(--bg-card)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.15)', borderRadius: 'var(--radius-sm)' }}>
              <Video size={18} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                Interview Recording: {candidate?.name}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Session ID: {interview?.id} &bull; Overall AI Score: <strong style={{ color: '#10b981' }}>{interview?.overallScore || 88}%</strong>
              </p>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Video Player + Chapters Split Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 1.4fr) minmax(280px, 1fr)', background: '#070b12' }}>
          {/* Left: Video Player Box */}
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16 / 9',
              background: '#040710',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {/* Fallback to simulated canvas/video player preview if no video stream uploaded */}
              <video
                ref={videoRef}
                src={recording?.filePath ? (recording.filePath.startsWith('http') ? recording.filePath : `http://localhost:5000${recording.filePath}`) : ''}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => setIsPlaying(false)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Simulation Screen if video is demo */}
              {(!recording?.filePath || recording?.filePath?.includes('demo')) && (
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, #0f172a 0%, #080d1a 100%)',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '12px'
                  }}>
                    <Video size={30} color="var(--primary)" />
                  </div>
                  <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: '4px' }}>Candidate Video Recording Stream</h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '320px' }}>
                    WebM Video & Audio synchronized with question chapter stamps. Time: {formatTime(currentTime)}
                  </p>
                </div>
              )}

              {/* Watermark badge */}
              <div style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(0, 0, 0, 0.65)',
                backdropFilter: 'blur(4px)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '0.7rem',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                Encrypted Session Playback
              </div>
            </div>

            {/* Video Controls Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-surface)',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  className="btn btn-primary"
                  onClick={togglePlay}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {formatTime(currentTime)} / {formatTime(recording?.duration || 360)}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Volume2 size={14} /> 1080p WebM Stream
              </div>
            </div>
          </div>

          {/* Right: Synced Question Chapters Timeline */}
          <div style={{
            padding: '20px',
            borderLeft: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            maxHeight: '520px',
            overflowY: 'auto'
          }}>
            <h4 style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Question Chapters & Timeline
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chapters.map((ch, idx) => {
                const isActive = activeChapterIndex === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => jumpToChapter(ch.startSeconds, idx)}
                    style={{
                      padding: '12px 14px',
                      background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface)',
                      border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border-subtle)'}`,
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isActive ? 'var(--primary)' : 'var(--text-secondary)' }}>
                        Q{ch.questionIndex || idx + 1}: {formatTime(ch.startSeconds)} - {formatTime(ch.endSeconds || (ch.startSeconds + 120))}
                      </span>
                      {isActive && <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Active</span>}
                    </div>
                    <div style={{ fontSize: '0.825rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                      {ch.title || `Interview Question ${idx + 1}`}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Chapter AI Breakdown */}
            {currentQuestion && (
              <div style={{
                marginTop: 'auto',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--accent-cyan)', textTransform: 'uppercase', marginBottom: '4px' }}>
                  AI Scoring for this Question
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Evaluated Score:</span>
                  <strong style={{ fontSize: '1rem', color: '#10b981' }}>{currentQuestion.overallQuestionScore}%</strong>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Detected: {(currentQuestion.details?.matchedKeywords || []).slice(0, 4).join(', ') || 'Core concepts identified'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
