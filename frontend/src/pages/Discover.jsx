import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Users, Briefcase, Compass, ShieldAlert, 
  MapPin, Calendar, Award, ExternalLink, ArrowRight, UserPlus,
  Flame, TrendingUp, Sparkles, Gamepad2, Film, Music, Cpu, Camera, Shirt
} from 'lucide-react';
import CreatorCard from '../components/CreatorCard';
import ProjectCard from '../components/ProjectCard';

const Discover = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('explore'); // Default to 'explore' instead of 'creators'
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Lists
  const [creators, setCreators] = useState([]);
  const [projects, setProjects] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);

  // Mock Explore specific data
  const trendingTags = ['#UnrealEngine5', '#WebGL', '#BlenderArt', '#SynthWaves', '#IndieDev', '#VFXComedy', '#FashionInteractive'];
  const categories = [
    { name: 'Gaming', icon: Gamepad2, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
    { name: 'Film Industry', icon: Film, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { name: 'Music', icon: Music, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { name: 'Technology', icon: Cpu, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    { name: 'Photography', icon: Camera, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Fashion', icon: Shirt, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch users
      const userRes = await api.get(`/api/users/creators`);
      if (userRes.success) setCreators(userRes.creators);

      // Fetch projects
      const projRes = await api.get(`/api/projects`);
      if (projRes.success) setProjects(projRes.projects);

      // Fetch communities
      const commRes = await api.get('/api/communities');
      if (commRes.success) setCommunities(commRes.communities);

      // Fetch events
      const eveRes = await api.get('/api/events');
      if (eveRes.success) setEvents(eveRes.events);
    } catch (err) {
      console.error('Failed to load explore datasets:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJoinCommunity = async (id, joined) => {
    try {
      const endpoint = `/api/communities/${id}/${joined ? 'leave' : 'join'}`;
      const res = await api.post(endpoint);
      if (res.success) {
        setCommunities(prev => prev.map(c => {
          if (c._id === id) {
            const isMember = c.members.includes(user?.id);
            const members = isMember 
              ? c.members.filter(m => m !== user?.id) 
              : [...c.members, user?.id];
            return { ...c, members };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAttendEvent = async (id) => {
    try {
      const res = await api.post(`/api/events/${id}/attend`);
      if (res.success) {
        setEvents(prev => prev.map(e => {
          if (e._id === id) {
            return { ...e, attendees: [...e.attendees, user?.id] };
          }
          return e;
        }));
      }
    } catch (err) {
      alert(err.message || 'Already registered to attend');
    }
  };

  // Filters logic based on tab / searchQuery
  const filteredCreators = creators.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.username && c.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.bio && c.bio.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.skills && c.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredProjects = projects.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.requiredSkills && p.requiredSkills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 space-y-10">
      
      {/* Page Header Search Box */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
          Pinterest Directory Grid
        </span>
        <h1 className="text-4xl font-extrabold text-white tracking-tight font-display">
          Explore the <span className="text-primary-glow animate-pulse">Ecosystem</span>
        </h1>
        <p className="text-zinc-400 text-sm max-w-lg mx-auto">
          Discover rising talents, projects, virtual hackathons, and creative sector communities.
        </p>

        {/* Search Input Bar */}
        <div className="relative max-w-xl mx-auto pt-2">
          <input
            type="text"
            placeholder="Search creators, tech stacks, gaming assets, projects..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (activeTab === 'explore') setActiveTab('creators');
            }}
            className="w-full bg-zinc-900/60 border border-border focus:border-primary-glow rounded-xl py-3 pl-12 pr-4 text-sm outline-none text-white transition-all shadow-lg"
          />
          <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-5.5" />
        </div>
      </div>

      {/* Explore Tab Selectors */}
      <div className="flex items-center justify-center border-b border-border/40 pb-3 gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'explore', label: 'Instagram Explore', icon: Compass },
          { id: 'creators', label: 'Creators Directory', icon: Users },
          { id: 'projects', label: 'Project Gigs', icon: Briefcase },
          { id: 'communities', label: 'Sectors Hub', icon: Compass },
          { id: 'events', label: 'Jams & Meetups', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary/20 text-primary-glow border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.15)]' 
                  : 'bg-transparent border-transparent text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Grid View */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* TAB 1: Explore Landing Page (Pinterest/Instagram Redesign) */}
          {activeTab === 'explore' && (
            <div className="space-y-12">
              
              {/* Row 1: Trending Hashtags */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary-glow" />
                  <span>Trending Hashtags</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {trendingTags.map((tag) => (
                    <button 
                      key={tag}
                      onClick={() => { setSearchQuery(tag); setActiveTab('creators'); }}
                      className="px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white hover:border-zinc-700 transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Flame Banner and Featured Creators */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Flame Hero card */}
                <div className="lg:col-span-1 glass-panel p-6 rounded-2xl border border-primary/20 bg-primary/[0.02] flex flex-col justify-between h-[320px] relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-primary-glow/10 rounded-full filter blur-[40px] pointer-events-none" />
                  
                  <div className="space-y-2">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit text-primary-glow">
                      <Flame className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white tracking-tight pt-2">🔥 Trending Today</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Check out the highly rated sci-fi environment jams, colorist web reels, and creative technologies index.
                    </p>
                  </div>

                  <Link 
                    to="/feed" 
                    className="inline-flex items-center gap-2 text-xs font-bold text-primary-glow hover:underline mt-4"
                  >
                    <span>Browse Trending Feed</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Horizontal featured creators */}
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-glow" />
                    <span>Featured Creators</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {creators.slice(0, 4).map((c) => (
                      <Link 
                        to={`/profile/${c.username || c._id}`} 
                        key={c._id}
                        className="glass-panel p-4 rounded-xl border border-border flex items-center gap-3.5 hover:border-zinc-800 transition"
                      >
                        <div className="w-10 h-10 rounded-full bg-zinc-850 overflow-hidden flex items-center justify-center font-bold text-sm border border-primary/30">
                          {c.profileImage ? (
                            <img src={c.profileImage} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            c.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">{c.name}</h4>
                          <span className="text-[10px] text-primary-glow font-mono font-bold block mt-0.5">
                            @{c.username || 'no-handle'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

              </div>

              {/* Row 3: Pinterest Masonry Explore grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary-glow" />
                  <span>Pinterest Portfolio Showcase</span>
                </h3>

                <div className="columns-1 sm:columns-2 md:columns-3 gap-6 space-y-6">
                  {/* Grid items */}
                  {projects.map((p, idx) => (
                    <div 
                      key={p._id} 
                      className="break-inside-avoid glass-panel rounded-2xl border border-border overflow-hidden flex flex-col justify-between hover:scale-[1.01] transition-all duration-300"
                    >
                      {p.coverImage ? (
                        <img src={p.coverImage} alt={p.title} className="w-full max-h-44 object-cover" />
                      ) : (
                        <div className="w-full h-24 bg-gradient-to-r from-purple-950/40 to-indigo-950/40" />
                      )}
                      
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center text-[10px] text-zinc-500">
                          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 font-mono">
                            {p.category}
                          </span>
                          <span className="font-semibold text-emerald-400">${p.budget.toLocaleString()}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white tracking-tight">
                          <Link to={`/project/${p._id}`} className="hover:text-primary-glow">{p.title}</Link>
                        </h4>
                        <p className="text-[11px] text-zinc-400 leading-normal line-clamp-3">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Row 4: Category sector cards */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
                  Sector Hub categories
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {categories.map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.name}
                        onClick={() => { setSearchQuery(cat.name); setActiveTab('creators'); }}
                        className={`p-5 rounded-2xl border text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-0.5 transition ${cat.color}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-xs font-semibold tracking-tight">{cat.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Creators Directory */}
          {activeTab === 'creators' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
              {filteredCreators.map(creator => (
                <CreatorCard key={creator._id || creator.id} creator={creator} />
              ))}
            </div>
          )}

          {/* TAB 3: Projects Gig Listings */}
          {activeTab === 'projects' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
              {filteredProjects.map(project => (
                <ProjectCard key={project._id} project={project} />
              ))}
            </div>
          )}

          {/* TAB 4: Communities List */}
          {activeTab === 'communities' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {communities.map(comm => {
                const isMember = comm.members.includes(user?.id);
                return (
                  <div key={comm._id} className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950 flex flex-col justify-between h-48 hover:-translate-y-0.5 transition-all duration-300">
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-md font-bold font-display text-white">{comm.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 text-zinc-500 font-mono">
                          {comm.members.length} members
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                        {comm.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-900 pt-3 mt-3">
                      <Link 
                        to={`/feed?communityId=${comm._id}`} 
                        className="flex items-center gap-1.5 text-xs text-primary-glow font-bold hover:underline"
                      >
                        <span>Browse Feed</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      {user && (
                        <button
                          onClick={() => handleJoinCommunity(comm._id, isMember)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${isMember ? 'bg-zinc-900 text-zinc-400 border border-zinc-800' : 'bg-primary text-white hover:bg-primary-hover shadow-lg hover:shadow-primary/20'}`}
                        >
                          {isMember ? 'Leave' : 'Join'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 5: Events Calendars */}
          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {events.map(event => {
                const isRegistered = event.attendees.includes(user?.id);
                return (
                  <div key={event._id} className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950 flex flex-col justify-between min-h-[190px]">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow font-mono uppercase font-bold tracking-wider">
                            {event.type}
                          </span>
                          <h3 className="text-md font-bold font-display text-white mt-1.5">{event.title}</h3>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                          {event.attendees.length} attending
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 line-clamp-3 leading-relaxed">
                        {event.description}
                      </p>
                    </div>

                    <div className="space-y-2 border-t border-zinc-900 pt-3 mt-3">
                      <div className="flex items-center justify-between text-[11px] text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1 truncate max-w-[180px]">
                          <MapPin className="w-3.5 h-3.5" />
                          {event.location}
                        </span>
                      </div>

                      {user && (
                        <button
                          onClick={() => handleAttendEvent(event._id)}
                          disabled={isRegistered}
                          className={`w-full py-1.5 rounded-lg text-xs font-semibold transition ${isRegistered ? 'bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-default' : 'bg-white hover:bg-zinc-200 text-black'}`}
                        >
                          {isRegistered ? '✓ Registered' : 'Attend Event'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty States */}
          {((activeTab === 'creators' && filteredCreators.length === 0) ||
            (activeTab === 'projects' && filteredProjects.length === 0) ||
            (activeTab === 'communities' && communities.length === 0) ||
            (activeTab === 'events' && events.length === 0)) && (
            <div className="glass-panel p-12 text-center rounded-2xl border border-zinc-900 bg-zinc-950 max-w-md mx-auto">
              <Compass className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
              <h4 className="text-sm font-bold">No results found</h4>
              <p className="text-zinc-500 text-xs mt-1">Try refining your keyword query.</p>
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Discover;
