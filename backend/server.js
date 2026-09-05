// Ardhnarishwar AI Interview SaaS Platform - REST API Server
// Multi-Tenant Architecture with Internal AI Engine

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');

const db = require('./db/database');
const { seedDatabase } = require('./db/seed');
const { generateToken, authenticate, requireRole } = require('./middleware/auth');
const {
  evaluateQuestionAnswer,
  evaluateCompleteInterview
} = require('./ai-engine/evaluator');
const {
  loadDatasets,
  saveDatasets,
  retrainModel
} = require('./ai-engine/dataset-manager');

const app = express();
const PORT = process.env.PORT || 5000;

// Setup directories
const uploadsDir = path.join(__dirname, 'uploads', 'recordings');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage for candidate video/audio recordings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'rec-' + uniqueSuffix + path.extname(file.originalname || '.webm'));
  }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } }); // 100MB max

// Middlewares
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/recordings', express.static(uploadsDir));

// Ensure seed data is present
if (db.getCompanies().length === 0) {
  seedDatabase();
}

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  db.logAudit(user.tenantId, user.name, user.role, 'USER_LOGIN', `User ${user.email} logged in`);

  return res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      companyName: user.companyName
    }
  });
});

// Demo Fast-Switcher (for testing roles in preview without typing passwords)
app.get('/api/auth/switch-demo/:roleOrEmail', (req, res) => {
  const param = req.params.roleOrEmail;
  let targetUser = null;

  if (param === 'superadmin') {
    targetUser = db.getUsers().find(u => u.role === 'SUPER_ADMIN');
  } else if (param === 'apex') {
    targetUser = db.getUserByEmail('admin@apexfintech.com');
  } else if (param === 'novatech') {
    targetUser = db.getUserByEmail('admin@novatech.io');
  } else {
    targetUser = db.getUserByEmail(param);
  }

  if (!targetUser) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = generateToken(targetUser);
  return res.json({
    token,
    user: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      tenantId: targetUser.tenantId,
      companyName: targetUser.companyName
    }
  });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const user = db.getUserById(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let company = null;
  if (user.tenantId && user.tenantId !== 'GLOBAL') {
    company = db.getCompanyById(user.tenantId);
  }

  res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      companyName: user.companyName
    },
    company
  });
});

// ==========================================
// 2. SUPER ADMIN ROUTES (Ardhnarishwar Hub)
// ==========================================

// Super Admin Overview
app.get('/api/superadmin/overview', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const companies = db.getCompanies();
  const allCandidates = db.getCandidates('GLOBAL');
  const allInterviews = db.getInterviews('GLOBAL');
  const allRecordings = db.getRecordings('GLOBAL');
  const datasets = loadDatasets();

  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const totalInterviewsCompleted = allInterviews.filter(i => i.status === 'COMPLETED').length;

  // Average AI Score across platform
  const completedWithScores = allInterviews.filter(i => i.overallScore !== null);
  const avgScore = completedWithScores.length > 0
    ? Math.round(completedWithScores.reduce((acc, i) => acc + i.overallScore, 0) / completedWithScores.length)
    : 0;

  res.json({
    platformStats: {
      totalCompanies: companies.length,
      activeCompanies,
      totalCandidates: allCandidates.length,
      totalInterviews: allInterviews.length,
      completedInterviews: totalInterviewsCompleted,
      totalRecordings: allRecordings.length,
      averageAIScore: avgScore
    },
    aiEngineStatus: {
      version: datasets.version,
      lastRetrained: datasets.lastRetrained,
      trainingBenchmarksCount: datasets.benchmarks.length,
      weights: datasets.weights
    },
    companies
  });
});

// Manage Companies
app.get('/api/superadmin/companies', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json(db.getCompanies());
});

app.post('/api/superadmin/companies', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const { name, domain, plan, candidateQuota, maxJobs, adminName, adminEmail, adminPassword } = req.body;
  if (!name || !adminEmail) {
    return res.status(400).json({ error: 'Company name and admin email are required' });
  }

  const company = db.createCompany({ name, domain, plan, candidateQuota, maxJobs });
  
  const hash = bcrypt.hashSync(adminPassword || 'CompanyPass123!', 10);
  const adminUser = db.createUser({
    name: adminName || `${name} Admin`,
    email: adminEmail,
    passwordHash: hash,
    role: 'COMPANY_ADMIN',
    tenantId: company.id,
    companyName: company.name
  });

  db.logAudit('GLOBAL', req.user.name, 'SUPER_ADMIN', 'COMPANY_CREATED', `Created company ${company.name} and admin ${adminUser.email}`);

  res.status(201).json({ company, adminUser: { id: adminUser.id, email: adminUser.email } });
});

