import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import PortfolioCard from '../components/PortfolioCard';
import { getCategoryColor } from '../utils/categories';
import { 
  MapPin, CheckCircle, XCircle, Plus, UploadCloud, X, AlertCircle, 
  MessageSquare, Briefcase, FileText, Send, HelpCircle, Eye, Users, 
  BookOpen, Trophy, PlusCircle, Trash2
} from 'lucide-react';

const CreatorProfile = () => {
  const { username, id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Profile states
  const [profile, setProfile] = useState(null);
  const isOwner = user && profile && (user.id === profile._id || user.id === profile.id || user._id === profile._id || user.username === profile.username);
  const [portfolio, setPortfolio] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('portfolio');

  // Network/Follow states
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Resume builder states (modals for adding education/experience)
  const [showExpModal, setShowExpModal] = useState(false);
  const [showEduModal, setShowEduModal] = useState(false);
  const [showAchModal, setShowAchModal] = useState(false);
  
  const [expForm, setExpForm] = useState({ company: '', title: '', duration: '', description: '' });
  const [eduForm, setEduForm] = useState({ school: '', degree: '', fieldOfStudy: '', duration: '' });
  const [achForm, setAchForm] = useState({ title: '', issuer: '', date: '', description: '' });

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
      let activeUser;
      
      // 1. Fetch Profile
      if (username) {
        const userRes = await api.get(`/api/users/profile/${username}`);
        if (userRes.success) {
          activeUser = userRes.creator;
        }
      } else {
        const userRes = await api.get(`/api/users/creators/${id}`);
        if (userRes.success) {
          activeUser = userRes.creator;
        }
      }

      if (!activeUser) {
        throw new Error('User profile not found');
      }

      setProfile(activeUser);
      const profileId = activeUser._id || activeUser.id;

      // 2. Fetch Portfolio items
      const portRes = await api.get(`/api/portfolios/creator/${profileId}`);
      if (portRes.success) {
        setPortfolio(portRes.portfolioItems || []);
      }

      // 3. Fetch Creator Posts
      const postsRes = await api.get(`/api/posts?authorId=${profileId}`);
      if (postsRes.success) {
        setPosts(postsRes.posts || []);
      }

      // 4. Fetch followers list
      const followersRes = await api.get(`/api/follow/${profileId}/followers`);
      if (followersRes.success) {
        setFollowers(followersRes.followers || []);
        if (user) {
          setIsFollowing(followersRes.followers.some(f => f._id === user.id));
        }
      }

      // 5. Fetch following list
      const followingRes = await api.get(`/api/follow/${profileId}/following`);
      if (followingRes.success) {
        setFollowing(followingRes.following || []);
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
  }, [id, username, user]);

  // Handle Follow creator
  const handleFollowToggle = async () => {
    if (!user) return navigate('/login');
    const profileId = profile?._id || profile?.id || id;
    try {
      const res = await api.post(`/api/follow/${profileId}`);
      if (res.success) {
        setIsFollowing(res.followed);
        fetchProfileDetails();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Experience
  const handleAddExperience = async (e) => {
    e.preventDefault();
    try {
      const updatedExperience = [...(profile.experience || []), expForm];
      const res = await api.put('/api/users/profile', { experience: updatedExperience });
      if (res.success) {
        setProfile(prev => ({ ...prev, experience: res.user.experience }));
        setExpForm({ company: '', title: '', duration: '', description: '' });
        setShowExpModal(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to add experience');
    }
  };

  // Add Education
  const handleAddEducation = async (e) => {
    e.preventDefault();
    try {
      const updatedEducation = [...(profile.education || []), eduForm];
      const res = await api.put('/api/users/profile', { education: updatedEducation });
      if (res.success) {
        setProfile(prev => ({ ...prev, education: res.user.education }));
        setEduForm({ school: '', degree: '', fieldOfStudy: '', duration: '' });
        setShowEduModal(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to add education');
    }
  };

  // Add Achievement
  const handleAddAchievement = async (e) => {
    e.preventDefault();
    try {
      const updatedAch = [...(profile.achievements || []), achForm];
      const res = await api.put('/api/users/profile', { achievements: updatedAch });
      if (res.success) {
        setProfile(prev => ({ ...prev, achievements: res.user.achievements }));
        setAchForm({ title: '', issuer: '', date: '', description: '' });
        setShowAchModal(false);
      }
    } catch (err) {
      alert(err.message || 'Failed to add achievement');
    }
  };

  // Remove Resume item
  const handleRemoveResumeItem = async (listName, index) => {
    if (!window.confirm('Delete this entry?')) return;
    try {
      const list = [...(profile[listName] || [])];
      list.splice(index, 1);
      const res = await api.put('/api/users/profile', { [listName]: list });
      if (res.success) {
        setProfile(prev => ({ ...prev, [listName]: res.user[listName] }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

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
        fetchProfileDetails();
      }
    } catch (err) {
      setUploadError(err.message || 'Upload failed.');
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
      const res = await api.post('/api/applications', {
        projectId: selectedProject,
        proposal: `[DIRECT HIRE PROPOSAL] ${proposalText}`
      });

      if (res.success) {
        setHireSuccess(true);
        setProposalText('');
        // Trigger notification check
        await api.post('/api/notifications', {
          recipientId: profile?._id || profile?.id || id,
          type: 'hire',
          message: `${user.name} invited you to pitch for "${recruiterProjects.find(p => p._id === selectedProject)?.title}"`,
          referenceId: selectedProject
        });
      }
    } catch (err) {
      setHireError(err.message || 'Failed to submit invitation.');
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
        <h4 className="text-lg font-bold text-white mb-2">Profile Unreachable</h4>
        <p className="text-sm text-zinc-400">{error || 'This user profile does not exist.'}</p>
        <Link to="/explore-creators" className="inline-block mt-6 text-xs text-primary-glow font-semibold hover:underline">
          &larr; Back to Creators
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white space-y-8">
      
      {/* Visual profile header banner card */}
      <div className="glass-panel rounded-2xl border border-border/80 overflow-hidden relative bg-zinc-950">
        {/* Cover banner */}
        <div className="h-40 w-full bg-gradient-to-r from-violet-900 via-zinc-950 to-black relative">
          {profile.coverBanner && (
            <img src={profile.coverBanner} alt="banner" className="w-full h-full object-cover" />
          )}
        </div>

        <div className="p-6 md:p-8 relative z-10 flex flex-col md:flex-row gap-6 items-start justify-between -mt-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-5 text-center md:text-left">
            {profile.profileImage ? (
              <img 
                src={profile.profileImage} 
                alt={profile.name} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-zinc-950 object-cover shadow-2xl bg-zinc-900" 
              />
            ) : (
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-zinc-900 border-4 border-zinc-950 text-primary-glow flex items-center justify-center font-bold text-3xl shadow-xl">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="pt-16 md:pt-14 space-y-3">
              <div>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <h2 className="text-2xl font-extrabold text-white tracking-tight">{profile.name}</h2>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(profile.category)}`}>
                    {profile.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">{profile.headline || 'Visual Creator'}</p>
                {profile.location && (
                  <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 justify-center md:justify-start font-mono">
                    <MapPin className="w-3.5 h-3.5 text-zinc-600" />
                    <span>{profile.location}</span>
                  </p>
                )}
              </div>

              {/* Roster counts */}
              <div className="flex gap-4 text-xs font-mono justify-center md:justify-start text-zinc-400 pt-1">
                <span><strong className="text-white">{followers.length}</strong> followers</span>
                <span><strong className="text-white">{following.length}</strong> following</span>
              </div>

              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed pt-1">
                {profile.bio || 'This creator hasn\'t updated their bio workspace description yet.'}
              </p>

              {/* Skills section */}
              {profile.skills && profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center md:justify-start pt-2">
                  {profile.skills.map((skill, idx) => (
                    <span key={idx} className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="w-full md:w-auto flex flex-col gap-2 pt-16 md:pt-14 self-center md:self-start">
            {/* Availability status badge */}
            <div className={`flex items-center justify-center gap-1.5 text-[10px] py-1.5 px-3 rounded-lg border font-mono ${
              profile.availability 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                : 'bg-zinc-800 text-zinc-500 border-zinc-700'
            }`}>
              {profile.availability ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{profile.availability ? 'OPEN FOR CONTRACTS' : 'UNAVAILABLE'}</span>
            </div>

            {/* Contextual Action buttons */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {!isOwner && (
                <>
                  <button
                    onClick={handleFollowToggle}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${isFollowing ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-primary border-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-primary/25'}`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  <Link
                    to={`/messages?userId=${id}`}
                    onClick={async () => {
                      // seed basic convo start
                      await api.post('/api/messages', { recipientId: id, text: `Hello, checked your portfolio! Let's collaborate.` });
                    }}
                    className="py-2 px-3 text-xs font-bold rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-center text-zinc-300 hover:text-white"
                  >
                    Message
                  </Link>
                </>
              )}

              {isOwner && (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-4 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-primary/30 transition-all duration-200"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Upload Media</span>
                </button>
              )}

              {!isOwner && user?.role === 'Recruiter' && (
                <button
                  onClick={() => setShowHireModal(true)}
                  disabled={!profile.availability}
                  className="col-span-2 py-2 px-4 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-lg transition disabled:opacity-50"
                >
                  Hire Creator
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-border/40 gap-4 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'portfolio', label: 'Portfolio Grid', icon: FileText },
          { id: 'posts', label: 'Posts & Updates', icon: MessageSquare },
          { id: 'resume', label: 'Experience & Education', icon: Briefcase }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 pb-2 text-xs font-bold border-b-2 transition ${activeTab === tab.id ? 'border-primary text-primary-glow' : 'border-transparent text-zinc-400 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      <div>
        
        {/* Portfolio Showcase Grid */}
        {activeTab === 'portfolio' && (
          <div>
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
              <div className="glass-panel p-16 text-center rounded-2xl border border-zinc-900 bg-zinc-950">
                <UploadCloud className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-white mb-1">No Projects Showcased</h4>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  {isOwner 
                    ? 'Start building your professional identity by uploading your best artwork and game designs.'
                    : 'This creator hasn\'t uploaded any portfolio projects yet.'
                  }
                </p>
              </div>
            )}
          </div>
        )}

        {/* Social Updates / Posts */}
        {activeTab === 'posts' && (
          <div className="max-w-3xl mx-auto space-y-6">
            {posts.length > 0 ? (
              posts.map(post => (
                <div key={post._id} className="glass-panel p-4 rounded-xl border border-zinc-900 bg-zinc-950/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 font-semibold">{post.category}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <h4 className="text-xs font-bold text-white">{post.title}</h4>
                  <p className="text-xs text-zinc-300 leading-relaxed">{post.caption}</p>
                  
                  {post.media && post.media.length > 0 && (
                    <div className="rounded-lg overflow-hidden border border-zinc-900 bg-black">
                      <img src={post.media[0]} alt="Post media" className="w-full max-h-[220px] object-cover" />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="glass-panel p-12 text-center rounded-xl border border-zinc-900 bg-zinc-950/40 text-zinc-500 text-xs">
                <span>No posts published by this creator yet.</span>
              </div>
            )}
          </div>
        )}

        {/* Resume: Education & Experience */}
        {activeTab === 'resume' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            
            {/* Experience Panel */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary-glow" />
                  <span>Work Experience</span>
                </h4>
                {isOwner && (
                  <button 
                    onClick={() => setShowExpModal(true)}
                    className="p-1 rounded hover:bg-zinc-900 text-primary-glow"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {profile.experience && profile.experience.length > 0 ? (
                  profile.experience.map((exp, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-900/60 relative">
                      {isOwner && (
                        <button 
                          onClick={() => handleRemoveResumeItem('experience', idx)}
                          className="absolute top-3 right-3 text-zinc-650 hover:text-red-400 p-1 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <h5 className="text-xs font-bold text-white">{exp.title}</h5>
                      <p className="text-[10px] text-zinc-400 font-semibold">{exp.company} • {exp.duration}</p>
                      <p className="text-xs text-zinc-500 mt-2 leading-relaxed">{exp.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-500 italic">No experience records listed.</p>
                )}
              </div>
            </div>

            {/* Education & Achievements Panel */}
            <div className="space-y-8">
              
              {/* Education */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary-glow" />
                    <span>Education</span>
                  </h4>
                  {isOwner && (
                    <button 
                      onClick={() => setShowEduModal(true)}
                      className="p-1 rounded hover:bg-zinc-900 text-primary-glow"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {profile.education && profile.education.length > 0 ? (
                    profile.education.map((edu, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-900/60 relative">
                        {isOwner && (
                          <button 
                            onClick={() => handleRemoveResumeItem('education', idx)}
                            className="absolute top-3 right-3 text-zinc-650 hover:text-red-400 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <h5 className="text-xs font-bold text-white">{edu.school}</h5>
                        <p className="text-[10px] text-zinc-400 font-semibold">{edu.degree} in {edu.fieldOfStudy} • {edu.duration}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No education records listed.</p>
                  )}
                </div>
              </div>

              {/* Achievements */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-primary-glow" />
                    <span>Achievements & Certs</span>
                  </h4>
                  {isOwner && (
                    <button 
                      onClick={() => setShowAchModal(true)}
                      className="p-1 rounded hover:bg-zinc-900 text-primary-glow"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {profile.achievements && profile.achievements.length > 0 ? (
                    profile.achievements.map((ach, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-900/60 relative">
                        {isOwner && (
                          <button 
                            onClick={() => handleRemoveResumeItem('achievements', idx)}
                            className="absolute top-3 right-3 text-zinc-650 hover:text-red-400 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <h5 className="text-xs font-bold text-white">{ach.title}</h5>
                        <p className="text-[10px] text-zinc-400 font-semibold">{ach.issuer} • {ach.date}</p>
                        <p className="text-xs text-zinc-500 mt-2">{ach.description}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-zinc-500 italic">No achievements listed.</p>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* Resume Building Modals */}
      {showExpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-zinc-900 bg-zinc-950 relative">
            <button onClick={() => setShowExpModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h4 className="text-sm font-bold text-white mb-4">Add Work Experience</h4>
            <form onSubmit={handleAddExperience} className="space-y-3">
              <input type="text" placeholder="Job Title" required value={expForm.title} onChange={e => setExpForm({ ...expForm, title: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <input type="text" placeholder="Company Name" required value={expForm.company} onChange={e => setExpForm({ ...expForm, company: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <input type="text" placeholder="Duration (e.g. 2024 - Present)" required value={expForm.duration} onChange={e => setExpForm({ ...expForm, duration: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <textarea placeholder="Job Description..." rows="3" value={expForm.description} onChange={e => setExpForm({ ...expForm, description: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <button type="submit" className="w-full py-2 bg-primary text-white text-xs font-semibold rounded">Save Entry</button>
            </form>
          </div>
        </div>
      )}

      {showEduModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-zinc-900 bg-zinc-950 relative">
            <button onClick={() => setShowEduModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h4 className="text-sm font-bold text-white mb-4">Add Education</h4>
            <form onSubmit={handleAddEducation} className="space-y-3">
              <input type="text" placeholder="School/University" required value={eduForm.school} onChange={e => setEduForm({ ...eduForm, school: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <input type="text" placeholder="Degree (e.g. Bachelor's)" required value={eduForm.degree} onChange={e => setEduForm({ ...eduForm, degree: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <input type="text" placeholder="Field of Study" required value={eduForm.fieldOfStudy} onChange={e => setEduForm({ ...eduForm, fieldOfStudy: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <input type="text" placeholder="Duration (e.g. 2020 - 2024)" required value={eduForm.duration} onChange={e => setEduForm({ ...eduForm, duration: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <button type="submit" className="w-full py-2 bg-primary text-white text-xs font-semibold rounded">Save Entry</button>
            </form>
          </div>
        </div>
      )}

      {showAchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-zinc-900 bg-zinc-950 relative">
            <button onClick={() => setShowAchModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h4 className="text-sm font-bold text-white mb-4">Add Achievement</h4>
            <form onSubmit={handleAddAchievement} className="space-y-3">
              <input type="text" placeholder="Award/Certificate Title" required value={achForm.title} onChange={e => setAchForm({ ...achForm, title: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <input type="text" placeholder="Issuer Organization" required value={achForm.issuer} onChange={e => setAchForm({ ...achForm, issuer: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <input type="text" placeholder="Date (e.g. June 2025)" required value={achForm.date} onChange={e => setAchForm({ ...achForm, date: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <textarea placeholder="Brief details..." rows="3" value={achForm.description} onChange={e => setAchForm({ ...achForm, description: e.target.value })} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded text-xs text-white" />
              <button type="submit" className="w-full py-2 bg-primary text-white text-xs font-semibold rounded">Save Entry</button>
            </form>
          </div>
        </div>
      )}

      {/* Creator Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-border relative overflow-hidden shadow-2xl bg-zinc-950">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-md font-bold text-white mb-4">Add Portfolio Item</h3>
            {uploadError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">{uploadError}</div>}
            <form onSubmit={handleAddPortfolio} className="space-y-4">
              <input type="text" name="title" required value={portfolioForm.title} onChange={handlePortfolioFormChange} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-white" placeholder="Title" />
              <textarea name="description" rows="3" required value={portfolioForm.description} onChange={handlePortfolioFormChange} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-white" placeholder="Description" />
              <input type="file" name="media" accept="image/*,video/*" required onChange={handlePortfolioFormChange} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg text-xs text-zinc-400 file:bg-zinc-800 file:text-white file:border-0" />
              <button type="submit" disabled={uploadLoading} className="w-full py-2 bg-primary text-white text-xs font-semibold rounded">{uploadLoading ? 'Uploading...' : 'Publish'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Recruiter Direct Hire Modal */}
      {showHireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-border relative overflow-hidden shadow-2xl bg-zinc-950">
            <button onClick={() => setShowHireModal(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            <h3 className="text-md font-bold text-white mb-4 font-display">Send Project Invitation</h3>
            {hireError && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4">{hireError}</div>}
            {hireSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-white">Invitation Dispatched!</h4>
                <button onClick={() => { setShowHireModal(false); setHireSuccess(false); }} className="px-4 py-2 bg-zinc-800 text-white rounded text-xs">Close</button>
              </div>
            ) : recruiterProjects.length > 0 ? (
              <form onSubmit={handleSendInvitation} className="space-y-4">
                <select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-white">
                  {recruiterProjects.map(p => <option key={p._id} value={p._id}>{p.title} (${p.budget})</option>)}
                </select>
                <textarea rows="4" required value={proposalText} onChange={e => setProposalText(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs text-white" placeholder={`Describe what you like about ${profile.name}'s portfolio and why they fit...`} />
                <button type="submit" disabled={hireLoading} className="w-full py-2 bg-white text-black text-xs font-bold rounded">{hireLoading ? 'Sending...' : 'Invite to Project'}</button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Briefcase className="w-10 h-10 text-zinc-600 mx-auto" />
                <h4 className="text-xs font-bold text-zinc-400">No Open Projects Found</h4>
                <Link to="/dashboard" className="inline-block px-4 py-2 bg-primary text-white rounded text-xs font-semibold">Post a Project Listing</Link>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CreatorProfile;
