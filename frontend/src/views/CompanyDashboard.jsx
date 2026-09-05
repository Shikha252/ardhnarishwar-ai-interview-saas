import React, { useState, useEffect } from 'react';
import {
  Briefcase, Users, CheckCircle, XCircle, Clock, Video, Link, Copy,
  Plus, ExternalLink, FileText, ArrowLeft, Search, Filter, ShieldCheck, ChevronRight
} from 'lucide-react';
import EvaluationScorecard from '../components/EvaluationScorecard';
import InterviewPlayerModal from '../components/InterviewPlayerModal';
import ReportModal from '../components/ReportModal';

export default function CompanyDashboard({ currentCompanyId = 'comp-apex', onSwitchCompany, onLaunchCandidate }) {
  const [overview, setOverview] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [activeTab, setActiveTab] = useState('candidates');
  const [loading, setLoading] = useState(true);
  
  // Selected candidate review
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [selectedRecording, setSelectedRecording] = useState(null);

  // Modals
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newCandidate, setNewCandidate] = useState({ name: '', email: '', phone: '', jobId: '' });
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '', department: 'Engineering', experienceLevel: 'Mid-Senior',
    skillsRequired: '', description: '', passThreshold: 75
  });

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(null);

  const fetchCompanyData = async (tenantId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/company/overview?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }

      const jobsRes = await fetch(`/api/company/jobs?tenantId=${tenantId}`);
      if (jobsRes.ok) setJobs(await jobsRes.json());

      const candRes = await fetch(`/api/company/candidates?tenantId=${tenantId}`);
      if (candRes.ok) setCandidates(await candRes.json());

    } catch (err) {
      console.error('Error fetching company data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData(currentCompanyId);
  }, [currentCompanyId]);

  const handleSelectCandidate = async (cand) => {
    setSelectedCandidate(cand);
    try {
      if (cand.interviewId) {
        const res = await fetch(`/api/company/interviews/${cand.interviewId}`);
        if (res.ok) {
          const data = await res.json();
          setSelectedInterview(data.interview);
          setSelectedRecording(data.recording);
        }
      } else {
        setSelectedInterview(null);
        setSelectedRecording(null);
      }
    } catch (err) {
      console.error('Error loading interview details:', err);
    }
  };

  const handleDecision = async (candId, decision, notes) => {
    try {
      const res = await fetch(`/api/company/candidates/${candId}/decision`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decision, notes })
      });
      if (res.ok) {
        const updated = await res.json();
        setCandidates(prev => prev.map(c => c.id === candId ? { ...c, status: decision, recruiterNotes: notes } : c));
        if (selectedCandidate) {
          setSelectedCandidate({ ...selectedCandidate, status: decision, recruiterNotes: notes });
        }
      }
    } catch (err) {
      console.error('Failed to submit candidate decision:', err);
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/company/candidates?tenantId=${currentCompanyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCandidate)
      });
      if (res.ok) {
        setShowInviteModal(false);
        setNewCandidate({ name: '', email: '', phone: '', jobId: '' });
        fetchCompanyData(currentCompanyId);
      }
    } catch (err) {
      console.error('Error inviting candidate:', err);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/company/jobs?tenantId=${currentCompanyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob)
      });
      if (res.ok) {
        setShowCreateJob(false);
        setNewJob({ title: '', department: 'Engineering', experienceLevel: 'Mid-Senior', skillsRequired: '', description: '', passThreshold: 75 });
        fetchCompanyData(currentCompanyId);
      }
    } catch (err) {
      console.error('Error creating job:', err);
    }
  };

  const copyInviteLink = (token) => {
    const url = `${window.location.origin}/?invite=${token}`;
    navigator.clipboard.writeText(url);
    setCopySuccess(token);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const company = overview?.company;
  const stats = overview?.stats;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Company Header & Tenant Switcher */}
      <div className="glass-panel glow-box" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span className="badge badge-blue">Isolated Company Tenant</span>
            <span className="badge badge-emerald">{company?.plan || 'Enterprise'} Plan</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
            {company?.name || 'Apex Global FinTech'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Candidate AI Interview Workspace &bull; Domain: {company?.domain || 'apexfintech.com'}
          </p>
        </div>

        {/* Company Quick-Switcher Demo Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Workspace Switcher:</span>
          <button
            className={`btn ${currentCompanyId.includes('apex') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => onSwitchCompany && onSwitchCompany('apex')}
          >
            Apex Global FinTech
          </button>
          <button
            className={`btn ${currentCompanyId.includes('nova') ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
            onClick={() => onSwitchCompany && onSwitchCompany('novatech')}
          >
            NovaTech Cloud Systems
          </button>
          <button className="btn btn-accent" onClick={() => setShowInviteModal(true)}>
            <Plus size={16} /> Invite Candidate
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            <span>Active Openings</span>
            <Briefcase size={16} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.activeJobs || 2}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Interview pipelines open</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            <span>Total Candidates</span>
            <Users size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.totalCandidates || 3}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Screened via platform</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            <span>Interviews Completed</span>
            <Clock size={16} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.completedInterviews || 2}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Full AI scorecards generated</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            <span>Shortlisted</span>
            <CheckCircle size={16} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981' }}>{stats?.shortlistedCount || 1}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Advancing to final round</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '8px' }}>
            <span>Average AI Score</span>
            <ShieldCheck size={16} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)' }}>{stats?.avgCandidateScore || 86}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Role competency benchmark</div>
        </div>
      </div>

      {/* View Details / Back Bar if candidate selected */}
      {selectedCandidate ? (
        <div>
          <button
            className="btn btn-secondary"
            onClick={() => setSelectedCandidate(null)}
            style={{ marginBottom: '16px' }}
          >
            <ArrowLeft size={16} /> Back to Candidates Roster
          </button>

          {/* If Candidate has completed interview, show full AI scorecard & Video playback button */}
          {selectedInterview ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {selectedRecording && (
                <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ padding: '10px', background: 'var(--primary)', borderRadius: 'var(--radius-sm)' }}>
                      <Video size={20} color="#fff" />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '700' }}>Candidate Video Recording Available</h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Synchronized question chapters &bull; Duration: {Math.floor((selectedRecording.duration || 360) / 60)}m {(selectedRecording.duration || 360) % 60}s
                      </p>
                    </div>
                  </div>
                  <button className="btn btn-primary" onClick={() => setShowVideoModal(true)}>
                    <Video size={16} /> Play Interview Recording
                  </button>
                </div>
              )}

              <EvaluationScorecard
                candidate={selectedCandidate}
                interview={selectedInterview}
                onDecision={handleDecision}
                onOpenReport={() => setShowReportModal(true)}
              />
            </div>
          ) : (
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
              <Clock size={40} color="var(--accent-amber)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '6px' }}>Interview Pending Completion</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 20px' }}>
                Candidate has not yet submitted their responses. You can share their interview link or launch the interview directly.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => onLaunchCandidate && onLaunchCandidate(selectedCandidate.inviteToken)}
                >
                  <ExternalLink size={16} /> Launch Candidate Interview Portal
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => copyInviteLink(selectedCandidate.inviteToken)}
                >
                  <Copy size={16} /> Copy Magic Invite URL
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Tabs: Candidates vs Job Openings */
        <div>
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '20px' }}>
            <button
              className="btn"
              onClick={() => setActiveTab('candidates')}
              style={{
                background: activeTab === 'candidates' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'candidates' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'candidates' ? '2px solid var(--primary)' : 'none'
              }}
            >
              <Users size={16} /> Candidate Roster ({candidates.length})
            </button>
            <button
              className="btn"
              onClick={() => setActiveTab('jobs')}
              style={{
                background: activeTab === 'jobs' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'jobs' ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'jobs' ? '2px solid var(--primary)' : 'none'
              }}
            >
              <Briefcase size={16} /> Job Positions ({jobs.length})
            </button>
          </div>

          {/* TAB 1: CANDIDATES ROSTER */}
          {activeTab === 'candidates' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Candidate Pipeline</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Track invitations, live status, AI evaluation scorecards, and recordings.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
                  <Plus size={16} /> Invite Candidate
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate Name</th>
                      <th>Job Role</th>
                      <th>Status</th>
                      <th>AI Score</th>
                      <th>AI Verdict</th>
                      <th>Invite Link</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(cand => (
                      <tr key={cand.id}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{cand.name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cand.email}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{cand.jobTitle || 'Senior Engineer'}</td>
                        <td>
                          <span className={`badge ${
                            cand.status === 'SHORTLISTED' ? 'badge-emerald' :
                            cand.status === 'COMPLETED' ? 'badge-blue' :
                            cand.status === 'REJECTED' ? 'badge-rose' : 'badge-amber'
                          }`} style={{ fontSize: '0.7rem' }}>
                            {cand.status}
                          </span>
                        </td>
                        <td>
                          {cand.overallScore !== undefined && cand.overallScore !== null ? (
                            <strong style={{ fontSize: '1rem', color: cand.overallScore >= 75 ? '#10b981' : '#3b82f6' }}>
                              {cand.overallScore}%
                            </strong>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending</span>
                          )}
                        </td>
                        <td>
                          {cand.aiRecommendation ? (
                            <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                              {cand.aiRecommendation}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not evaluated</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              className="btn btn-ghost"
                              title="Copy Candidate Magic Link"
                              style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                              onClick={() => copyInviteLink(cand.inviteToken)}
                            >
                              <Copy size={14} />
                              {copySuccess === cand.inviteToken ? 'Copied!' : 'Copy Link'}
                            </button>
                            <button
                              className="btn btn-secondary"
                              title="Launch Candidate Interview Room"
                              style={{ padding: '6px 8px', fontSize: '0.75rem' }}
                              onClick={() => onLaunchCandidate && onLaunchCandidate(cand.inviteToken)}
                            >
                              <ExternalLink size={14} /> Launch
                            </button>
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            onClick={() => handleSelectCandidate(cand)}
                          >
                            Review Scorecard <ChevronRight size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: JOB OPENINGS */}
          {activeTab === 'jobs' && (
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Active Job Openings</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Configure skill requirements, pass thresholds, and interview question sets.
                  </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreateJob(true)}>
                  <Plus size={16} /> Create Position
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                {jobs.map(job => (
                  <div
                    key={job.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      padding: '20px',
                      borderRadius: 'var(--radius-md)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-cyan">{job.department}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.experienceLevel}</span>
                    </div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>
                      {job.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                      {job.description || 'Design high performance scalable systems and lead architecture.'}
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '16px' }}>
                      {(job.skillsRequired || []).map((skill, i) => (
                        <span key={i} className="badge badge-blue" style={{ fontSize: '0.65rem' }}>
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <span>Threshold: <strong style={{ color: '#10b981' }}>{job.passThreshold}%</strong></span>
                      <span>Candidates: <strong style={{ color: '#fff' }}>{job.candidatesCount || 0}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Invite Candidate */}
      {showInviteModal && (
        <div className="modal-backdrop" onClick={() => setShowInviteModal(false)}>
          <div className="modal-card" style={{ padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px' }}>Generate Candidate Interview Invitation</h3>
            <form onSubmit={handleCreateCandidate}>
              <div className="form-group">
                <label className="form-label">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g., Rohit Malhotra"
                  value={newCandidate.name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  placeholder="candidate@gmail.com"
                  value={newCandidate.email}
                  onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Job Position</label>
                <select
                  required
                  className="form-select"
                  value={newCandidate.jobId}
                  onChange={(e) => setNewCandidate({ ...newCandidate, jobId: e.target.value })}
                >
                  <option value="">Select an active opening</option>
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Generate Invitation & Magic Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create Job */}
      {showCreateJob && (
        <div className="modal-backdrop" onClick={() => setShowCreateJob(false)}>
          <div className="modal-card" style={{ padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px' }}>Create Job Position</h3>
            <form onSubmit={handleCreateJob}>
              <div className="form-group">
                <label className="form-label">Job Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g., Lead Site Reliability Engineer"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Experience Level</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newJob.experienceLevel}
                    onChange={(e) => setNewJob({ ...newJob, experienceLevel: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Kubernetes, Go, Kafka, Chaos Engineering"
                  value={newJob.skillsRequired}
                  onChange={(e) => setNewJob({ ...newJob, skillsRequired: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Passing AI Score Threshold (%)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newJob.passThreshold}
                  onChange={(e) => setNewJob({ ...newJob, passThreshold: parseInt(e.target.value) })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateJob(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Publish Position
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {showVideoModal && selectedRecording && (
        <InterviewPlayerModal
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
          candidate={selectedCandidate}
          interview={selectedInterview}
          recording={selectedRecording}
        />
      )}

      {/* Printable Report Modal */}
      {showReportModal && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          candidate={selectedCandidate}
          interview={selectedInterview}
          company={company}
        />
      )}
    </div>
  );
}
