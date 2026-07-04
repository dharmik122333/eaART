import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CREATOR_CATEGORIES } from '../utils/categories';
import ProjectCard from '../components/ProjectCard';
import { Link } from 'react-router-dom';
import { 
  Briefcase, FileText, CheckCircle, Clock, AlertCircle, Plus, 
  MapPin, Clipboard, ToggleLeft, ToggleRight, DollarSign, Calendar, X,
  TrendingUp, Eye, Activity, Award
} from 'lucide-react';

const Dashboard = () => {
  const { user, updateProfile } = useAuth();
  
  // States
  const [data, setData] = useState([]); // Projects
  const [applications, setApplications] = useState([]); // Submitted applications
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  
  // Create Project Form State
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    budget: '',
    deadline: '',
    requiredSkills: '',
    category: CREATOR_CATEGORIES[0]
  });

  // Fetch Dashboard details based on role
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (user.role === 'Creator') {
        const projData = await api.get(`/api/projects?category=${encodeURIComponent(user.category)}`);
        setData(projData.projects || []);

        const appsData = await api.get('/api/applications/my');
        setApplications(appsData.applications || []);
      } else {
        const projData = await api.get('/api/projects/recruiter/my');
        setData(projData.projects || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  // Toggle Availability for Creator
  const handleToggleAvailability = async () => {
    try {
      await updateProfile({ availability: !user.availability });
    } catch (err) {
      console.error('Failed to update availability status:', err.message);
    }
  };

  // Form handlers
  const handleFormChange = (e) => {
    setProjectForm({ ...projectForm, [e.target.name]: e.target.value });
    setFormError('');
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const { title, description, budget, deadline, category } = projectForm;

    if (!title || !description || !budget || !deadline || !category) {
      return setFormError('Please fill in all required fields.');
    }

    setSubmitting(true);
    setFormError('');

    try {
      const res = await api.post('/api/projects', projectForm);
      if (res.success) {
        setShowModal(false);
        setProjectForm({
          title: '',
          description: '',
          budget: '',
          deadline: '',
          requiredSkills: '',
          category: CREATOR_CATEGORIES[0]
        });
        fetchDashboardData(); // Refresh list
      }
    } catch (err) {
      setFormError(err.message || 'Failed to list project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project listing?')) {
      try {
        await api.delete(`/api/projects/${id}`);
        fetchDashboardData();
      } catch (err) {
        alert(err.message || 'Failed to delete listing.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  // Calculate mock stats
  const profileProgress = user ? (
    (user.profileImage ? 25 : 0) + 
    (user.bio ? 25 : 0) + 
    (user.skills?.length > 0 ? 25 : 0) + 
    (user.location ? 25 : 0)
  ) : 0;

  return (
    <div className="space-y-8">
      {/* Header Panel */}
      <div className="glass-panel p-8 rounded-2xl border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-[40%] bg-purple-glow opacity-30 blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
            Workspace Hub
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Hello, {user.name}
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            {user.role === 'Creator' 
              ? `Manage your portfolio availability and applications in ${user.category}.`
              : `Post contracts, manage listings, and evaluate candidates at ${user.organization || 'your organization'}.`
            }
          </p>
        </div>

        {/* Action Widgets */}
        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
          {user.role === 'Creator' ? (
            <>
              <button
                onClick={handleToggleAvailability}
                className={`flex items-center justify-center gap-3 px-5 py-3 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                  user.availability
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'
                }`}
              >
                {user.availability ? (
                  <>
                    <ToggleRight className="w-5 h-5" />
                    <span>Open for Work</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5" />
                    <span>Unavailable</span>
                  </>
                )}
              </button>
              <Link 
                to={`/creator/${user.id}`} 
                className="flex items-center justify-center gap-2 px-5 py-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-semibold transition"
              >
                View Live Roster Card
              </Link>
            </>
          ) : (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Post a Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Analytics widgets (Maximalist) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Widget 1 */}
        <div className="glass-panel p-6 rounded-xl border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-medium">Profile Performance</span>
            <span className="block text-2xl font-bold text-white mt-1">
              {user.profileViews || 0} Views
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>+18% from last week</span>
            </span>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg text-primary-glow border border-primary/20">
            <Eye className="w-5 h-5" />
          </div>
        </div>

        {/* Widget 2 */}
        <div className="glass-panel p-6 rounded-xl border border-border flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-500 font-medium">Activity Pulse</span>
            <span className="block text-2xl font-bold text-white mt-1">99.8%</span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-mono">
              <span>Excellent response rate</span>
            </span>
          </div>
          <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400 border border-cyan-500/20">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Widget 3 */}
        {user.role === 'Creator' ? (
          <div className="glass-panel p-6 rounded-xl border border-border flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-500 font-medium">Estimated Earnings</span>
              <span className="block text-2xl font-bold text-white mt-1">$4,850</span>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-mono">
                <span>Active contract escrow</span>
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        ) : (
          <div className="glass-panel p-6 rounded-xl border border-border flex items-center justify-between">
            <div>
              <span className="text-xs text-zinc-500 font-medium">Allocated Budget</span>
              <span className="block text-2xl font-bold text-white mt-1">
                ${data.reduce((acc, curr) => acc + curr.budget, 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-1 font-mono">
                <span>Across listed contracts</span>
              </span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        )}

        {/* Widget 4: Profile completeness score */}
        <div className="glass-panel p-6 rounded-xl border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium">Profile Score</span>
            <span className="text-xs font-mono font-bold text-primary-glow">{profileProgress}%</span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2 mt-2 border border-border overflow-hidden">
            <div 
              className="bg-gradient-to-r from-primary to-primary-glow h-full transition-all duration-500" 
              style={{ width: `${profileProgress}%` }}
            />
          </div>
          <Link to="/settings" className="text-[10px] text-zinc-400 hover:text-white transition duration-200 mt-2 block">
            Complete details to get higher search placement &rarr;
          </Link>
        </div>
      </div>

      {/* Creator Dashboard Content */}
      {user.role === 'Creator' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Area: Recommended Projects */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Recommended For You
              </h3>
              <Link to="/explore-projects" className="text-xs text-primary-glow font-semibold hover:underline">
                Browse Marketplace &rarr;
              </Link>
            </div>

            {data.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {data.map((proj) => (
                  <ProjectCard key={proj._id} project={proj} />
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center rounded-xl border border-border">
                <Briefcase className="w-8 h-8 text-zinc-655 mx-auto mb-3" />
                <p className="text-sm text-zinc-405">
                  No active projects found in <span className="text-white font-medium">{user.category}</span> right now.
                </p>
                <Link to="/explore-projects" className="inline-block mt-4 text-xs font-semibold text-primary-glow border border-primary/20 bg-primary/5 px-4 py-2 rounded-lg hover:bg-primary/20">
                  Explore other fields
                </Link>
              </div>
            )}
          </div>

          {/* Right Sidebar: Submitted Applications */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Active Proposals
              </h3>
              <Link to="/applications" className="text-xs text-primary-glow font-semibold hover:underline">
                View All
              </Link>
            </div>

            {applications.length > 0 ? (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app._id} className="glass-panel p-4 rounded-xl border border-border flex items-center justify-between gap-4">
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-white line-clamp-1 hover:text-primary-glow">
                        <Link to={`/project/${app.projectId?._id}`}>{app.projectId?.title || 'Deleted Project'}</Link>
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono mt-1">
                        Applied {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
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
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 text-center rounded-xl border border-border">
                <FileText className="w-8 h-8 text-zinc-655 mx-auto mb-3" />
                <p className="text-sm text-zinc-405">You haven't applied to any projects yet.</p>
                <Link to="/explore-projects" className="inline-block mt-4 text-xs font-semibold text-primary-glow hover:underline">
                  Browse Projects
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recruiter Dashboard Content */}
      {user.role === 'Recruiter' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-white tracking-tight">
            Your Active Project Listings
          </h3>

          {data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.map((proj) => (
                <div key={proj._id} className="glass-panel p-6 rounded-xl border border-border flex flex-col justify-between h-full group hover:border-primary/30 transition duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-mono uppercase font-bold text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                        {proj.category}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full capitalize ${
                        proj.status === 'open' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                      }`}>
                        {proj.status}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-2 line-clamp-1 hover:text-primary-glow transition duration-200">
                      <Link to={`/project/${proj._id}`}>{proj.title}</Link>
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-3 mb-6">
                      {proj.description}
                    </p>
                  </div>

                  <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Budget</span>
                      <span className="text-xs font-semibold text-white font-mono">${proj.budget.toLocaleString()}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link 
                        to={`/project/${proj._id}`}
                        className="text-xs px-3.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary-glow hover:bg-primary hover:text-white transition duration-200 font-semibold"
                      >
                        Candidates
                      </Link>
                      <button 
                        onClick={() => handleDeleteProject(proj._id)}
                        className="p-1.5 rounded-lg bg-red-950/20 hover:bg-red-500 hover:text-white text-red-400 border border-red-900/30 transition duration-200"
                        title="Delete listing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-panel p-12 text-center rounded-xl border border-border max-w-lg mx-auto">
              <Clipboard className="w-10 h-10 text-zinc-655 mx-auto mb-3" />
              <h4 className="text-base font-bold text-white mb-1">No Active Project Listings</h4>
              <p className="text-sm text-zinc-405">Post contracts to hire freelancers and creators on the platform.</p>
              <button 
                onClick={() => setShowModal(true)} 
                className="mt-6 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-hover shadow-lg shadow-primary/20"
              >
                Post Your First Project
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recruiter Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="glass-panel max-w-lg w-full p-6 rounded-2xl border border-border relative overflow-hidden shadow-2xl">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-4">Post a Project Listing</h3>

            {formError && (
              <div className="flex items-center gap-2 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium mb-4">
                <AlertCircle className="w-4 h-4" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Project Title</label>
                <input 
                  type="text" 
                  name="title" 
                  required 
                  value={projectForm.title} 
                  onChange={handleFormChange}
                  className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary"
                  placeholder="e.g. 3D Character Artist for Sci-fi RPG"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">Budget (USD)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 text-sm">$</span>
                    <input 
                      type="number" 
                      name="budget" 
                      required 
                      value={projectForm.budget} 
                      onChange={handleFormChange}
                      className="w-full pl-7 pr-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary"
                      placeholder="3500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">Category</label>
                  <select
                    name="category"
                    required
                    value={projectForm.category}
                    onChange={handleFormChange}
                    className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-zinc-300 focus:outline-none focus:border-primary"
                  >
                    {CREATOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">Deadline</label>
                  <input 
                    type="date" 
                    name="deadline" 
                    required 
                    value={projectForm.deadline} 
                    onChange={handleFormChange}
                    className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-zinc-300 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-zinc-300">Required Skills (Comma-separated)</label>
                  <input 
                    type="text" 
                    name="requiredSkills" 
                    value={projectForm.requiredSkills} 
                    onChange={handleFormChange}
                    className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary"
                    placeholder="React, Figma, Animation"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-zinc-300">Description</label>
                <textarea 
                  name="description" 
                  rows="4" 
                  required 
                  value={projectForm.description} 
                  onChange={handleFormChange}
                  className="px-3 py-2 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary"
                  placeholder="Outline project specs, timeline, expected deliverables, and guidelines..."
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition duration-200 disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : 'Publish Listing'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
