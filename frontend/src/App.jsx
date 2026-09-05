import React, { useState, useEffect } from 'react';
import {
  Brain, Building2, Users, Shield, Video, Sparkles, ChevronDown,
  ExternalLink, LogOut, CheckCircle2, AlertTriangle, Layers
} from 'lucide-react';
import SuperAdminDashboard from './views/SuperAdminDashboard';
import CompanyDashboard from './views/CompanyDashboard';
import CandidateInterviewRoom from './views/CandidateInterviewRoom';

export default function App() {
  // Current active view: 'superadmin' | 'company' | 'candidate'
  const [activeView, setActiveView] = useState('superadmin');
  const [currentCompanyId, setCurrentCompanyId] = useState('comp-apex');
  const [candidateToken, setCandidateToken] = useState('cand-demo-token');

  // Check URL query param for direct candidate invite links (e.g., /?invite=xyz)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
      setCandidateToken(invite);
      setActiveView('candidate');
    }
  }, []);

  const handleLaunchCandidate = (token) => {
    setCandidateToken(token);
    setActiveView('candidate');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Universal Top Navigation & Role Switcher Bar */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.5)'
          }}>
            <Brain size={22} color="#fff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="brand-title" style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>
                ARDHNARISHWAR
              </span>
              <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>AI SaaS</span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
              Autonomous Multi-Tenant Interview Intelligence Platform
            </p>
          </div>
        </div>

        {/* Center: Interactive Role Switcher Tabs */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            className={`btn ${activeView === 'superadmin' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 16px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('superadmin')}
          >
            <Shield size={16} /> Super Admin (Ardhnarishwar)
          </button>

          <button
            className={`btn ${activeView === 'company' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ padding: '8px 16px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('company')}
          >
            <Building2 size={16} /> Company Admin Portal
          </button>

          <button
            className={`btn ${activeView === 'candidate' ? 'btn-accent' : 'btn-ghost'}`}
            style={{ padding: '8px 16px', fontSize: '0.825rem' }}
            onClick={() => setActiveView('candidate')}
          >
            <Users size={16} /> Candidate Interview Experience
          </button>
        </div>

        {/* Right Info: Engine & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: 'var(--accent-cyan)'
          }}>
            <Sparkles size={14} />
            <span>Internal AI Engine (No External APIs)</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '24px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}>
        {activeView === 'superadmin' && <SuperAdminDashboard />}

        {activeView === 'company' && (
          <CompanyDashboard
            currentCompanyId={currentCompanyId}
            onSwitchCompany={(slug) => {
              if (slug === 'apex') setCurrentCompanyId('comp-apex');
              else if (slug === 'novatech') setCurrentCompanyId('comp-nova');
            }}
            onLaunchCandidate={handleLaunchCandidate}
          />
        )}

        {activeView === 'candidate' && (
          <CandidateInterviewRoom
            token={candidateToken}
            onExit={() => setActiveView('company')}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '16px 24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        background: 'rgba(10, 15, 26, 0.8)'
      }}>
        Ardhnarishwar AI SaaS &bull; Enterprise Multi-Tenant Architecture &bull; In-House Calibrated NLP Engine
      </footer>
    </div>
  );
}
