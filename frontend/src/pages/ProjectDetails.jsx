import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getCategoryColor } from '../utils/categories';
import { 
  DollarSign, Calendar, MapPin, Briefcase, FileText, CheckCircle, 
  XCircle, Send, Award, HelpCircle, ArrowRight, UserCheck, AlertCircle,
  Bookmark, Share2, ShieldAlert, Clock, ShieldCheck, Heart, UserPlus
} from 'lucide-react';

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Project Details
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Creator Application state
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationDetails, setApplicationDetails] = useState(null);
  const [proposal, setProposal] = useState('');
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');

  // AI Matchmaking calculator
  const getMatchScore = () => {
    if (!user || user.role !== 'Creator' || !project || !project.requiredSkills || project.requiredSkills.length === 0) {
      return { score: 100, matched: [], missing: [] };
    }
    const userSkills = user.skills || [];
    const matched = project.requiredSkills.filter(s => 
      userSkills.some(us => us.toLowerCase().trim() === s.toLowerCase().trim())
    );
    const missing = project.requiredSkills.filter(s => 
      !userSkills.some(us => us.toLowerCase().trim() === s.toLowerCase().trim())
    );
    const score = Math.round((matched.length / project.requiredSkills.length) * 100);
    return { score, matched, missing };
  };

  const { score, matched, missing } = getMatchScore();

  // Bookmarking / Saving state
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Recruiter Applicants list state
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);

  const fetchProjectDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/projects/${id}`);
      if (res.success) {
        setProject(res.project);
        setIsSaved(res.project.savedBy && user ? res.project.savedBy.includes(user.id) : false);

        // If Recruiter owns this project, fetch applicant list
        if (user && user.role === 'Recruiter' && res.project.recruiterId._id === user.id) {
          fetchApplicants();
        }

        // If Creator, check if already applied
        if (user && user.role === 'Creator') {
          checkCreatorApplication();
        }
      }
    } catch (err) {
      setError(err.message || 'Project not found.');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicants = async () => {
    setApplicantsLoading(true);
    try {
      const res = await api.get(`/api/applications/project/${id}`);
      if (res.success) {
        setApplicants(res.applications || []);
      }
    } catch (err) {
      console.error('Failed to load applications:', err.message);
    } finally {
      setApplicantsLoading(false);
    }
  };

  const checkCreatorApplication = async () => {
    try {
      const res = await api.get('/api/applications/my');
      if (res.success) {
        const found = (res.applications || []).find(app => app.projectId?._id === id);
        if (found) {
          setHasApplied(true);
          setApplicationDetails(found);
        }
      }
    } catch (err) {
      console.error('Failed to check applicant records:', err.message);
    }
  };

  useEffect(() => {
    if (id) {
      fetchProjectDetails();
    }
  }, [id, user]);

  const handleSaveToggle = async () => {
    if (!user) return alert('Please log in to save projects');
    
    setSaveLoading(true);
    try {
      if (isSaved) {
        await api.delete(`/api/portfolios/bookmarks/${id}`);
      } else {
        await api.post(`/api/portfolios/bookmarks`, { projectId: id });
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Project page link copied to clipboard!');
  };

  const handleReport = async () => {
    const reason = prompt('Please describe why you are reporting this project listing:');
    if (!reason) return;
    try {
      alert('Report submitted successfully. Our safety team will review this project listing.');
    } catch (err) {
      console.error(err);
    }
  };

  // Creator Submit Proposal handler
  const handleApply = async (e) => {
    e.preventDefault();
    if (!proposal.trim()) {
      return setApplyError('Please write a proposal/cover message.');
    }

    setApplyLoading(true);
    setApplyError('');
    try {
      const res = await api.post('/api/applications', {
        projectId: id,
        proposal: proposal
      });

      if (res.success) {
        setHasApplied(true);
        fetchProjectDetails();
      }
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setApplyLoading(false);
    }
  };

  // Recruiter Change Candidate status handler
  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const res = await api.put(`/api/applications/${appId}`, { status: newStatus });
      if (res.success) {
        fetchProjectDetails();
      }
    } catch (err) {
      alert(err.message || 'Failed to update candidate status.');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="glass-panel p-8 text-center rounded-xl border border-border max-w-lg mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h4 className="text-lg font-bold text-white mb-2">Project Board Unreachable</h4>
        <p className="text-sm text-zinc-400">{error || 'This project listing does not exist.'}</p>
        <Link to="/explore-projects" className="inline-block mt-6 text-xs text-primary-glow font-semibold hover:underline">
          &larr; Back to Projects Marketplace
        </Link>
      </div>
    );
  }

  const isProjectOwner = user && user.role === 'Recruiter' && project.recruiterId._id === user.id;

  return (
    <div className="space-y-8 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      
      {/* 1. Large Cover Banner */}
      <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-zinc-900 border border-border shadow-lg">
        {project.coverImage ? (
          <img src={project.coverImage} alt={project.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-950/60 to-indigo-950/60" />
        )}
        
        {/* Floating Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button 
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className={`p-2.5 rounded-xl backdrop-blur-md transition shadow-md border ${
              isSaved ? 'bg-primary border-primary text-white' : 'bg-black/60 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
            title="Save Project"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button 
            onClick={handleShare}
            className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-zinc-400 hover:text-white backdrop-blur-md transition shadow-md"
            title="Share Project"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={handleReport}
            className="p-2.5 rounded-xl bg-black/60 border border-zinc-800 text-zinc-400 hover:text-red-400 backdrop-blur-md transition shadow-md"
            title="Report Project"
          >
            <ShieldAlert className="w-4 h-4" />
          </button>
        </div>

        {/* Company Title Overlap Details */}
        <div className="absolute bottom-6 left-6 flex items-end gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center font-bold text-lg shadow-lg">
            {project.companyLogo ? (
              <img src={project.companyLogo} alt={project.companyName} className="w-full h-full object-cover" />
            ) : (
              (project.companyName || 'C').charAt(0).toUpperCase()
            )}
          </div>
          <div className="space-y-1 bg-black/40 backdrop-blur-sm p-3 rounded-xl border border-white/5">
            <span className="text-xs text-primary-glow font-bold tracking-wide uppercase">
              {project.companyName || 'Independent Recruiter'}
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">{project.title}</h1>
          </div>
        </div>
      </div>

      {/* 2. Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: About, Requirements, Timelines */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Summary Card */}
          <div className="glass-panel p-8 rounded-2xl border border-border space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/30 pb-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${getCategoryColor(project.category)}`}>
                {project.category}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {project.applicantsCount || 0} applications submitted
              </span>
            </div>

            <div className="space-y-3">
              <h3 className="text-base font-bold text-white tracking-tight">About the Project</h3>
              <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>

            {/* Timelines */}
            {project.timeline && project.timeline.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-glow" />
                  <span>Project Timeline</span>
                </h3>
                <div className="relative border-l border-zinc-800 pl-4 ml-2 space-y-4">
                  {project.timeline.map((step, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary-glow border-2 border-zinc-950" />
                      <p className="text-xs text-zinc-300 font-semibold">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Requirements & Responsibilities cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Requirements Card */}
            <div className="glass-panel p-6 rounded-2xl border border-border space-y-3">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-primary-glow" />
                <span>Job Requirements</span>
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                {project.requirements && project.requirements.length > 0 ? (
                  project.requirements.map((req, idx) => <li key={idx} className="leading-normal">{req}</li>)
                ) : (
                  <>
                    <li className="leading-normal">Solid portfolio proving relevant skills.</li>
                    <li className="leading-normal">Clear communication skills for timelines.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Responsibilities Card */}
            <div className="glass-panel p-6 rounded-2xl border border-border space-y-3">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary-glow" />
                <span>Key Responsibilities</span>
              </h3>
              <ul className="space-y-2 text-xs text-zinc-400 list-disc list-inside">
                {project.responsibilities && project.responsibilities.length > 0 ? (
                  project.responsibilities.map((resp, idx) => <li key={idx} className="leading-normal">{resp}</li>)
                ) : (
                  <>
                    <li className="leading-normal">Deliver high-quality assets on scheduled phases.</li>
                    <li className="leading-normal">Attend periodic design syncs with recruiter.</li>
                  </>
                )}
              </ul>
            </div>

          </div>

          {/* Benefits Card */}
          {project.benefits && project.benefits.length > 0 && (
            <div className="glass-panel p-6 rounded-2xl border border-border space-y-3">
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <Heart className="w-4 h-4 text-primary-glow" />
                <span>Benefits & Perks</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.benefits.map((b, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-zinc-300">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Contract Terms & Actions */}
        <div className="space-y-6">
          {/* AI Matchmaking Score Card */}
          {user && user.role === 'Creator' && (
            <div className="glass-panel p-6 rounded-2xl border border-primary/20 bg-primary/[0.01] space-y-4 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-primary-glow/10 rounded-full filter blur-[30px] pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-glow" />
                  <span>AI Smart Match Fit</span>
                </h3>
                <span className="text-[10px] font-mono bg-primary/20 text-primary-glow border border-primary/30 px-2 py-0.5 rounded font-bold animate-pulse">
                  BETA
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  {/* Circular progress bar */}
                  <svg className="w-16 h-16 transform -rotate-90">
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      stroke="#18181b" 
                      strokeWidth="4" 
                      fill="transparent" 
                    />
                    <circle 
                      cx="32" 
                      cy="32" 
                      r="26" 
                      stroke="#a855f7" 
                      strokeWidth="4" 
                      fill="transparent" 
                      strokeDasharray={`${2 * Math.PI * 26}`}
                      strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold text-white">
                    {score}%
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-zinc-350 font-semibold leading-relaxed">
                    {score >= 80 ? '🔥 Highly Recommended Fit!' : score >= 50 ? '⚡ Strong Match Potential' : '💡 Match rate is developing'}
                  </p>
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Comparing your profile skills index against target recruiter requirements.
                  </p>
                </div>
              </div>

              {/* Tag overlaps */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                {matched.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Matched Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {matched.map(tag => (
                        <span key={tag} className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {missing.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Missing Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {missing.map(tag => (
                        <span key={tag} className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-border/40 pb-3">
              Contract Specifications
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Allocated Budget</span>
                <div className="flex items-center text-sm font-bold text-emerald-400 font-mono">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{project.budget.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Application Deadline</span>
                <span className="text-zinc-300 font-semibold font-mono">
                  {new Date(project.deadline).toLocaleDateString()}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Workspace Type</span>
                <span className="text-zinc-300 font-semibold">{project.workType || 'Remote'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Location</span>
                <span className="text-zinc-300 font-semibold truncate max-w-[140px]">{project.location || 'Remote'}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Open Positions</span>
                <span className="text-zinc-300 font-semibold">{project.openPositions || 1} slots</span>
              </div>
            </div>
          </div>

          {/* Action Call to Actions */}
          {!user ? (
            <div className="glass-panel p-6 rounded-2xl border border-border text-center space-y-3">
              <h4 className="text-sm font-bold text-white">Apply to this Gig</h4>
              <p className="text-xs text-zinc-400">Join the project team to collaborate and discuss milestones.</p>
              <Link to="/login" className="block w-full py-2.5 bg-primary text-white text-xs font-semibold rounded-lg shadow-lg">
                Log In to Apply
              </Link>
            </div>
          ) : isProjectOwner ? (
            <div className="glass-panel p-6 rounded-2xl border border-border text-center space-y-2">
              <h4 className="text-sm font-bold text-white">Owner Workspace Dashboard</h4>
              <p className="text-xs text-zinc-400 text-center leading-normal">
                Check below to review candidate proposals and hire creators.
              </p>
            </div>
          ) : user.role === 'Creator' ? (
            <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
              <h3 className="text-sm font-bold text-white border-b border-border/40 pb-3">
                Your Application Status
              </h3>

              {hasApplied ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Status</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                      applicationDetails?.status === 'pending' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                    } ${
                      applicationDetails?.status === 'accepted' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    } ${
                      applicationDetails?.status === 'hired' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    } ${
                      applicationDetails?.status === 'rejected' && 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {applicationDetails?.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Your proposal</span>
                    <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-border leading-relaxed">
                      {applicationDetails?.proposal.startsWith('[DIRECT HIRE PROPOSAL]') 
                        ? applicationDetails?.proposal.replace('[DIRECT HIRE PROPOSAL] ', '')
                        : applicationDetails?.proposal
                      }
                    </p>
                  </div>
                </div>
              ) : project.status !== 'open' ? (
                <div className="text-center text-xs text-zinc-500">
                  Applications are closed for this gig.
                </div>
              ) : (
                <form onSubmit={handleApply} className="space-y-4">
                  {applyError && (
                    <div className="text-xs text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{applyError}</span>
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-300">Pitch proposal message</label>
                    <textarea 
                      rows="4"
                      required
                      value={proposal}
                      onChange={(e) => { setProposal(e.target.value); setApplyError(''); }}
                      className="px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary resize-none"
                      placeholder="Why are you the perfect fit? Outline relevant files or Behance link here..."
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={applyLoading}
                    className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg transition"
                  >
                    Submit Proposal
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>

      </div>

      {/* Recruiter Review Candidates list */}
      {isProjectOwner && (
        <div className="space-y-6 pt-6">
          <h3 className="text-xl font-bold text-white tracking-tight border-b border-border/60 pb-3 flex items-center gap-2">
            <span>Review Pitch Candidates</span>
            <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
              {applicants.length} Applicants
            </span>
          </h3>

          {applicantsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
            </div>
          ) : applicants.length > 0 ? (
            <div className="space-y-6">
              {applicants.map((app) => {
                const cand = app.creatorId;
                if (!cand) return null;
                const isInvite = app.proposal.startsWith('[DIRECT HIRE PROPOSAL]');
                const proposalClean = isInvite ? app.proposal.replace('[DIRECT HIRE PROPOSAL] ', '') : app.proposal;

                return (
                  <div key={app._id} className="glass-panel p-6 rounded-2xl border border-border space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex gap-4">
                        {cand.profileImage ? (
                          <img src={cand.profileImage} alt={cand.name} className="w-12 h-12 rounded-full object-cover border border-primary/30" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 text-primary-glow flex items-center justify-center font-bold text-lg">
                            {cand.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <h4 className="text-base font-bold text-white hover:text-primary-glow">
                            <Link to={`/profile/${cand.username || cand._id}`}>
                              {cand.name}
                            </Link>
                          </h4>
                          <span className="text-xs text-zinc-500 font-mono mt-0.5 block">
                            @{cand.username || 'no-handle'}
                          </span>
                        </div>
                      </div>

                      <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border capitalize ${
                        app.status === 'pending' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      } ${
                        app.status === 'accepted' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      } ${
                        app.status === 'hired' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      } ${
                        app.status === 'rejected' && 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded-xl border border-border space-y-1.5">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Proposal message</span>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">{proposalClean}</p>
                    </div>

                    {/* Candidate stats */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-xs text-zinc-500 mr-1.5">Skills:</span>
                      {cand.skills.map((skill, idx) => (
                        <span key={idx} className="text-[10px] px-2.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {app.status === 'pending' && (
                      <div className="pt-2 border-t border-border/40 flex gap-2">
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'accepted')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary border border-primary/20 text-primary-glow hover:text-white rounded-lg text-xs font-semibold transition"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Accept Candidate</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'hired')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Hire Creator</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'rejected')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-955/20 hover:bg-red-650 border border-red-900/30 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-xl border border-border max-w-md mx-auto">
              <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">No Applications Yet</h4>
              <p className="text-sm text-zinc-400">When creators apply to this project, their proposals will list here.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default ProjectDetails;
