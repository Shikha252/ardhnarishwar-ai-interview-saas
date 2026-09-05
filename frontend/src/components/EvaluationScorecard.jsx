import React, { useState } from 'react';
import { Award, CheckCircle, AlertTriangle, MessageSquare, Briefcase, ThumbsUp, HelpCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import RadarChart from './RadarChart';

export default function EvaluationScorecard({
  candidate,
  interview,
  onDecision,
  onOpenReport
}) {
  const [expandedQ, setExpandedQ] = useState(null);
  const [notes, setNotes] = useState(candidate?.recruiterNotes || '');
  const [isSaving, setIsSaving] = useState(false);

  const report = interview?.evaluationReport || {};
  const overallScore = interview?.overallScore || report.overallScore || 0;
  const recommendation = interview?.aiRecommendation || report.recommendation || 'Pending Evaluation';
  const metrics = report.metricsRadar || {};
  const questions = report.questions || [];

  const handleAction = async (decision) => {
    setIsSaving(true);
    if (onDecision) {
      await onDecision(candidate.id, decision, notes);
    }
    setIsSaving(false);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 65) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#f43f5e';
  };

  const metricLabels = [
    { key: 'relevance', label: 'Answer Relevance', desc: 'Semantic alignment with gold response' },
    { key: 'technicalCompetency', label: 'Technical Competency', desc: 'Accuracy & breadth of technical skills' },
    { key: 'knowledge', label: 'Knowledge Depth', desc: 'Core concept mastery and foundations' },
    { key: 'problemSolving', label: 'Problem Solving', desc: 'Structured analytical reasoning & trade-offs' },
    { key: 'communication', label: 'Communication', desc: 'Fluency, sentence clarity & vocabulary variety' },
    { key: 'confidence', label: 'Confidence Indicators', desc: 'Verbal composure & minimal filler usage' },
    { key: 'completeness', label: 'Completeness', desc: 'Thoroughness and elaboration quality' },
    { key: 'roleSpecific', label: 'Role Alignment', desc: 'Direct fit for job position competencies' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header Card */}
      <div className="glass-panel" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${getScoreColor(overallScore)}22 0%, #0f172a 80%)`,
            border: `3px solid ${getScoreColor(overallScore)}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 0 20px ${getScoreColor(overallScore)}40`
          }}>
            <span style={{ fontSize: '1.75rem', fontWeight: '800', lineHeight: 1, color: '#fff' }}>
              {overallScore}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              / 100
            </span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>{candidate?.name}</h2>
              <span className={`badge ${overallScore >= 75 ? 'badge-emerald' : overallScore >= 60 ? 'badge-blue' : 'badge-rose'}`}>
                {recommendation}
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Applied for: <strong style={{ color: 'var(--text-primary)' }}>{candidate?.jobTitle || 'Software Engineer'}</strong> &bull; {candidate?.email}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {onOpenReport && (
            <button className="btn btn-secondary" onClick={onOpenReport}>
              <FileText size={16} /> Export PDF Report
            </button>
          )}
          <button
            className="btn btn-emerald"
            disabled={isSaving}
            onClick={() => handleAction('SHORTLISTED')}
          >
            <CheckCircle size={16} /> Shortlist Candidate
          </button>
          <button
            className="btn btn-rose"
            disabled={isSaving}
            onClick={() => handleAction('REJECTED')}
          >
            Reject
          </button>
        </div>
      </div>

      {/* Grid: Radar Chart + 8 Competency Bars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Radar Card */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '4px', alignSelf: 'flex-start' }}>AI Competency Radar</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', alignSelf: 'flex-start', marginBottom: '16px' }}>
            Multi-dimensional internal rubric analysis across 8 core skill pillars
          </p>
          <RadarChart metrics={metrics} width={340} height={300} />
        </div>

        {/* Breakdown Metric Bars */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>Detailed Evaluation Areas</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {metricLabels.map(m => {
              const val = metrics[m.key] !== undefined ? metrics[m.key] : 70;
              const barColor = getScoreColor(val);
              return (
                <div key={m.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '500' }}>{m.label}</span>
                    <span style={{ fontWeight: '700', color: barColor }}>{val}%</span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${val}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
                      borderRadius: '4px',
                      transition: 'width 0.8s ease-in-out'
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question-Wise Performance Breakdown */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Question-Wise Assessment & Rubrics</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {questions.length} Questions Evaluated
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {questions.map((q, idx) => {
            const isExpanded = expandedQ === idx;
            const qScore = q.overallQuestionScore || 75;
            const details = q.details || {};

            return (
              <div
                key={idx}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden'
                }}
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedQ(isExpanded ? null : idx)}
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: isExpanded ? 'rgba(255, 255, 255, 0.03)' : 'transparent'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <span style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'rgba(59, 130, 246, 0.15)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '0.85rem'
                    }}>
                      {idx + 1}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{q.category || 'Technical'}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          {q.questionText}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Clarity: <strong style={{ color: 'var(--text-secondary)' }}>{details.clarityLevel || 'Strong'}</strong> &bull; Confidence: <strong style={{ color: 'var(--text-secondary)' }}>{details.confidenceLevel || 'High'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      color: getScoreColor(qScore)
                    }}>
                      {qScore}%
                    </span>
                    {isExpanded ? <ChevronUp size={18} color="var(--text-muted)" /> : <ChevronDown size={18} color="var(--text-muted)" />}
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border-subtle)', background: 'rgba(0, 0, 0, 0.2)' }}>
                    {/* Rubric Keywords Detected */}
                    <div style={{ marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: '600', display: 'block', marginBottom: '6px' }}>
                        Detected Concepts & Key Terminology:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {(details.matchedKeywords || []).map((kw, i) => (
                          <span key={i} className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                            ✓ {kw}
                          </span>
                        ))}
                        {(details.missingKeywords || []).map((kw, i) => (
                          <span key={i} className="badge badge-rose" style={{ fontSize: '0.7rem' }}>
                            ✕ Missing: {kw}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Strengths & Improvements */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontWeight: '600', fontSize: '0.8rem', marginBottom: '6px' }}>
                          <ThumbsUp size={14} /> AI Identified Strengths
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {(details.strengths || ['Demonstrated clear familiarity with core concepts.']).map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div style={{ background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fb7185', fontWeight: '600', fontSize: '0.8rem', marginBottom: '6px' }}>
                          <AlertTriangle size={14} /> Recommended Growth Areas
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {(details.improvements || ['No major flags detected.']).map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recruiter Review Notes */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>Recruiter Assessment Notes</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '12px' }}>
          Internal feedback and notes visible only to company administrators and hiring managers.
        </p>
        <textarea
          className="form-textarea"
          rows={3}
          style={{ width: '100%', marginBottom: '12px' }}
          placeholder="Enter comments on candidate communication, culture fit, or technical follow-up questions..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={isSaving}
          onClick={() => handleAction(candidate?.status || 'SHORTLISTED')}
        >
          Save Assessment Notes
        </button>
      </div>
    </div>
  );
}
