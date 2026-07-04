import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PortfolioCard from '../components/PortfolioCard';
import { getCategoryColor } from '../utils/categories';
import { 
  MapPin, CheckCircle, XCircle, Plus, UploadCloud, X, AlertCircle, 
  MessageSquare, Briefcase, FileText, Send, HelpCircle
} from 'lucide-react';

const CreatorProfile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  
  const isOwner = user && user.id === id;

  // Profile data
  const [profile, setProfile] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Recruiters direct hire invitation states
  const [showHireModal, setShowHireModal] = useState(false);
  const [recruiterProjects, setRecruiterProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [proposalText, setProposalText] = useState('');
  const [hireSuccess, setHireSuccess] = useState(false);
  const [hireLoading, setHireLoading] = useState(false);
  const [hireError, setHireError] = useState('');

  // Creator add portfolio states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [portfolioForm, setPortfolioForm] = useState({
    title: '',
    description: '',
    media: null
  });

  const fetchProfileDetails = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Creator User Profile
      const userRes = await api.get(`/api/users/creators/${id}`);
      if (userRes.success) {
        setProfile(userRes.creator);
      }

      // 2. Fetch Creator Portfolio items
      const portRes = await api.get(`/api/portfolios/creator/${id}`);
      if (portRes.success) {
        setPortfolio(portRes.portfolioItems || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load creator profile.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruiterProjects = async () => {
    try {
      const res = await api.get('/api/projects/recruiter/my');
      if (res.success) {
        const openProjects = (res.projects || []).filter(p => p.status === 'open');
        setRecruiterProjects(openProjects);
        if (openProjects.length > 0) {
          setSelectedProject(openProjects[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects for invitation list:', err.message);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
    if (user && user.role === 'Recruiter') {
      fetchRecruiterProjects();
    }
  }, [id, user]);

  // Creator Portfolio Actions
  const handlePortfolioFormChange = (e) => {
    if (e.target.name === 'media') {
      setPortfolioForm({ ...portfolioForm, media: e.target.files[0] });
    } else {
      setPortfolioForm({ ...portfolioForm, [e.target.name]: e.target.value });
    }
    setUploadError('');
  };

  const handleAddPortfolio = async (e) => {
    e.preventDefault();
    const { title, description, media } = portfolioForm;

    if (!title || !description || !media) {
      return setUploadError('Please fill in all fields and select a file.');
    }

    setUploadLoading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('media', media);

      const res = await api.post('/api/portfolios', formData, true);
      if (res.success) {
        setShowUploadModal(false);
        setPortfolioForm({ title: '', description: '', media: null });
        fetchProfileDetails(); // Reload portfolio items
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed. File type may be unsupported.');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeletePortfolioItem = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this portfolio item?')) {
      try {
        await api.delete(`/api/portfolios/${itemId}`);
        fetchProfileDetails();
      } catch (err) {
        alert(err.message || 'Failed to delete portfolio item.');
      }
    }
  };

  // Recruiter Invitation Action
  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!selectedProject || !proposalText) {
      return setHireError('Please choose a project and enter your invitation message.');
    }

    setHireLoading(true);
    setHireError('');
    setHireSuccess(false);

    try {
      // Submitting application from recruiter perspective is styled as a hire invitation proposal
      // The API uses `POST /api/applications` which represents applications mapping projectId -> creatorId
      const res = await api.post('/api/applications', {
        projectId: selectedProject,
        proposal: `[INBOX HIRE REQUEST] ${proposalText}`
      });

      if (res.success) {
        setHireSuccess(true);
        setProposalText('');
      }
    } catch (err) {
      setHireError(err.message || 'Failed to submit hire request. User may have already been invited.');
    } finally {
      setHireLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="glass-panel p-8 text-center rounded-xl border border-border max-w-lg mx-auto mt-12">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <h4 className="text-lg font-bold text-white mb-2">Creator Profile Unreachable</h4>
        <p className="text-sm text-zinc-400">{error || 'This user profile does not exist.'}</p>
        <Link to="/explore-creators" className="inline-block mt-6 text-xs text-primary-glow font-semibold hover:underline">
          &larr; Back to Creators
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* Visual profile header banner card */}
      <div className="glass-panel rounded-2xl border border-border overflow-hidden relative">
        {/* Background glow meshes */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />

        <div className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row gap-8 items-start justify-between">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            {profile.profileImage ? (
              <img 
                src={profile.profileImage} 
                alt={profile.name} 
                className="w-28 h-28 md:w-36 md:h-36 rounded-full border-2 border-primary/50 object-cover shadow-2xl" 
              />
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-zinc-900 border-2 border-primary/45 text-primary-glow flex items-center justify-center font-bold text-4xl shadow-xl">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <h2 className="text-3xl font-extrabold text-white tracking-tight">{profile.name}</h2>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(profile.category)}`}>
                    {profile.category}
                  </span>
                </div>

                {profile.location && (
                  <p className="text-sm text-zinc-500 mt-1 flex items-center gap-1 justify-center md:justify-start">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{profile.location}</span>
                  </p>
                )}
              </div>

              <p className="text-sm text-zinc-300 max-w-xl leading-relaxed">
                {profile.bio || 'This creator hasn\'t updated their bio workspace description yet.'}
              </p>

              {/* Skills section */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-2">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="text-xs px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="w-full md:w-auto flex flex-col gap-3 self-center md:self-start">
            {/* Availability status badge */}
            <div className={`flex items-center justify-center gap-1.5 text-xs py-2 px-4 rounded-xl border font-mono ${
              profile.availability 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}>
              {profile.availability ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              <span>{profile.availability ? 'OPEN FOR CONTRACTS' : 'UNAVAILABLE'}</span>
            </div>

            {/* Contextual Owner / Recruiter action buttons */}
            {isOwner ? (
              <button
                onClick={() => setShowUploadModal(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Upload Media</span>
              </button>
            ) : user && user.role === 'Recruiter' ? (
              <button
                onClick={() => setShowHireModal(true)}
                disabled={!profile.availability}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-white hover:bg-zinc-150 text-black text-sm font-bold rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Hire Creator</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Portfolio Grid Header */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-white tracking-tight border-b border-border/60 pb-3 flex items-center gap-2">
          <span>Portfolio Showcase</span>
          <span className="text-xs font-mono bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
            {portfolio.length} Items
          </span>
        </h3>

        {portfolio.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio.map((item) => (
              <PortfolioCard 
                key={item._id} 
                item={item} 
                onDelete={handleDeletePortfolioItem} 
                isOwner={isOwner}
              />
            ))}
          </div>
        ) : (
          <div className="glass-panel p-16 text-center rounded-xl border border-border">
            <UploadCloud className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white mb-1">No Projects Showcased</h4>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              {isOwner 
                ? 'Start building your professional identity by uploading your best artwork and game designs.'
                : 'This creator hasn\'t uploaded any portfolio projects yet.'
              }
            </p>
            {isOwner && (
              <button 
                onClick={() => setShowUploadModal(true)} 
                className="mt-6 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20"
              >
                Add Your First Project
              </button>
            )}
          </div>
        )}
      </div>

      {/* Creator Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-border relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowUploadModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Add Portfolio Item</h3>

            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleAddPortfolio} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  value={portfolioForm.title} 
                  onChange={handlePortfolioFormChange}
                  className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary"
                  placeholder="e.g. Neo-Tokyo Concept Matte Painting"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Description</label>
                <textarea 
                  name="description" 
                  rows="3" 
                  required 
                  value={portfolioForm.description} 
                  onChange={handlePortfolioFormChange}
                  className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary"
                  placeholder="Describe tools used, design decisions, pipeline integrations..."
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Select Media (Image / Video)</label>
                <input 
                  type="file" 
                  name="media" 
                  accept="image/*,video/*"
                  required
                  onChange={handlePortfolioFormChange}
                  className="px-3 py-2.5 rounded-lg bg-zinc-950 border border-border text-xs text-zinc-400 file:bg-zinc-800 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:mr-3 focus:outline-none focus:border-primary cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition duration-200 disabled:opacity-50"
              >
                {uploadLoading ? 'Uploading Media...' : 'Publish Media'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Direct Hire/Invite Modal */}
      {showHireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-border relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowHireModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Send Project Invitation</h3>

            {hireError && (
              <div className="flex items-center gap-2 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{hireError}</span>
              </div>
            )}

            {hireSuccess ? (
              <div className="text-center py-6 space-y-4">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">Invitation Dispatched!</h4>
                <p className="text-xs text-zinc-400">
                  Your project application invitation has been submitted to {profile.name}.
                </p>
                <button
                  onClick={() => { setShowHireModal(false); setHireSuccess(false); }}
                  className="px-5 py-2.5 bg-zinc-800 text-white rounded-lg text-xs font-semibold hover:bg-zinc-700"
                >
                  Close Window
                </button>
              </div>
            ) : recruiterProjects.length > 0 ? (
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Choose Active Project Listing</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-zinc-300 focus:outline-none focus:border-primary"
                  >
                    {recruiterProjects.map((p) => (
                      <option key={p._id} value={p._id}>{p.title} (${p.budget})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Invitation Message</label>
                  <textarea 
                    rows="4" 
                    required 
                    value={proposalText} 
                    onChange={(e) => setProposalText(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary"
                    placeholder={`Hello ${profile.name},\nWe checked your portfolio and would love to hire you for our project...`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={hireLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition duration-200 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{hireLoading ? 'Dispatching invite...' : 'Send Invite'}</span>
                </button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-4">
                <Briefcase className="w-12 h-12 text-zinc-655 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Open Projects Found</h4>
                <p className="text-xs text-zinc-400">
                  You need to have an active open project listing to send hire requests.
                </p>
                <Link
                  to="/dashboard"
                  className="inline-block px-5 py-2.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-hover"
                >
                  Create a Project Listing
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorProfile;
