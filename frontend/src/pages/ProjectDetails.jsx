import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { getCategoryColor } from '../utils/categories';
import { 
  DollarSign, Calendar, MapPin, Briefcase, FileText, CheckCircle, 
  XCircle, Send, Award, HelpCircle, ArrowRight, UserCheck, AlertCircle
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
        // Reload project detail view
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
        // Refresh project list and applicant database
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
    <div className="space-y-8">
      {/* Main Grid: Left Spec Info & Right Action Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Specification details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-border space-y-6">
            
            {/* Top specs */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(project.category)}`}>
                {project.category}
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                project.status === 'open' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
              }`}>
                Project status: {project.status}
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">{project.title}</h2>
              {project.recruiterId && (
                <p className="text-xs text-zinc-500">
                  Posted by <span className="text-zinc-300 font-semibold">{project.recruiterId.name}</span>
                  {project.recruiterId.organization && ` (Recruiter, ${project.recruiterId.organization})`}
                </p>
              )}
            </div>

            {/* Description details */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-tight">Project Summary</h4>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                {project.description}
              </p>
            </div>

            {/* Required Skills */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white tracking-tight">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {project.requiredSkills.map((skill, idx) => (
                  <span key={idx} className="text-xs px-3 py-1 rounded bg-zinc-900 border border-zinc-850 text-zinc-300">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Action Panel */}
        <div className="space-y-6">
          {/* Project Details Panel */}
          <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight border-b border-border/40 pb-3">
              Contract Terms
            </h3>

            <div className="space-y-4">
              {/* Budget */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Budget (USD)</span>
                <div className="flex items-center text-sm font-mono font-bold text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                  <span>{project.budget.toLocaleString()}</span>
                </div>
              </div>

              {/* Deadline */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">Apply Deadline</span>
                <div className="flex items-center text-xs font-mono text-zinc-200 gap-1.5">
                  <Calendar className="w-4 h-4 text-primary-glow" />
                  <span>{new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Context Actions wrapper */}
          {!user ? (
            <div className="glass-panel p-6 rounded-2xl border border-border text-center space-y-3">
              <h4 className="text-sm font-bold text-white">Interested in applying?</h4>
              <p className="text-xs text-zinc-400">Create a Creator workspace or log in to submit a proposal contract.</p>
              <Link to="/login" className="block w-full py-2.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary-hover shadow-lg">
                Log In
              </Link>
            </div>
          ) : isProjectOwner ? (
            <div className="glass-panel p-6 rounded-2xl border border-border text-center space-y-2">
              <h4 className="text-sm font-bold text-white">You own this listing</h4>
              <p className="text-xs text-zinc-400">See below for applicant applications submitted by talent.</p>
              <Link to="/dashboard" className="block text-xs text-primary-glow hover:underline pt-2">
                &larr; Back to workspace Dashboard
              </Link>
            </div>
          ) : user.role === 'Creator' ? (
            <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
              <h3 className="text-base font-bold text-white tracking-tight border-b border-border/40 pb-3">
                Your Application
              </h3>

              {hasApplied ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-400">Status</span>
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
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Your Proposal</span>
                    <p className="text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg border border-border leading-relaxed">
                      {applicationDetails?.proposal.startsWith('[INBOX HIRE REQUEST]') 
                        ? applicationDetails?.proposal.replace('[INBOX HIRE REQUEST] ', '')
                        : applicationDetails?.proposal
                      }
                    </p>
                  </div>
                </div>
              ) : project.status !== 'open' ? (
                <div className="text-center text-xs text-zinc-500">
                  Applications are closed for this project.
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
                    <label className="text-xs font-semibold text-zinc-300">Proposal / Bid Message</label>
                    <textarea
                      rows="4"
                      required
                      value={proposal}
                      onChange={(e) => { setProposal(e.target.value); setApplyError(''); }}
                      className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-xs text-white focus:outline-none focus:border-primary leading-relaxed"
                      placeholder="Outline why you are a fit, project milestones, and relevant portfolio items..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={applyLoading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg hover:shadow-primary/20 transition duration-200 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{applyLoading ? 'Submitting proposal...' : 'Submit Application'}</span>
                  </button>
                </form>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Recruiter View Candidate Applications */}
      {isProjectOwner && (
        <div className="space-y-6 pt-6">
          <h3 className="text-xl font-bold text-white tracking-tight border-b border-border/60 pb-3 flex items-center gap-2">
            <span>Submitted Applications</span>
            <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
              {applicants.length} Candidates
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
                const isInvite = app.proposal.startsWith('[INBOX HIRE REQUEST]');
                const proposalClean = isInvite ? app.proposal.replace('[INBOX HIRE REQUEST] ', '') : app.proposal;

                return (
                  <div key={app._id} className="glass-panel p-6 rounded-2xl border border-border space-y-6 hover:border-primary/20 transition duration-200">
                    
                    {/* Candidate User Roster Header */}
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
                            <Link to={`/creator/${cand._id}`}>{cand.name}</Link>
                          </h4>
                          {cand.location && (
                            <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{cand.location}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Application status details */}
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded border capitalize ${
                          app.status === 'pending' && 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        } ${
                          app.status === 'accepted' && 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        } ${
                          app.status === 'hired' && 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        } ${
                          app.status === 'rejected' && 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {isInvite ? 'Sent Invitation:' : 'Application:'} {app.status}
                        </span>
                      </div>
                    </div>

                    {/* Cover Proposal Text */}
                    <div className="bg-zinc-950 p-4 rounded-xl border border-border space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                        {isInvite ? 'Invitation Message' : 'Cover proposal'}
                      </span>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line">
                        {proposalClean}
                      </p>
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

                    {/* Action buttons (Only display action buttons if not already hired/rejected) */}
                    {app.status === 'pending' && (
                      <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'accepted')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 hover:bg-primary border border-primary/20 text-primary-glow hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Accept Application</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'hired')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Hire Creator</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'rejected')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-950/20 hover:bg-red-600 border border-red-900/30 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {app.status === 'accepted' && (
                      <div className="pt-2 border-t border-border/40 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'hired')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Hire Creator</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(app._id, 'rejected')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-950/20 hover:bg-red-600 border border-red-900/30 text-red-400 hover:text-white rounded-lg text-xs font-semibold transition-all duration-200"
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
