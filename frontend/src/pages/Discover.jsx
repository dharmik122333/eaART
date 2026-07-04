import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Users, Briefcase, Compass, ShieldAlert, 
  MapPin, Calendar, Award, ExternalLink, ArrowRight, UserPlus,
  Flame, TrendingUp, Sparkles, Gamepad2, Film, Music, Cpu, Camera, Shirt,
  Shield, CheckCircle, HelpCircle, Heart, MessageSquare, Plus, Bell, Bookmark
} from 'lucide-react';
import CreatorCard from '../components/CreatorCard';
import ProjectCard from '../components/ProjectCard';

const Discover = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('explore'); 
  const [selectedSector, setSelectedSector] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Datasets
  const [creators, setCreators] = useState([]);
  const [projects, setProjects] = useState([]);
  const [trendingPosts, setTrendingPosts] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);

  // Follow state tracking
  const [followingIds, setFollowingIds] = useState([]);

  // Mock companies details
  const [companies, setCompanies] = useState([
    { _id: 'comp_1', name: 'Nexus Studio', industry: 'Gaming & Virtual Worlds', logo: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100', openRoles: 3, location: 'Remote' },
    { _id: 'comp_2', name: 'Zenith Film Lab', industry: 'Visual VFX & Cinema', logo: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100', openRoles: 1, location: 'Mumbai, India' },
    { _id: 'comp_3', name: 'Hyperlight WebGL', industry: 'Creative Web Technology', logo: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=100', openRoles: 2, location: 'San Francisco, CA' }
  ]);

  // Sector config
  const sectors = [
    { name: 'All', icon: Compass, color: 'bg-zinc-800 text-zinc-350 border-zinc-700' },
    { name: 'Gaming', icon: Gamepad2, color: 'bg-rose-500/10 text-rose-450 border-rose-500/20' },
    { name: 'Film', icon: Film, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { name: 'Music', icon: Music, color: 'bg-amber-500/10 text-amber-450 border-amber-500/20' },
    { name: 'Technology', icon: Cpu, color: 'bg-cyan-500/10 text-cyan-405 border-cyan-500/20' },
    { name: 'Photography', icon: Camera, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Fashion', icon: Shirt, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { name: 'Cybersecurity', icon: Shield, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { name: 'AI', icon: Sparkles, color: 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20' }
  ];

  const fetchFollowing = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/follow/${user.id}/following`);
      if (res.success) {
        setFollowingIds(res.following.map(f => f.followingId?._id || f.followingId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch creators
      const creatorRes = await api.get('/api/users/creators');
      if (creatorRes.success) setCreators(creatorRes.creators || []);

      // Fetch projects
      const projRes = await api.get('/api/projects');
      if (projRes.success) setProjects(projRes.projects || []);

      // Fetch trending posts
      const postRes = await api.get('/api/posts?tab=trending&limit=4');
      if (postRes.success) setTrendingPosts(postRes.posts || []);

      // Fetch communities
      const commRes = await api.get('/api/communities');
      if (commRes.success) setCommunities(commRes.communities || []);

      // Fetch events
      const eveRes = await api.get('/api/events');
      if (eveRes.success) setEvents(eveRes.events || []);

      if (user) {
        await fetchFollowing();
      }
    } catch (err) {
      console.error('Failed to load explore datasets:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleFollow = async (creatorId) => {
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/api/follow/${creatorId}`);
      if (res.success) {
        setFollowingIds(prev => 
          prev.includes(creatorId) 
            ? prev.filter(id => id !== creatorId) 
            : [...prev, creatorId]
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinCommunity = async (id, joined) => {
    if (!user) return navigate('/login');
    try {
      const endpoint = `/api/communities/${id}/${joined ? 'leave' : 'join'}`;
      const res = await api.post(endpoint);
      if (res.success) {
        setCommunities(prev => prev.map(c => {
          if (c._id === id) {
            const isMember = c.members.includes(user.id);
            const members = isMember 
              ? c.members.filter(m => m !== user.id) 
              : [...c.members, user.id];
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
    if (!user) return navigate('/login');
    try {
      const res = await api.post(`/api/events/${id}/attend`);
      if (res.success) {
        setEvents(prev => prev.map(e => {
          if (e._id === id) {
            return { ...e, attendees: [...e.attendees, user.id] };
          }
          return e;
        }));
        alert('RSVP confirmed successfully!');
      }
    } catch (err) {
      alert(err.message || 'Already registered to attend');
    }
  };

  // Filter systems
  const filteredCreators = creators.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (c.headline && c.headline.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedSector === 'All') return matchesSearch;
    // Map matching sector
    return matchesSearch && c.category && c.category.toLowerCase().includes(selectedSector.toLowerCase());
  });

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (selectedSector === 'All') return matchesSearch;
    return matchesSearch && p.category && p.category.toLowerCase().includes(selectedSector.toLowerCase());
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      
      {/* Search Header Hero */}
      <div className="glass-panel p-8 rounded-3xl border border-border/80 text-center relative overflow-hidden bg-zinc-950/70 mb-8">
        <div className="absolute top-[-30%] right-[-20%] w-[60%] h-[60%] bg-primary-glow/10 rounded-full filter blur-[50px] pointer-events-none" />
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display mb-3">
          Discover the Future of <span className="text-primary-glow">Creative Collaboration</span>
        </h1>
        <p className="text-xs text-zinc-450 max-w-lg mx-auto mb-6 leading-relaxed">
          Find game developers, VFX artists, music producers, WebGL coders, cybersecurity experts, and AI creators.
        </p>

        {/* Global Search Bar */}
        <div className="relative max-w-md mx-auto">
          <input 
            type="text"
            placeholder="Search creators, roles, projects, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none text-white focus:border-zinc-700 transition"
          />
          <Search className="w-4 h-4 text-zinc-550 absolute left-3 top-3.5" />
        </div>
      </div>

      {/* Sector Category Filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6 scroll-smooth">
        {sectors.map(sector => {
          const Icon = sector.icon;
          const isSelected = selectedSector === sector.name;
          return (
            <button
              key={sector.name}
              onClick={() => setSelectedSector(sector.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 transition-all ${
                isSelected 
                  ? 'bg-primary/20 border-primary text-primary-glow font-bold' 
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-750'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sector.name}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 text-primary-glow animate-spin" />
        </div>
      ) : (
        <div className="space-y-12">

          {/* SECTION 1: Trending Creators */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-primary-glow" />
                <span>Trending Creators</span>
              </h2>
              <Link to="/explore-creators" className="text-[10px] font-bold text-primary-glow hover:underline flex items-center gap-1">
                <span>View all creators</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredCreators.slice(0, 3).map(creator => {
                const isFollowing = followingIds.includes(creator._id);
                return (
                  <div key={creator._id} className="glass-panel p-5 rounded-2xl border border-border/85 bg-zinc-950 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Link to={`/profile/${creator.username || creator._id}`}>
                            <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-sm">
                              {creator.profileImage ? (
                                <img src={creator.profileImage} alt={creator.name} className="w-full h-full object-cover" />
                              ) : (
                                creator.name.charAt(0).toUpperCase()
                              )}
                            </div>
                          </Link>
                          <div>
                            <Link to={`/profile/${creator.username || creator._id}`} className="font-bold text-xs hover:underline flex items-center gap-1">
                              <span>{creator.name}</span>
                              <CheckCircle className="w-3.5 h-3.5 text-primary-glow fill-zinc-950" />
                            </Link>
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-500 font-mono mt-0.5 inline-block">
                              {creator.category || 'Creator'}
                            </span>
                          </div>
                        </div>

                        {user && user.id !== creator._id && (
                          <button
                            onClick={() => handleToggleFollow(creator._id)}
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              isFollowing 
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-550' 
                                : 'bg-primary/20 border-primary/30 text-primary-glow hover:bg-primary hover:text-white'
                            }`}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      <p className="text-[10px] text-zinc-400 mt-3.5 leading-normal">{creator.headline || 'Digital Visual Innovator'}</p>
                      
                      {creator.skills && creator.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {creator.skills.slice(0, 3).map(skill => (
                            <span key={skill} className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-500 font-mono">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <Link 
                      to={`/profile/${creator.username || creator._id}`}
                      className="mt-4 w-full py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-center text-zinc-300 hover:text-white hover:border-zinc-700 font-bold block transition"
                    >
                      View Portfolio
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: Trending Posts */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary-glow" />
              <span>Trending Posts</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {trendingPosts.slice(0, 4).map(post => {
                const author = post.authorId;
                const authorIdStr = author?._id || author;
                return (
                  <div key={post._id} className="glass-panel p-4 rounded-xl border border-border/80 bg-zinc-950 flex flex-col justify-between h-[220px]">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-[9px]">
                          {author?.profileImage ? (
                            <img src={author.profileImage} alt={author?.name} className="w-full h-full object-cover" />
                          ) : (
                            author?.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-300 truncate max-w-[100px]">{author?.name}</span>
                        <span className="text-[8px] bg-primary/20 text-primary-glow px-1 rounded uppercase font-mono font-bold ml-auto">{post.category}</span>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-1 mt-2">{post.title}</h4>
                      <p className="text-[10px] text-zinc-450 line-clamp-3 leading-normal">{post.caption || 'Checkout my latest work update!'}</p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-zinc-900 text-[9px] text-zinc-550 font-mono">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                        <span>{post.likesCount || 0}</span>
                      </span>
                      <Link 
                        to="/feed" 
                        className="text-primary-glow hover:underline font-bold"
                      >
                        Read Post
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: Popular Projects */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-primary-glow" />
                <span>Popular Projects</span>
              </h2>
              <Link to="/explore-projects" className="text-[10px] font-bold text-primary-glow hover:underline flex items-center gap-1">
                <span>View all projects</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredProjects.slice(0, 3).map(project => (
                <div key={project._id} className="glass-panel p-5 rounded-2xl border border-border/85 bg-zinc-950 flex flex-col justify-between h-[230px]">
                  <div>
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-primary/20 text-primary-glow border border-primary/20 uppercase font-mono font-bold">
                        {project.category}
                      </span>
                      <span className="text-[10px] text-emerald-450 font-bold font-mono">
                        ${project.budget.toLocaleString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-3.5 line-clamp-1">{project.title}</h4>
                    <p className="text-[10px] text-zinc-400 mt-2 line-clamp-3 leading-relaxed">{project.description}</p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-zinc-900">
                    <span className="text-[9px] text-zinc-500 font-medium truncate max-w-[130px]">{project.companyName || 'Nexus Corp'}</span>
                    <Link 
                      to={`/project/${project._id}`}
                      className="px-3 py-1 rounded bg-primary text-white text-[9px] font-bold"
                    >
                      Apply
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 4: Companies Hiring */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary-glow" />
              <span>Companies Hiring</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {companies.map(comp => (
                <div key={comp._id} className="glass-panel p-4 rounded-xl border border-border/80 bg-zinc-950 flex items-center justify-between">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-zinc-900 overflow-hidden flex items-center justify-center border border-zinc-800 flex-shrink-0">
                      <img src={comp.logo} alt={comp.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">{comp.name}</h4>
                      <span className="text-[9px] text-zinc-500 block truncate">{comp.industry}</span>
                      <span className="text-[8px] text-zinc-650 font-mono mt-0.5 block">{comp.location}</span>
                    </div>
                  </div>

                  <Link 
                    to="/explore-projects"
                    className="flex-shrink-0 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-805 text-zinc-400 hover:text-white text-[9px] font-bold transition flex items-center gap-1"
                  >
                    <span>{comp.openRoles} Jobs</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 5: RSVP Events & Active Communities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Events */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary-glow" />
                <span>RSVP Events</span>
              </h2>

              <div className="space-y-3">
                {events.slice(0, 2).map(eve => {
                  const hasRSVP = user && eve.attendees && eve.attendees.includes(user.id);
                  return (
                    <div key={eve._id} className="glass-panel p-4 rounded-xl border border-border/80 bg-zinc-950 flex items-center justify-between">
                      <div className="overflow-hidden mr-2">
                        <h4 className="text-xs font-bold text-white truncate">{eve.title}</h4>
                        <span className="text-[9px] text-zinc-500 block truncate mt-0.5">{eve.type} • {eve.location}</span>
                        <span className="text-[8px] text-zinc-600 font-mono mt-1 block">Date: {new Date(eve.date).toLocaleDateString()}</span>
                      </div>

                      <button
                        onClick={() => handleAttendEvent(eve._id)}
                        disabled={hasRSVP}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold transition ${
                          hasRSVP 
                            ? 'bg-zinc-900 text-zinc-550 border border-zinc-800 cursor-default' 
                            : 'bg-primary/20 border border-primary/30 text-primary-glow hover:bg-primary hover:text-white'
                        }`}
                      >
                        {hasRSVP ? 'RSVP Confirmed' : 'RSVP Now'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Communities */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-450 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary-glow" />
                <span>Active Communities</span>
              </h2>

              <div className="space-y-3">
                {communities.slice(0, 2).map(comm => {
                  const hasJoined = user && comm.members && comm.members.includes(user.id);
                  return (
                    <div key={comm._id} className="glass-panel p-4 rounded-xl border border-border/80 bg-zinc-950 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden mr-2">
                        <div className="w-8 h-8 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex-shrink-0">
                          {comm.coverImage ? (
                            <img src={comm.coverImage} alt={comm.name} className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-zinc-600 m-2" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="text-xs font-bold text-white truncate">{comm.name}</h4>
                          <span className="text-[9px] text-zinc-500 block truncate">{comm.description}</span>
                          <span className="text-[8px] text-zinc-650 font-mono mt-0.5 block">{comm.members.length} members</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleJoinCommunity(comm._id, hasJoined)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-[9px] font-bold border transition ${
                          hasJoined 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-450' 
                            : 'bg-primary/20 border-primary/30 text-primary-glow hover:bg-primary hover:text-white'
                        }`}
                      >
                        {hasJoined ? 'Leave' : 'Join'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default Discover;
