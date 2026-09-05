// Multi-Tenant In-Memory & JSON-Backed Relational Store
// Strict scoping by tenantId for complete company data isolation

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const DB_FILE = path.join(__dirname, 'saas-store.json');

class MultiTenantDatabase {
  constructor() {
    this.data = {
      companies: [],
      users: [],
      jobs: [],
      interviewConfigs: [],
      questionBank: [],
      candidates: [],
      interviews: [],
      interviewAnswers: [],
      recordings: [],
      auditLogs: []
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      }
    } catch (err) {
      console.error('Failed to load database file, using clean state:', err);
    }
  }

  persist() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  // AUDIT LOGGING HELPER
  logAudit(tenantId, actorName, role, action, details) {
    const log = {
      id: 'audit-' + uuidv4().slice(0, 8),
      tenantId: tenantId || 'GLOBAL',
      actorName: actorName || 'System',
      role: role || 'SUPER_ADMIN',
      action,
      details,
      timestamp: new Date().toISOString()
    };
    this.data.auditLogs.unshift(log);
    if (this.data.auditLogs.length > 500) this.data.auditLogs.pop();
    this.persist();
    return log;
  }

  // --- COMPANIES ---
  getCompanies() {
    return this.data.companies;
  }

  getCompanyById(id) {
    return this.data.companies.find(c => c.id === id);
  }

  createCompany(companyData) {
    const newCompany = {
      id: 'comp-' + uuidv4().slice(0, 8),
      name: companyData.name,
      domain: companyData.domain || '',
      plan: companyData.plan || 'Growth',
      status: companyData.status || 'active',
      candidateQuota: companyData.candidateQuota || 50,
      candidatesUsed: 0,
      maxJobs: companyData.maxJobs || 10,
      createdAt: new Date().toISOString()
    };
    this.data.companies.push(newCompany);
    this.persist();
    return newCompany;
  }

  updateCompany(id, updates) {
    const comp = this.getCompanyById(id);
    if (!comp) return null;
    Object.assign(comp, updates);
    this.persist();
    return comp;
  }

  // --- USERS ---
  getUsers(tenantId = null) {
    if (!tenantId || tenantId === 'GLOBAL') {
      return this.data.users;
    }
    return this.data.users.filter(u => u.tenantId === tenantId);
  }

  getUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  }

  getUserById(id) {
    return this.data.users.find(u => u.id === id);
  }

  createUser(userData) {
    const newUser = {
      id: 'user-' + uuidv4().slice(0, 8),
      tenantId: userData.tenantId || 'GLOBAL',
      email: userData.email.toLowerCase(),
      passwordHash: userData.passwordHash,
      role: userData.role || 'COMPANY_ADMIN',
      name: userData.name,
      companyName: userData.companyName || '',
      createdAt: new Date().toISOString()
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  // --- JOBS (Scoped by tenantId) ---
  getJobs(tenantId = null) {
    if (!tenantId || tenantId === 'GLOBAL') {
      return this.data.jobs;
    }
    return this.data.jobs.filter(j => j.tenantId === tenantId);
  }

  getJobById(id, tenantId = null) {
    return this.data.jobs.find(j => j.id === id && (!tenantId || tenantId === 'GLOBAL' || j.tenantId === tenantId));
  }

  createJob(jobData) {
    const newJob = {
      id: 'job-' + uuidv4().slice(0, 8),
      tenantId: jobData.tenantId,
      title: jobData.title,
      department: jobData.department || 'Engineering',
      experienceLevel: jobData.experienceLevel || 'Mid-Senior',
      skillsRequired: jobData.skillsRequired || [],
      description: jobData.description || '',
      passThreshold: jobData.passThreshold || 70,
      status: jobData.status || 'active',
      questionIds: jobData.questionIds || [],
      createdAt: new Date().toISOString()
    };
    this.data.jobs.push(newJob);
    this.persist();
    return newJob;
  }

  // --- QUESTION BANK ---
  getQuestions(tenantId = null, category = null) {
    return this.data.questionBank.filter(q => {
      const tenantMatch = q.isGlobal || !tenantId || tenantId === 'GLOBAL' || q.tenantId === tenantId;
      const catMatch = !category || q.category.toLowerCase() === category.toLowerCase();
      return tenantMatch && catMatch;
    });
  }

  getQuestionById(id) {
    return this.data.questionBank.find(q => q.id === id);
  }

  createQuestion(qData) {
    const newQ = {
      id: 'q-' + uuidv4().slice(0, 8),
      tenantId: qData.tenantId || 'GLOBAL',
      isGlobal: qData.isGlobal !== undefined ? qData.isGlobal : true,
      category: qData.category || 'Technical',
      difficulty: qData.difficulty || 'Mid',
      questionText: qData.questionText,
      goldAnswer: qData.goldAnswer || '',
      requiredKeywords: qData.requiredKeywords || [],
      bonusKeywords: qData.bonusKeywords || [],
      coreCompetencies: qData.coreCompetencies || [],
      timeLimitSeconds: qData.timeLimitSeconds || 120,
      createdAt: new Date().toISOString()
    };
    this.data.questionBank.push(newQ);
    this.persist();
    return newQ;
  }

  // --- CANDIDATES ---
  getCandidates(tenantId = null, jobId = null) {
    return this.data.candidates.filter(c => {
      const tMatch = !tenantId || tenantId === 'GLOBAL' || c.tenantId === tenantId;
      const jMatch = !jobId || c.jobId === jobId;
      return tMatch && jMatch;
    });
  }

  getCandidateById(id, tenantId = null) {
    return this.data.candidates.find(c => c.id === id && (!tenantId || tenantId === 'GLOBAL' || c.tenantId === tenantId));
  }

  getCandidateByToken(inviteToken) {
    return this.data.candidates.find(c => c.inviteToken === inviteToken);
  }

  createCandidate(candidateData) {
    const token = uuidv4().replace(/-/g, '').slice(0, 16);
    const newCandidate = {
      id: 'cand-' + uuidv4().slice(0, 8),
      tenantId: candidateData.tenantId,
      jobId: candidateData.jobId,
      name: candidateData.name,
      email: candidateData.email,
      phone: candidateData.phone || '',
      inviteToken: token,
      status: candidateData.status || 'INVITED',
      recruiterNotes: '',
      appliedDate: new Date().toISOString()
    };
    this.data.candidates.push(newCandidate);

    // Increment tenant candidate usage
    const comp = this.getCompanyById(candidateData.tenantId);
    if (comp) {
      comp.candidatesUsed = (comp.candidatesUsed || 0) + 1;
    }

    this.persist();
    return newCandidate;
  }

  updateCandidateStatus(id, status, notes = null) {
    const cand = this.getCandidateById(id);
    if (!cand) return null;
    cand.status = status;
    if (notes !== null) cand.recruiterNotes = notes;
    this.persist();
    return cand;
  }

  // --- INTERVIEWS ---
  getInterviews(tenantId = null) {
    return this.data.interviews.filter(i => !tenantId || tenantId === 'GLOBAL' || i.tenantId === tenantId);
  }

  getInterviewById(id, tenantId = null) {
    return this.data.interviews.find(i => i.id === id && (!tenantId || tenantId === 'GLOBAL' || i.tenantId === tenantId));
  }

  getInterviewByCandidateId(candidateId) {
    return this.data.interviews.find(i => i.candidateId === candidateId);
  }

  createInterview(interviewData) {
    const newInterview = {
      id: 'intv-' + uuidv4().slice(0, 8),
      tenantId: interviewData.tenantId,
      candidateId: interviewData.candidateId,
      jobId: interviewData.jobId,
      startedAt: new Date().toISOString(),
      completedAt: null,
      status: 'IN_PROGRESS',
      overallScore: null,
      aiRecommendation: null,
      evaluationReport: null
    };
    this.data.interviews.push(newInterview);
    this.persist();
    return newInterview;
  }

  completeInterview(id, evaluationResult) {
    const intv = this.getInterviewById(id);
    if (!intv) return null;

    intv.completedAt = new Date().toISOString();
    intv.status = 'COMPLETED';
    intv.overallScore = evaluationResult.overallScore;
    intv.aiRecommendation = evaluationResult.recommendation;
    intv.evaluationReport = evaluationResult;

    // Update candidate status
    this.updateCandidateStatus(intv.candidateId, 'COMPLETED');

    this.persist();
    return intv;
  }

  // --- RECORDINGS ---
  getRecordings(tenantId = null) {
    return this.data.recordings.filter(r => !tenantId || tenantId === 'GLOBAL' || r.tenantId === tenantId);
  }

  getRecordingByInterviewId(interviewId) {
    return this.data.recordings.find(r => r.interviewId === interviewId);
  }

  saveRecording(recData) {
    const newRec = {
      id: 'rec-' + uuidv4().slice(0, 8),
      tenantId: recData.tenantId,
      candidateId: recData.candidateId,
      interviewId: recData.interviewId,
      filePath: recData.filePath,
      duration: recData.duration || 180,
      fileSize: recData.fileSize || 5242880,
      mimeType: recData.mimeType || 'video/webm',
      questionTimestamps: recData.questionTimestamps || [],
      createdAt: new Date().toISOString()
    };
    this.data.recordings.push(newRec);
    this.persist();
    return newRec;
  }

  // --- AUDIT LOGS ---
  getAuditLogs(tenantId = null) {
    if (!tenantId || tenantId === 'GLOBAL') {
      return this.data.auditLogs;
    }
    return this.data.auditLogs.filter(a => a.tenantId === tenantId);
  }
}

const db = new MultiTenantDatabase();
module.exports = db;
