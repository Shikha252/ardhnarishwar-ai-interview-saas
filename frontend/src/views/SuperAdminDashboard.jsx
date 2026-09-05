import React, { useState, useEffect } from 'react';
import {
  Building2, Users, Brain, Video, Shield, Database, Plus, RefreshCw,
  CheckCircle2, AlertCircle, Sliders, FileText, Lock, Globe, Server, Activity
} from 'lucide-react';
import InterviewPlayerModal from '../components/InterviewPlayerModal';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [datasets, setDatasets] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('companies');
  
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(null);

  // Modals
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    domain: '',
    plan: 'Growth',
    candidateQuota: 60,
    maxJobs: 10,
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    category: 'Technical',
    difficulty: 'Senior',
    questionText: '',
    goldAnswer: '',
    requiredKeywords: '',
    timeLimitSeconds: 120
  });

  // Video playback modal
  const [selectedRecording, setSelectedRecording] = useState(null);

  const fetchAllData = async () => {
    try {
      // Fetch overview
      const overviewRes = await fetch('/api/superadmin/overview', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setStats(data.platformStats);
        setCompanies(data.companies || []);
      }

      // Fetch AI Datasets
      const aiRes = await fetch('/api/superadmin/ai/datasets', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (aiRes.ok) setDatasets(await aiRes.json());

      // Fetch Questions
      const qRes = await fetch('/api/superadmin/questions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (qRes.ok) setQuestions(await qRes.json());

      // Fetch Recordings
      const recRes = await fetch('/api/superadmin/recordings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (recRes.ok) setRecordings(await recRes.json());

      // Fetch Audit Logs
      const auditRes = await fetch('/api/superadmin/audit-logs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (auditRes.ok) setAuditLogs(await auditRes.json());

    } catch (err) {
      console.error('Error loading SuperAdmin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRetrain = async () => {
    setRetraining(true);
    setRetrainSuccess(null);
    try {
      const res = await fetch('/api/superadmin/ai/retrain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setRetrainSuccess(`Model re-indexed! Vocabulary: ${data.vocabularySize} tokens`);
        fetchAllData();
      }
    } catch (err) {
      console.error('Retraining failed:', err);
    } finally {
      setRetraining(false);
    }
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/superadmin/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(newCompany)
      });
      if (res.ok) {
        setShowAddCompany(false);
        setNewCompany({
          name: '', domain: '', plan: 'Growth', candidateQuota: 60,
          maxJobs: 10, adminName: '', adminEmail: '', adminPassword: ''
        });
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to create company:', err);
    }
  };

  const handleToggleCompanyStatus = async (compId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch(`/api/superadmin/companies/${compId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      fetchAllData();
    } catch (err) {
      console.error('Failed to update company status:', err);
    }
  };

  const handleCreateQuestion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newQuestion,
        requiredKeywords: newQuestion.requiredKeywords.split(',').map(k => k.trim()).filter(Boolean)
      };
      const res = await fetch('/api/superadmin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddQuestion(false);
        setNewQuestion({ category: 'Technical', difficulty: 'Senior', questionText: '', goldAnswer: '', requiredKeywords: '', timeLimitSeconds: 120 });
        fetchAllData();
      }
    } catch (err) {
      console.error('Failed to create question:', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Platform Owner Header Banner */}
      <div className="glass-panel glow-box" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span className="badge badge-purple">Super Admin Console</span>
            <span className="badge badge-cyan">Multi-Tenant Root</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>Ardhnarishwar Global SaaS Operations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Enterprise AI Interview Infrastructure &bull; Independent In-House NLP Engine (Zero External AI API Dependency)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            color: '#34d399'
          }}>
            <Activity size={14} className="rec-pulse" />
            AI Model Engine: Online & Calibrated
          </div>
          <button className="btn btn-primary" onClick={() => setShowAddCompany(true)}>
            <Plus size={16} /> Onboard New Company
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Subscribed Companies</span>
            <Building2 size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.totalCompanies || 2}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{stats?.activeCompanies || 2} Active Accounts</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Candidates Screened</span>
            <Users size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.totalCandidates || 4}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Across all tenant jobs</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Interviews Conducted</span>
            <Brain size={18} color="var(--accent-purple)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.completedInterviews || 3}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Evaluated by internal AI</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Average Candidate Score</span>
            <Activity size={18} color="var(--accent-emerald)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#10b981' }}>{stats?.averageAIScore || 81}%</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>9-metric composite avg</div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Recordings Stored</span>
            <Video size={18} color="var(--accent-rose)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{stats?.totalRecordings || 2}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Chapter-indexed WebM</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
        {[
          { id: 'companies', label: 'Company Tenants', icon: Building2 },
          { id: 'ai-studio', label: 'Internal AI Studio & Retraining', icon: Brain },
          { id: 'questions', label: 'Global Question Bank', icon: Database },
          { id: 'recordings', label: 'Global Recordings', icon: Video },
          { id: 'audit', label: 'Platform Audit Logs', icon: Shield }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="btn"
              style={{
                background: isActive ? 'var(--bg-surface)' : 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                borderBottom: isActive ? '2px solid var(--primary)' : 'none',
                borderRadius: 'var(--radius-md) var(--radius-md) 0 0'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPANIES DIRECTORY */}
      {activeTab === 'companies' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Subscribed Company Tenants</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Multi-tenant accounts with isolated databases, candidates, and interview configurations.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddCompany(true)}>
              <Plus size={16} /> Add Company
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Subscription Tier</th>
                  <th>Candidate Quota</th>
                  <th>Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(comp => (
                  <tr key={comp.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{comp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{comp.domain || 'domain.com'}</div>
                    </td>
                    <td>
                      <span className={`badge ${comp.plan === 'Enterprise' ? 'badge-purple' : 'badge-cyan'}`}>
                        {comp.plan}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                        {comp.candidatesUsed || 0} / {comp.candidateQuota} Used
                      </div>
                      <div style={{ width: '120px', height: '5px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginTop: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${Math.min(100, ((comp.candidatesUsed || 0) / comp.candidateQuota) * 100)}%`,
                          height: '100%',
                          background: 'var(--primary)'
                        }} />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${comp.status === 'active' ? 'badge-emerald' : 'badge-rose'}`}>
                        {comp.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(comp.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        onClick={() => handleToggleCompanyStatus(comp.id, comp.status)}
                      >
                        {comp.status === 'active' ? 'Suspend Account' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INTERNAL AI STUDIO */}
      {activeTab === 'ai-studio' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Engine Banner */}
          <div className="glass-panel" style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(30,41,59,0.5) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span className="badge badge-emerald">Internal Model Active</span>
                  <span className="badge badge-blue">Zero External API Keys</span>
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>Ardhnarishwar In-House NLP Engine v{datasets?.version || '1.4.0'}</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Curated TF-IDF vector matrix &bull; STAR behavioral heuristic models &bull; Technical ontology rubric matcher
                </p>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Last Retrained & Calibrated: <strong>{datasets?.lastRetrained ? new Date(datasets.lastRetrained).toLocaleString() : 'Just now'}</strong>
                </div>
              </div>

              <div>
                <button
                  className="btn btn-primary"
                  disabled={retraining}
                  onClick={handleRetrain}
                  style={{ minWidth: '180px' }}
                >
                  <RefreshCw size={16} className={retraining ? 'audio-bar-anim' : ''} />
                  {retraining ? 'Re-Indexing Engine...' : 'Retrain & Reindex Model'}
                </button>
                {retrainSuccess && (
                  <div style={{ color: '#34d399', fontSize: '0.75rem', marginTop: '6px', textAlign: 'right' }}>
                    ✓ {retrainSuccess}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Model Weights Tuner */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Sliders size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700' }}>Dynamic Rubric Evaluation Weights</h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Configure how the internal AI scores candidates across the 8 primary competency pillars.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {[
                { key: 'relevance', label: 'Answer Relevance', weight: '20%' },
                { key: 'technicalCompetency', label: 'Technical Competency', weight: '25%' },
                { key: 'knowledge', label: 'Knowledge Depth', weight: '15%' },
                { key: 'problemSolving', label: 'Problem Solving (STAR)', weight: '15%' },
                { key: 'communication', label: 'Communication & Fluency', weight: '10%' },
                { key: 'confidence', label: 'Confidence Indicators', weight: '5%' },
                { key: 'completeness', label: 'Completeness', weight: '5%' },
                { key: 'roleSpecific', label: 'Role Alignment', weight: '5%' }
              ].map(w => (
                <div key={w.key} style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: '600' }}>{w.label}</span>
                    <strong style={{ color: 'var(--primary)' }}>{w.weight}</strong>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: w.weight, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Benchmark Datasets & Gold Answers */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '14px' }}>
              Training Corpus & Benchmark Answers ({datasets?.benchmarks?.length || 3} Ground Truths)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(datasets?.benchmarks || []).map((bm, i) => (
                <div key={i} style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span className="badge badge-blue">{bm.category}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Benchmark ID: {bm.id}</span>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                    {bm.questionPattern}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: 'var(--radius-sm)', marginBottom: '8px' }}>
                    <strong>Gold Standard Answer:</strong> "{bm.goldAnswer}"
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {(bm.criticalKeywords || []).map((k, idx) => (
                      <span key={idx} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL QUESTION BANK */}
      {activeTab === 'questions' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Master Interview Question Bank</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Curated technical, behavioral, and HR questions available across all tenant companies.
              </p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowAddQuestion(true)}>
              <Plus size={16} /> Add Global Question
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {questions.map((q, idx) => (
              <div key={idx} style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="badge badge-blue">{q.category}</span>
                    <span className="badge badge-purple">{q.difficulty}</span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Time Limit: {q.timeLimitSeconds}s
                  </span>
                </div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>
                  {q.questionText}
                </h4>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  <strong>Rubric Gold Standard:</strong> {q.goldAnswer}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(q.requiredKeywords || []).map((kw, i) => (
                    <span key={i} className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>
                      Key: {kw}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: GLOBAL RECORDINGS */}
      {activeTab === 'recordings' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>Cross-Company Interview Recordings</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Encrypted candidate video sessions tagged with synchronized question timestamps.
          </p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Company Tenant</th>
                  <th>Duration</th>
                  <th>AI Score</th>
                  <th>Recorded Date</th>
                  <th>Player</th>
                </tr>
              </thead>
              <tbody>
                {recordings.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{rec.candidateName || 'Candidate'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Session: {rec.interviewId}</div>
                    </td>
                    <td>{rec.companyName || 'Apex FinTech'}</td>
                    <td>{Math.floor(rec.duration / 60)}m {rec.duration % 60}s</td>
                    <td>
                      <span className="badge badge-emerald" style={{ fontSize: '0.75rem' }}>
                        {rec.overallScore || 88}%
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(rec.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                        onClick={() => setSelectedRecording(rec)}
                      >
                        <Video size={14} /> Playback Video
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '8px' }}>System Activity & Audit Trail</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Tamper-evident log of administrative actions, company creations, candidate invitations, and AI scoring events.
          </p>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Role</th>
                  <th>Action Event</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: '600', color: '#fff' }}>{log.actorName}</td>
                    <td>
                      <span className={`badge ${log.role === 'SUPER_ADMIN' ? 'badge-purple' : log.role === 'COMPANY_ADMIN' ? 'badge-blue' : 'badge-emerald'}`} style={{ fontSize: '0.65rem' }}>
                        {log.role}
                      </span>
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--accent-cyan)' }}>{log.action}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Add Company */}
      {showAddCompany && (
        <div className="modal-backdrop" onClick={() => setShowAddCompany(false)}>
          <div className="modal-card" style={{ padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px' }}>Onboard New Client Company</h3>
            <form onSubmit={handleCreateCompany}>
              <div className="form-group">
                <label className="form-label">Company Legal Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g., Quantum Dynamics Corp"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Domain</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="quantum.io"
                    value={newCompany.domain}
                    onChange={(e) => setNewCompany({ ...newCompany, domain: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subscription Plan</label>
                  <select
                    className="form-select"
                    value={newCompany.plan}
                    onChange={(e) => setNewCompany({ ...newCompany, plan: e.target.value })}
                  >
                    <option value="Enterprise">Enterprise (Unlimited)</option>
                    <option value="Growth">Growth (60 Candidates)</option>
                    <option value="Starter">Starter (20 Candidates)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Initial Candidate Quota</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newCompany.candidateQuota}
                    onChange={(e) => setNewCompany({ ...newCompany, candidateQuota: parseInt(e.target.value) })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Job Positions</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newCompany.maxJobs}
                    onChange={(e) => setNewCompany({ ...newCompany, maxJobs: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '10px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '10px', color: 'var(--text-secondary)' }}>
                  Initial Company Admin Account
                </div>
                <div className="form-group">
                  <label className="form-label">Admin Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Jane Doe"
                    value={newCompany.adminName}
                    onChange={(e) => setNewCompany({ ...newCompany, adminName: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Admin Email</label>
                    <input
                      type="email"
                      required
                      className="form-input"
                      placeholder="admin@company.com"
                      value={newCompany.adminEmail}
                      onChange={(e) => setNewCompany({ ...newCompany, adminEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Initial Password</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Min 8 characters"
                      value={newCompany.adminPassword}
                      onChange={(e) => setNewCompany({ ...newCompany, adminPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddCompany(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Company Tenant
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Global Question */}
      {showAddQuestion && (
        <div className="modal-backdrop" onClick={() => setShowAddQuestion(false)}>
          <div className="modal-card" style={{ padding: '28px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px' }}>Add Question to Global Bank</h3>
            <form onSubmit={handleCreateQuestion}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newQuestion.category}
                    onChange={(e) => setNewQuestion({ ...newQuestion, category: e.target.value })}
                  >
                    <option value="Technical">Technical</option>
                    <option value="Behavioral">Behavioral (STAR)</option>
                    <option value="HR">HR & Cultural</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target Difficulty</label>
                  <select
                    className="form-select"
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}
                  >
                    <option value="Entry">Entry Level</option>
                    <option value="Mid">Mid Level</option>
                    <option value="Senior">Senior / Lead</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Question Text Prompt</label>
                <textarea
                  required
                  rows={2}
                  className="form-textarea"
                  placeholder="e.g., Explain how you optimize an N+1 query problem in a high-concurrency relational database."
                  value={newQuestion.questionText}
                  onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Rubric Gold Answer (Ground Truth)</label>
                <textarea
                  required
                  rows={3}
                  className="form-textarea"
                  placeholder="Expected response concepts, architectural trade-offs, and terminology."
                  value={newQuestion.goldAnswer}
                  onChange={(e) => setNewQuestion({ ...newQuestion, goldAnswer: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Required Rubric Keywords (Comma Separated)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., eager loading, joins, batching, n+1, latency"
                  value={newQuestion.requiredKeywords}
                  onChange={(e) => setNewQuestion({ ...newQuestion, requiredKeywords: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddQuestion(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Global Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {selectedRecording && (
        <InterviewPlayerModal
          isOpen={!!selectedRecording}
          onClose={() => setSelectedRecording(null)}
          candidate={{ name: selectedRecording.candidateName }}
          interview={{ id: selectedRecording.interviewId, overallScore: selectedRecording.overallScore }}
          recording={selectedRecording}
        />
      )}
    </div>
  );
}
