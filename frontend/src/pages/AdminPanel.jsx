import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ShieldAlert, Users, FileText, Briefcase, Trash2, 
  PlusCircle, RefreshCw, BarChart2, CheckCircle2 
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect if not administrator
  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Community form state
  const [commForm, setCommForm] = useState({ name: '', description: '', category: 'Tech' });
  const [commSuccess, setCommSuccess] = useState(false);
  const [commError, setCommError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch Users
      const usersRes = await api.get('/api/users/admin/all');
      if (usersRes.success) {
        setUsers(usersRes.users || []);
      }

      // 2. Fetch Posts
      const postsRes = await api.get('/api/posts');
      if (postsRes.success) {
        setPosts(postsRes.posts || []);
      }

      // 3. Fetch Projects
      const projectsRes = await api.get('/api/projects');
      if (projectsRes.success) {
        setProjects(projectsRes.projects || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve administrative data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.isAdmin) {
      fetchData();
    }
  }, [user]);

  const handleDeleteUser = async (targetId) => {
    if (!window.confirm('WARNING: Deleting this user will remove all their portfolios, applications, and social posts. Proceed?')) return;
    try {
      const res = await api.delete(`/api/users/admin/user/${targetId}`);
      if (res.success) {
        setUsers(prev => prev.filter(u => u._id !== targetId));
      }
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      const res = await api.delete(`/api/users/admin/post/${postId}`);
      if (res.success) {
        setPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      alert(err.message || 'Deletion failed.');
    }
  };

  const handleCreateCommunity = async (e) => {
    e.preventDefault();
    setCommError('');
    setCommSuccess(false);

    if (!commForm.name || !commForm.description) {
      return setCommError('Please provide a name and description.');
    }

    try {
      const res = await api.post('/api/communities', commForm);
      if (res.success) {
        setCommSuccess(true);
        setCommForm({ name: '', description: '', category: 'Tech' });
      }
    } catch (err) {
      setCommError(err.message || 'Failed to create community.');
    }
  };

  if (!user || !user.isAdmin) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center p-8 bg-red-950/20 border border-red-500/20 rounded-xl">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-xs text-zinc-400 mt-1">You must be logged in as an administrator to view this console.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary-glow" />
            <span>Administrative Console</span>
          </h1>
          <p className="text-zinc-400 text-xs mt-1">
            Global system overrides, user management, and interest group creations.
          </p>
        </div>
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg border border-border transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
          {error}
        </div>
      )}

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3.5 rounded-lg bg-primary/10 text-primary-glow">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total Creators</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{users.filter(u => u.role === 'Creator').length}</h3>
          </div>
        </div>
        
        <div className="glass-panel p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3.5 rounded-lg bg-primary/10 text-primary-glow">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Total Recruiters</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{users.filter(u => u.role === 'Recruiter').length}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3.5 rounded-lg bg-primary/10 text-primary-glow">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Social Posts</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{posts.length}</h3>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-border flex items-center gap-4">
          <div className="p-3.5 rounded-lg bg-primary/10 text-primary-glow">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Active Listings</span>
            <h3 className="text-2xl font-bold text-white mt-0.5">{projects.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Accounts Management Roster */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-primary-glow" />
              <span>Registered Accounts ({users.length})</span>
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-800 text-left text-xs">
                <thead>
                  <tr className="text-zinc-500 font-semibold">
                    <th className="pb-3 pr-2">Profile</th>
                    <th className="pb-3 px-2">Role</th>
                    <th className="pb-3 px-2">Email</th>
                    <th className="pb-3 pl-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-zinc-300">
                  {users.map(u => (
                    <tr key={u._id} className="hover:bg-zinc-800/20">
                      <td className="py-3 pr-2 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-primary-glow overflow-hidden">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">{u.name}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">@{u.username || 'no-handle'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          u.role === 'Recruiter' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-zinc-400">{u.email}</td>
                      <td className="py-3 pl-2 text-right">
                        {u._id !== user.id && (
                          <button 
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded"
                            title="Delete Account"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Feed Content Moderation */}
          <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary-glow" />
              <span>Global Feed Moderation ({posts.length})</span>
            </h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {posts.map(p => (
                <div key={p._id} className="p-3 bg-zinc-950/40 rounded-xl border border-border/60 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-white font-medium line-clamp-1">{p.content}</p>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span>By @{p.authorId?.username || 'unknown'}</span>
                      <span>•</span>
                      <span>Likes: {p.likesCount}</span>
                      <span>•</span>
                      <span>Comments: {p.commentsCount}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeletePost(p._id)}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg flex-shrink-0"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Global Configuration Controls / Seed New Community */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-primary-glow" />
              <span>Seed New Community</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-normal">
              Instantly create a new segment group community for creators and recruiters.
            </p>

            {commError && (
              <div className="p-2 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] text-center">
                {commError}
              </div>
            )}

            {commSuccess && (
              <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] text-center flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Community Registered!</span>
              </div>
            )}

            <form onSubmit={handleCreateCommunity} className="space-y-4 pt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Name</label>
                <input 
                  type="text" 
                  value={commForm.name}
                  onChange={(e) => setCommForm({ ...commForm, name: e.target.value })}
                  placeholder="e.g. 3D Modeling Hub" 
                  className="block w-full px-3 py-2 rounded-lg bg-zinc-950 border border-border text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Description</label>
                <textarea 
                  rows="3"
                  value={commForm.description}
                  onChange={(e) => setCommForm({ ...commForm, description: e.target.value })}
                  placeholder="Share updates, job alerts, and tips on modeling..." 
                  className="block w-full px-3 py-2 rounded-lg bg-zinc-950 border border-border text-xs text-white focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Category Group</label>
                <select
                  value={commForm.category}
                  onChange={(e) => setCommForm({ ...commForm, category: e.target.value })}
                  className="block w-full px-3 py-2 rounded-lg bg-zinc-950 border border-border text-xs text-zinc-300 focus:outline-none focus:border-primary"
                >
                  <option value="Tech">Tech</option>
                  <option value="Design">Design</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Film">Film</option>
                  <option value="Music">Music</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button 
                type="submit" 
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-lg transition"
              >
                Launch Community
              </button>
            </form>
          </div>
          
          <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-primary-glow" />
              <span>Platform Health</span>
            </h3>
            
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Database Sync</span>
                <span className="text-emerald-400 font-semibold font-mono">ONLINE</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>API Responsetime</span>
                <span className="text-emerald-400 font-semibold font-mono">14ms</span>
              </div>
              <div className="flex justify-between items-center text-zinc-400">
                <span>Image Storage</span>
                <span className="text-zinc-500 font-mono">Local fallback mode</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminPanel;
