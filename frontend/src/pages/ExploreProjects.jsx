import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { CREATOR_CATEGORIES } from '../utils/categories';
import ProjectCard from '../components/ProjectCard';
import { Search, SlidersHorizontal, Briefcase, RefreshCw, DollarSign } from 'lucide-react';

const ExploreProjects = () => {
  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [skills, setSkills] = useState('');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');

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
      if (skills) queryParams.append('skills', skills);
      if (minBudget) queryParams.append('minBudget', minBudget);
      if (maxBudget) queryParams.append('maxBudget', maxBudget);

      const res = await api.get(`/api/projects?${queryParams.toString()}`);
      if (res.success) {
        setProjects(res.projects || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to search project boards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setSkills('');
    setMinBudget('');
    setMaxBudget('');
    if (category === '') {
      fetchProjects();
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
          Marketplace Board
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-1">
          Explore Projects
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Apply to open gigs, contracts, and collaborations posted by agencies and recruiters.
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="glass-panel p-6 rounded-xl border border-border space-y-4">
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
              placeholder="Search by keywords, title, or project summary..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500"
            />
          </div>

          {/* Skill Tag filtering */}
          <div className="w-full lg:w-56">
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Skills (React, Blender)..."
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500"
            />
          </div>

          {/* Budget Range Inputs */}
          <div className="flex gap-2 items-center w-full lg:w-72">
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500 text-xs">$</span>
              <input
                type="number"
                value={minBudget}
                onChange={(e) => setMinBudget(e.target.value)}
                placeholder="Min"
                className="w-full pl-6 pr-2 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500"
              />
            </div>
            <span className="text-zinc-600 text-xs">to</span>
            <div className="relative flex-grow">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-500 text-xs">$</span>
              <input
                type="number"
                value={maxBudget}
                onChange={(e) => setMaxBudget(e.target.value)}
                placeholder="Max"
                className="w-full pl-6 pr-2 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500"
              />
            </div>
          </div>

          {/* Search Button Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-sm font-semibold rounded-lg shadow-lg hover:shadow-primary/20 transition duration-200"
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
        <div className="pt-2 border-t border-border/40 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Category:</span>
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
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <ProjectCard key={proj._id} project={proj} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-xl border border-border max-w-lg mx-auto">
          <Briefcase className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">No Projects Found</h4>
          <p className="text-sm text-zinc-400">Try broadening your search or adjusting filters.</p>
        </div>
      )}
    </div>
  );
};

export default ExploreProjects;
