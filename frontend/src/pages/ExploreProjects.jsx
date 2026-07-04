import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CREATOR_CATEGORIES } from '../utils/categories';
import ProjectCard from '../components/ProjectCard';
import { 
  Search, SlidersHorizontal, Briefcase, RefreshCw, 
  DollarSign, MapPin, Grid, Layers, Bookmark 
} from 'lucide-react';

const ExploreProjects = () => {
  const { user } = useAuth();
  
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
          // latest
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

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
            Marketplace Board
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Explore Project Gigs
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            Apply to open gigs, design contracts, and film collaborations posted by companies.
          </p>
        </div>

        {/* Tab Filters */}
        <div className="flex gap-1.5 p-1 bg-zinc-950 border border-border rounded-xl w-fit">
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

      {/* Filter and Search Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-border space-y-4 shadow-lg">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-4">
          {/* Keyword Search */}
          <div className="flex-grow relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by keywords, titles, or tags..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500"
            />
          </div>

          {/* Location Filters */}
          <div className="w-full lg:w-44">
            <select
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-zinc-300 focus:outline-none focus:border-primary"
            >
              <option value="">All Work Types</option>
              <option value="Remote">Remote</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Onsite">Onsite</option>
            </select>
          </div>

          {/* Budget Range Inputs */}
          <div className="flex gap-2 items-center w-full lg:w-64">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500 text-xs">$</span>
              <input
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="Min"
                className="w-full pl-6 pr-2 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500 font-mono"
              />
            </div>
            <span className="text-zinc-650 text-xs font-semibold">to</span>
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500 text-xs">$</span>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Max"
                className="w-full pl-6 pr-2 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500 font-mono"
              />
            </div>
          </div>

          {/* Search Button Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-primary/30 transition duration-200"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2.5 bg-zinc-900 border border-border hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
              title="Reset Filters"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Categories Bar */}
        <div className="pt-3 border-t border-border/40 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-semibold">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Creative Sector Category:</span>
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-3 py-1.5 bg-zinc-950 border border-border rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-primary"
          >
            <option value="">All Categories</option>
            {CREATOR_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Marketplace Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-64 rounded-2xl bg-zinc-900/60 border border-zinc-800" />
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <ProjectCard key={proj._id} project={proj} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-16 text-center rounded-2xl border border-border max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-zinc-600 mx-auto mb-3 animate-pulse" />
          <h4 className="text-base font-bold text-white mb-1">No Projects Found</h4>
          <p className="text-sm text-zinc-400">Try adjusting your budget limits or resetting search keywords.</p>
        </div>
      )}
    </div>
  );
};

export default ExploreProjects;
