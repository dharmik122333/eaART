import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CREATOR_CATEGORIES } from '../utils/categories';
import ProjectCard from '../components/ProjectCard';
import { 
  Search, SlidersHorizontal, Briefcase, RefreshCw, 
  DollarSign, MapPin, Grid, Layers, Bookmark, ArrowRight, CheckCircle, Users
} from 'lucide-react';

const ExploreProjects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [workType, setWorkType] = useState(''); // Remote / Hybrid / Onsite
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sortTab, setSortTab] = useState('latest'); // latest, trending, saved

  // Projects roster
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (workType) queryParams.append('workType', workType);
      if (minBudget) queryParams.append('minBudget', minBudget);
      if (maxBudget) queryParams.append('maxBudget', maxBudget);

      const res = await api.get(`/api/projects?${queryParams.toString()}`);
      if (res.success) {
        let list = res.projects || [];
        
        // Handle sorting / tab views on client side
        if (sortTab === 'trending') {
          list.sort((a, b) => (b.applicantsCount || 0) - (a.applicantsCount || 0));
        } else if (sortTab === 'saved') {
          if (user) {
            list = list.filter(p => p.savedBy && p.savedBy.includes(user.id));
          } else {
            list = [];
          }
        } else {
          list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        setProjects(list);
      }
    } catch (err) {
      setError(err.message || 'Failed to search project boards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [category, workType, sortTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setWorkType('');
    setMinBudget('');
    setMaxBudget('');
    setSortTab('latest');
  };

  // Extract featured project for large banner
  const featuredProject = projects.length > 0 ? projects[0] : null;
  // Remaining projects for grid
  const gridProjects = projects.length > 1 ? projects.slice(1) : projects;
  // Similar/Suggested projects panel
  const suggestedProjects = projects.length > 2 ? projects.slice(0, 3) : projects;

  const mockCompanies = [
    { name: 'Nexus Unreal Studio', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100', openRoles: 3, field: 'Unreal Engine Gaming' },
    { name: 'Zenith Studios', logo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100', openRoles: 1, field: 'Sci-Fi Film Editing' },
    { name: 'Hyperlight Corp', logo: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=100', openRoles: 2, field: 'WebGL Streetwear Web' }
  ];

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-black text-white min-h-screen">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-900 pb-6">
        <div>
          <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
            Marketplace Board
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Explore Open Gigs
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Apply to design contracts, WebGL developments, and cinematic film editing openings.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 p-1 bg-zinc-950 border border-zinc-900 rounded-xl w-fit">
          {[
            { id: 'latest', label: 'Latest' },
            { id: 'trending', label: 'Trending' },
            { id: 'saved', label: 'Saved' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSortTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                sortTab === tab.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'text-zinc-400 hover:text-white bg-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* FEATURED GIG: Large Premium Banner */}
      {featuredProject && !search && !category && (
        <div className="glass-panel rounded-3xl border border-primary/20 overflow-hidden relative min-h-[300px] flex flex-col md:flex-row bg-zinc-950">
          {/* Cover image bg side */}
          <div className="w-full md:w-1/2 relative bg-zinc-900 min-h-[200px] md:min-h-full">
            {featuredProject.coverImage ? (
              <img src={featuredProject.coverImage} alt={featuredProject.title} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-purple-950/60 to-indigo-950/60" />
            )}
            <div className="absolute top-4 left-4">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary-glow border border-primary/30 px-2.5 py-0.5 rounded">
                Featured Gig
              </span>
            </div>
          </div>

          {/* Details side */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-bold text-white">{featuredProject.companyName || 'Independent Recruiter'}</span>
                <span>•</span>
                <span>{featuredProject.location || 'Remote'}</span>
              </div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">{featuredProject.title}</h3>
              <p className="text-xs text-zinc-450 leading-relaxed line-clamp-3">{featuredProject.description}</p>
              
              <div className="flex flex-wrap gap-1.5 pt-2">
                {featuredProject.requiredSkills.slice(0, 3).map(skill => (
                  <span key={skill} className="text-[9px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-350 font-mono">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-zinc-900">
              <div>
                <span className="text-[8px] text-zinc-550 uppercase tracking-widest font-bold block">Allocated Budget</span>
                <span className="text-sm font-bold text-emerald-450 font-mono">${featuredProject.budget.toLocaleString()}</span>
              </div>
              <Link 
                to={`/project/${featuredProject._id}`}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-lg hover:shadow-primary/30 transition duration-200"
              >
                Apply Details
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Filters + Projects + Sidebars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: Filters & Projects Grid (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Filters Panel */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-950 space-y-4">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by keywords, titles, or tags..."
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-zinc-700 placeholder-zinc-500"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
              </div>
              
              <div className="flex gap-2">
                <select
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-xl px-3 py-2 outline-none hover:text-white"
                >
                  <option value="">All Gigs</option>
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>

                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-xl px-3 py-2 outline-none hover:text-white"
                >
                  <option value="">All Fields</option>
                  {CREATOR_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="p-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl transition"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Projects Listing Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
              {[1, 2].map(n => (
                <div key={n} className="h-60 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
              ))}
            </div>
          ) : gridProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {gridProjects.map(proj => (
                <ProjectCard key={proj._id} project={proj} />
              ))}
            </div>
          ) : (
            <div className="glass-panel p-16 text-center rounded-2xl border border-zinc-900 max-w-md mx-auto">
              <Briefcase className="w-12 h-12 text-zinc-650 mx-auto mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-white mb-1">No Projects Found</h4>
              <p className="text-xs text-zinc-400">Try adjusting your filters or resetting search keywords.</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Recruiter Profile & Suggested Projects (1/3 width) */}
        <div className="space-y-6">
          
          {/* Companies Hiring / Recruiter Profile panel */}
          <div className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-950/70 space-y-4 animate-slideIn">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-primary-glow" />
              <span>Hiring Recruiter Studios</span>
            </h3>

            <div className="space-y-4">
              {mockCompanies.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{comp.name}</h4>
                      <span className="text-[9px] text-zinc-500 block truncate">{comp.field}</span>
                    </div>
                  </div>

                  <span className="flex-shrink-0 text-[8px] bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 px-1.5 py-0.5 rounded font-mono font-bold">
                    {comp.openRoles} roles
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggested Similar Gigs panel */}
          {suggestedProjects.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-950/70 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-550 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary-glow" />
                <span>Suggested Similar Gigs</span>
              </h3>

              <div className="space-y-3">
                {suggestedProjects.map(proj => (
                  <div key={proj._id} className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-3">
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate hover:underline hover:text-primary-glow">
                        <Link to={`/project/${proj._id}`}>{proj.title}</Link>
                      </h4>
                      <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono mt-1">
                        <span>${proj.budget.toLocaleString()}</span>
                        <span>•</span>
                        <span className="truncate">{proj.workType}</span>
                      </div>
                    </div>

                    <Link 
                      to={`/project/${proj._id}`}
                      className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white"
                      title="View details"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default ExploreProjects;