app.patch('/api/superadmin/companies/:id/status', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const { status } = req.body;
  const updated = db.updateCompany(req.params.id, { status });
  if (!updated) return res.status(404).json({ error: 'Company not found' });

  db.logAudit('GLOBAL', req.user.name, 'SUPER_ADMIN', 'COMPANY_STATUS_UPDATE', `Updated company ${updated.name} status to ${status}`);
  res.json(updated);
});

// AI Engine Datasets & Retraining for Super Admin
app.get('/api/superadmin/ai/datasets', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const datasets = loadDatasets();
  res.json(datasets);
});

app.post('/api/superadmin/ai/retrain', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const result = retrainModel(req.user.name);
  db.logAudit('GLOBAL', req.user.name, 'SUPER_ADMIN', 'AI_RETRAIN', `Triggered model retraining. Vocabulary: ${result.vocabularySize} tokens`);
  res.json(result);
});

app.post('/api/superadmin/ai/weights', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const { weights, thresholds } = req.body;
  const datasets = loadDatasets();
  if (weights) datasets.weights = { ...datasets.weights, ...weights };
  if (thresholds) datasets.thresholds = { ...datasets.thresholds, ...thresholds };
  saveDatasets(datasets);

  db.logAudit('GLOBAL', req.user.name, 'SUPER_ADMIN', 'AI_WEIGHTS_UPDATE', 'Updated internal AI rubric evaluation weights');
  res.json({ message: 'Weights updated successfully', datasets });
});

// Global Question Bank
app.get('/api/superadmin/questions', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json(db.getQuestions('GLOBAL'));
});

app.post('/api/superadmin/questions', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const q = db.createQuestion({ ...req.body, isGlobal: true, tenantId: 'GLOBAL' });
  db.logAudit('GLOBAL', req.user.name, 'SUPER_ADMIN', 'QUESTION_CREATED', `Added global question: ${q.questionText.slice(0, 40)}...`);
  res.status(201).json(q);
});

// Global Recordings
app.get('/api/superadmin/recordings', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  const recordings = db.getRecordings('GLOBAL').map(r => {
    const cand = db.getCandidateById(r.candidateId);
    const comp = db.getCompanyById(r.tenantId);
    const intv = db.getInterviewById(r.interviewId);
    return { ...r, candidateName: cand?.name, companyName: comp?.name, overallScore: intv?.overallScore };
  });
  res.json(recordings);
});

// Global Audit Logs
app.get('/api/superadmin/audit-logs', authenticate, requireRole(['SUPER_ADMIN']), (req, res) => {
  res.json(db.getAuditLogs('GLOBAL'));
});

// ==========================================
// 3. COMPANY ADMIN WORKSPACE ROUTES
// ==========================================

// Helper to resolve tenant ID from query, user, or company slug
function resolveTenantId(requestedTenantId, reqUser) {
  const companies = db.getCompanies();
  if (reqUser && reqUser.role !== 'SUPER_ADMIN') {
    return reqUser.tenantId;
  }
  if (!requestedTenantId || requestedTenantId === 'GLOBAL') {
    return companies[0]?.id || 'GLOBAL';
  }
  const match = companies.find(c => c.id === requestedTenantId);
  if (match) return match.id;

  const cleanSlug = requestedTenantId.toLowerCase().replace('comp-', '');
  const slugMatch = companies.find(c => 
    c.name.toLowerCase().includes(cleanSlug) ||
    c.domain.toLowerCase().includes(cleanSlug)
  );
  if (slugMatch) return slugMatch.id;
  return companies[0]?.id || requestedTenantId;
}

// Company Dashboard Overview
app.get('/api/company/overview', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const tenantId = resolveTenantId(req.query.tenantId, req.user);
  const company = db.getCompanyById(tenantId) || db.getCompanies()[0];


  const jobs = db.getJobs(company?.id);
  const candidates = db.getCandidates(company?.id);
  const interviews = db.getInterviews(company?.id);
  const recordings = db.getRecordings(company?.id);

  const completed = interviews.filter(i => i.status === 'COMPLETED');
  const shortlisted = candidates.filter(c => c.status === 'SHORTLISTED').length;
  const rejected = candidates.filter(c => c.status === 'REJECTED').length;
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((a, b) => a + (b.overallScore || 0), 0) / completed.length)
    : 0;

  res.json({
    company,
    stats: {
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalCandidates: candidates.length,
      completedInterviews: completed.length,
      shortlistedCount: shortlisted,
      rejectedCount: rejected,
      avgCandidateScore: avgScore,
      totalRecordings: recordings.length
    },
    recentCandidates: candidates.slice(0, 10).map(c => {
      const intv = db.getInterviewByCandidateId(c.id);
      const job = db.getJobById(c.jobId);
      return {
        ...c,
        jobTitle: job?.title,
        overallScore: intv?.overallScore,
        aiRecommendation: intv?.aiRecommendation
      };
    })
  });
});

