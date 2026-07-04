import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { CREATOR_CATEGORIES } from '../utils/categories';
import CreatorCard from '../components/CreatorCard';
import { Search, SlidersHorizontal, Users, RefreshCw } from 'lucide-react';

const ExploreCreators = () => {
  const location = useLocation();
  
  // Extract initial category filter from search parameters (e.g. from LandingPage)
  const getInitialCategory = () => {
    const params = new URLSearchParams(location.search);
    return params.get('category') || '';
  };

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(getInitialCategory());
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('');
  
  // Roster States
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCreators = async () => {
    setLoading(true);
    setError('');
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (category) queryParams.append('category', category);
      if (skills) queryParams.append('skills', skills);
      if (availability) queryParams.append('availability', availability);

      const res = await api.get(`/api/users/creators?${queryParams.toString()}`);
      if (res.success) {
        setCreators(res.creators || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to search creator rosters.');
    } finally {
      setLoading(false);
    }
  };

  // Run fetch on mount and whenever parameters change
  useEffect(() => {
    fetchCreators();
  }, [category, availability]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCreators();
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('');
    setSkills('');
    setAvailability('');
    // The useEffect will trigger reload because category changes
    if (category === '' && availability === '') {
      // Force fetch if category and availability were already empty
      fetchCreators();
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
          Talent Pool
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-1">
          Explore Creators
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Discover developers, artists, sound engineers, and creative leads worldwide.
        </p>
      </div>

      {/* Filter and Search Bar Panel */}
      <div className="glass-panel p-6 rounded-xl border border-border space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-4">
          {/* Keyword Search */}
          <div className="flex-grow relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, location, or bio keywords..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500"
            />
          </div>

          {/* Skill Tag filter */}
          <div className="w-full md:w-64">
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Filter by skill tags (e.g. Figma, React)..."
              className="w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-border text-sm text-white focus:outline-none focus:border-primary placeholder-zinc-500"
            />
          </div>

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

        {/* Dropdown Filters */}
        <div className="pt-2 border-t border-border/40 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
            <span>Filters:</span>
          </div>

          {/* Category Dropdown */}
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

          {/* Availability Select */}
          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            className="px-3 py-1.5 bg-zinc-950 border border-border rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-primary"
          >
            <option value="">Availability (All)</option>
            <option value="true">Open to Work</option>
            <option value="false">Unavailable</option>
          </select>
        </div>
      </div>

      {/* Creator Listing Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[30vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
        </div>
      ) : creators.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {creators.map((creator) => (
            <CreatorCard key={creator._id} creator={creator} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 text-center rounded-xl border border-border max-w-lg mx-auto">
          <Users className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
          <h4 className="text-base font-bold text-white mb-1">No Creators Found</h4>
          <p className="text-sm text-zinc-400">Try adjusting your filters or expanding your search tags.</p>
        </div>
      )}
    </div>
  );
};

export default ExploreCreators;
