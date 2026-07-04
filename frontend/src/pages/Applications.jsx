import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  FileText, Calendar, DollarSign, ArrowRight, CheckCircle, 
  XCircle, Clock, MapPin, AlertCircle
} from 'lucide-react';

const Applications = () => {
  const { user } = useAuth();
  
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCreatorApplications = async () => {
    try {
      const res = await api.get('/api/applications/my');
      if (res.success) {
        setApplications(res.applications || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch application history.');
    }
  };

  const fetchRecruiterApplications = async () => {
    try {
      // 1. Fetch all projects created by recruiter
      const projRes = await api.get('/api/projects/recruiter/my');
      if (projRes.success) {
        const projects = projRes.projects || [];
        
        // 2. Fetch applications for each project in parallel
        const allAppsPromises = projects.map(proj => 
          api.get(`/api/applications/project/${proj._id}`)
            .then(res => res.applications.map(app => ({ ...app, projectTitle: proj.title })))
            .catch(() => []) // Fallback to empty if fails
        );
        
        const results = await Promise.all(allAppsPromises);
        const mergedApps = results.flat().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setApplications(mergedApps);
      }
    } catch (err) {
      setError(err.message || 'Failed to compile applicant rosters.');
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    if (user.role === 'Creator') {
      await fetchCreatorApplications();
    } else {
      await fetchRecruiterApplications();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Recruiter quick action
  const handleUpdateStatus = async (appId, newStatus) => {
    try {
      const res = await api.put(`/api/applications/${appId}`, { status: newStatus });
      if (res.success) {
        loadData(); // Reload list
      }
    } catch (err) {
      alert(err.message || 'Failed to update application status.');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
          Proposal Management
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-1">
          {user.role === 'Creator' ? 'Your Applications' : 'Candidate Pipeline'}
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          {user.role === 'Creator' 
            ? 'Track the status and details of contract proposals you have submitted.'
            : 'Review, accept, and hire candidates applying to your active projects.'
          }
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Applications list */}
      {applications.length > 0 ? (
        <div className="space-y-6">
          {applications.map((app) => {
            const isCreator = user.role === 'Creator';
            const proj = isCreator ? app.projectId : { _id: app.projectId, title: app.projectTitle };
            const detailsText = app.proposal;
            
            // Clean invite/normal proposal
            const isInvite = detailsText.startsWith('[INBOX HIRE REQUEST]');
            const proposalClean = isInvite ? detailsText.replace('[INBOX HIRE REQUEST] ', '') : detailsText;

            if (!proj) return null;

            return (
              <div key={app._id} className="glass-panel p-6 rounded-2xl border border-border hover:border-primary/20 transition duration-200 space-y-4">
                
                {/* Header row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/40 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white hover:text-primary-glow transition duration-200">
                      <Link to={`/project/${proj._id}`}>{proj.title}</Link>
                    </h3>
                    
                    {/* Secondary details */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 mt-1 font-mono">
                      <span>Submitted {new Date(app.createdAt).toLocaleDateString()}</span>
                      {isCreator && proj.recruiterId && (
                        <>
                          <span>&bull;</span>
                          <span>Posted by {proj.recruiterId.name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
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

                {/* Proposal content details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Left Column: Proposal message details */}
                  <div className="md:col-span-2 space-y-2">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {isInvite ? 'Invitation Message' : 'Cover proposal'}
                    </span>
                    <p className="text-xs text-zinc-400 bg-zinc-950 p-4 rounded-xl border border-border leading-relaxed whitespace-pre-line">
                      {proposalClean}
                    </p>
                  </div>

                  {/* Right Column: Context details or Recruiter actions */}
                  <div className="space-y-4 self-center">
                    {isCreator ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-zinc-500">Project Budget</span>
                          <span className="text-white font-mono font-semibold">${proj.budget?.toLocaleString()}</span>
                        </div>
                        <Link 
                          to={`/project/${proj._id}`}
                          className="w-full flex items-center justify-center gap-1 py-2 rounded-lg bg-zinc-900 border border-border hover:bg-zinc-800 text-xs font-semibold text-white transition duration-200"
                        >
                          <span>View Project Spec</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ) : (
                      // Recruiter actions on application card
                      <div className="space-y-3">
                        {app.creatorId && (
                          <div className="flex items-center gap-3 mb-2">
                            {app.creatorId.profileImage ? (
                              <img src={app.creatorId.profileImage} alt={app.creatorId.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary-glow flex items-center justify-center font-bold text-xs">
                                {app.creatorId.name.charAt(0)}
                              </div>
                            )}
                            <div className="text-xs">
                              <Link to={`/creator/${app.creatorId._id}`} className="font-bold text-white hover:underline block">{app.creatorId.name}</Link>
                              <span className="text-zinc-500 font-mono text-[10px]">{app.creatorId.category}</span>
                            </div>
                          </div>
                        )}

                        {app.status === 'pending' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => handleUpdateStatus(app._id, 'accepted')}
                              className="px-2 py-1.5 bg-primary/10 border border-primary/25 text-primary-glow rounded text-[11px] font-semibold hover:bg-primary hover:text-white transition duration-150"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(app._id, 'hired')}
                              className="px-2 py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[11px] font-semibold hover:bg-emerald-600 hover:text-white transition duration-150"
                            >
                              Hire
                            </button>
                          </div>
                        )}
                        
                        {app.status === 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(app._id, 'hired')}
                            className="w-full py-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 rounded text-[11px] font-semibold hover:bg-emerald-600 hover:text-white transition duration-150"
                          >
                            Hire Creator
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-16 text-center rounded-xl border border-border max-w-lg mx-auto">
          <FileText className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">No Applications Listed</h4>
          <p className="text-sm text-zinc-400">
            {user.role === 'Creator' 
              ? 'You have not submitted any proposals yet. Check out the project board to apply.'
              : 'You have not received any applications for your projects yet.'
            }
          </p>
          {user.role === 'Creator' && (
            <Link to="/explore-projects" className="inline-block mt-6 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg">
              Explore Projects
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