// Jobs Management
app.get('/api/company/jobs', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const tenantId = resolveTenantId(req.query.tenantId, req.user);
  const jobs = db.getJobs(tenantId).map(j => {
    const candCount = db.getCandidates(tenantId, j.id).length;
    return { ...j, candidatesCount: candCount };
  });
  res.json(jobs);
});

app.post('/api/company/jobs', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const tenantId = resolveTenantId(req.query.tenantId, req.user);
  const { title, department, experienceLevel, skillsRequired, description, passThreshold, questionIds } = req.body;

  if (!title) return res.status(400).json({ error: 'Job title is required' });

  const job = db.createJob({
    tenantId,
    title,
    department,
    experienceLevel,
    skillsRequired: Array.isArray(skillsRequired) ? skillsRequired : (skillsRequired ? skillsRequired.split(',').map(s => s.trim()) : []),
    description,
    passThreshold: passThreshold || 70,
    questionIds: questionIds || []
  });

  db.logAudit(tenantId, req.user.name, req.user.role, 'JOB_CREATED', `Created job posting: ${job.title}`);
  res.status(201).json(job);
});

// Candidates & Invitations
app.get('/api/company/candidates', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const tenantId = resolveTenantId(req.query.tenantId, req.user);
  const candidates = db.getCandidates(tenantId).map(c => {
    const job = db.getJobById(c.jobId);
    const intv = db.getInterviewByCandidateId(c.id);
    const rec = intv ? db.getRecordingByInterviewId(intv.id) : null;
    return {
      ...c,
      jobTitle: job?.title,
      overallScore: intv?.overallScore,
      aiRecommendation: intv?.aiRecommendation,
      interviewId: intv?.id,
      hasRecording: !!rec
    };
  });
  res.json(candidates);
});

app.post('/api/company/candidates', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const tenantId = resolveTenantId(req.query.tenantId, req.user);
  const { jobId, name, email, phone } = req.body;


  if (!name || !email || !jobId) {
    return res.status(400).json({ error: 'Candidate name, email, and jobId are required' });
  }

  const candidate = db.createCandidate({ tenantId, jobId, name, email, phone });
  db.logAudit(tenantId, req.user.name, req.user.role, 'CANDIDATE_INVITED', `Invited ${candidate.name} (${candidate.email}) for job ID ${jobId}`);

  res.status(201).json(candidate);
});

// Candidate Decision (Shortlist / Reject)
app.patch('/api/company/candidates/:id/decision', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const { decision, notes } = req.body; // 'SHORTLISTED' or 'REJECTED'
  if (!['SHORTLISTED', 'REJECTED', 'PENDING'].includes(decision)) {
    return res.status(400).json({ error: 'Invalid decision state' });
  }

  const candidate = db.updateCandidateStatus(req.params.id, decision, notes);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  db.logAudit(candidate.tenantId, req.user.name, req.user.role, `CANDIDATE_${decision}`, `Candidate ${candidate.name} marked as ${decision}. Notes: ${notes || 'None'}`);
  res.json(candidate);
});

// Interview Review Details & Recordings
app.get('/api/company/interviews/:id', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const interview = db.getInterviewById(req.params.id);
  if (!interview) return res.status(404).json({ error: 'Interview not found' });

  const candidate = db.getCandidateById(interview.candidateId);
  const job = db.getJobById(interview.jobId);
  const recording = db.getRecordingByInterviewId(interview.id);

  res.json({
    interview,
    candidate,
    job,
    recording
  });
});

app.get('/api/company/recordings', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const tenantId = req.user.role === 'SUPER_ADMIN' ? (req.query.tenantId || 'comp-apex') : req.user.tenantId;
  const recordings = db.getRecordings(tenantId).map(r => {
    const cand = db.getCandidateById(r.candidateId);
    const intv = db.getInterviewById(r.interviewId);
    return { ...r, candidateName: cand?.name, overallScore: intv?.overallScore };
  });
  res.json(recordings);
});

app.get('/api/company/audit-logs', authenticate, requireRole(['COMPANY_ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const tenantId = req.user.role === 'SUPER_ADMIN' ? (req.query.tenantId || 'comp-apex') : req.user.tenantId;
  res.json(db.getAuditLogs(tenantId));
});

// ==========================================
// 4. CANDIDATE PUBLIC INTERVIEW PORTAL ROUTES
// ==========================================

// Token verification for candidate entry
app.get('/api/candidate/verify/:token', (req, res) => {
  const candidate = db.getCandidateByToken(req.params.token);
  if (!candidate) {
    return res.status(404).json({ error: 'Invalid or expired interview link' });
  }

  const job = db.getJobById(candidate.jobId);
  const company = db.getCompanyById(candidate.tenantId);

  // Retrieve assigned questions
  const questions = (job?.questionIds || []).map(qid => db.getQuestionById(qid)).filter(Boolean);
  
  // Fallback to global questions if job has none assigned
  const effectiveQuestions = questions.length > 0 ? questions : db.getQuestions('GLOBAL').slice(0, 3);

  res.json({
    candidate: {
      id: candidate.id,
      name: candidate.name,
      email: candidate.email,
      status: candidate.status
    },
    job: {
      id: job?.id,
      title: job?.title || 'Open Position',
      department: job?.department,
      skillsRequired: job?.skillsRequired || []
    },
    company: {
      id: company?.id,
      name: company?.name || 'Ardhnarishwar Partner Company'
    },
    questions: effectiveQuestions.map((q, idx) => ({
      id: q.id,
      index: idx + 1,
      category: q.category,
      difficulty: q.difficulty,
      questionText: q.questionText,
      timeLimitSeconds: q.timeLimitSeconds || 120
    }))
  });
});

// Start Candidate Interview Session
app.post('/api/candidate/start-interview', (req, res) => {
  const { candidateToken } = req.body;
  const candidate = db.getCandidateByToken(candidateToken);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  let interview = db.getInterviewByCandidateId(candidate.id);
  if (!interview) {
    interview = db.createInterview({
      tenantId: candidate.tenantId,
      candidateId: candidate.id,
      jobId: candidate.jobId
    });
  }

  db.updateCandidateStatus(candidate.id, 'IN_PROGRESS');
  db.logAudit(candidate.tenantId, candidate.name, 'CANDIDATE', 'INTERVIEW_STARTED', `Candidate started interview session ${interview.id}`);

  res.json({ interviewId: interview.id });
});

// Evaluate Single Candidate Answer (Internal AI Engine)
app.post('/api/candidate/evaluate-answer', (req, res) => {
  const { questionId, answerTranscript, jobId } = req.body;
  const question = db.getQuestionById(questionId);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  const job = db.getJobById(jobId);
  const evaluation = evaluateQuestionAnswer(question, answerTranscript, {
    title: job?.title,
    requiredSkills: job?.skillsRequired || []
  });

  res.json(evaluation);
});

// Finalize Candidate Interview (Generate Complete 9-Metric AI Scorecard)
app.post('/api/candidate/finalize-interview', (req, res) => {
  const { interviewId, candidateToken, questionEvaluations, recordingMetadata } = req.body;
  const candidate = db.getCandidateByToken(candidateToken);
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });

  let interview = interviewId ? db.getInterviewById(interviewId) : null;
  if (!interview) {
    interview = db.getInterviewByCandidateId(candidate.id);
  }
  if (!interview) {
    interview = db.createInterview({
      tenantId: candidate.tenantId,
      candidateId: candidate.id,
      jobId: candidate.jobId
    });
  }

  const job = db.getJobById(candidate.jobId);
  const finalReport = evaluateCompleteInterview(questionEvaluations || [], {
    title: job?.title,
    requiredSkills: job?.skillsRequired || []
  });

  const completed = db.completeInterview(interview.id, finalReport);

  // Save recording reference if provided
  if (recordingMetadata) {
    db.saveRecording({
      tenantId: candidate.tenantId,
      candidateId: candidate.id,
      interviewId: interview.id,
      filePath: recordingMetadata.filePath || '/recordings/demo_live_recording.webm',
      duration: recordingMetadata.duration || 180,
      fileSize: recordingMetadata.fileSize || 4200000,
      mimeType: recordingMetadata.mimeType || 'video/webm',
      questionTimestamps: recordingMetadata.questionTimestamps || []
    });
  }

  db.logAudit(candidate.tenantId, candidate.name, 'CANDIDATE', 'INTERVIEW_COMPLETED', `Completed interview with score: ${finalReport.overallScore}/100 (${finalReport.recommendation})`);

  res.json({
    success: true,
    interview: completed,
    report: finalReport
  });
});

// Upload Video Recording Chunks
app.post('/api/candidate/upload-recording', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file provided' });
  }

  const fileUrl = `/recordings/${req.file.filename}`;
  res.json({
    success: true,
    filePath: fileUrl,
    filename: req.file.filename,
    fileSize: req.file.size
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    platform: 'Ardhnarishwar AI-Powered Interview SaaS',
    timestamp: new Date().toISOString(),
    aiEngine: 'Internal On-Premise NLP (Zero External APIs)'
  });
});

app.listen(PORT, () => {
  console.log(`Ardhnarishwar AI SaaS Server running on http://localhost:${PORT}`);
});
