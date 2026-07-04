import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Search, Users, Briefcase, Compass, ShieldAlert, 
  MapPin, Calendar, Award, ExternalLink, ArrowRight, UserPlus
} from 'lucide-react';
import CreatorCard from '../components/CreatorCard';
import ProjectCard from '../components/ProjectCard';

const Discover = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('creators');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Lists
  const [creators, setCreators] = useState([]);
  const [projects, setProjects] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [events, setEvents] = useState([]);

  // Fetch based on active tab & search query
  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'creators') {
        const res = await api.get(`/api/users?search=${searchQuery}`);
        if (res.success) setCreators(res.users);
      } else if (activeTab === 'projects') {
        const res = await api.get(`/api/projects?search=${searchQuery}`);
        if (res.success) setProjects(res.projects);
      } else if (activeTab === 'communities') {
        const res = await api.get('/api/communities');
        if (res.success) {
          const filterComms = res.communities.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.description.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setCommunities(filterComms);
        }
      } else if (activeTab === 'events') {
        const res = await api.get('/api/events');
        if (res.success) {
          const filterEvents = res.events.filter(e => 
            e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.type.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setEvents(filterEvents);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, searchQuery]);

  // Handle Community Membership Toggle
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

  // Handle Event Attendance Toggle
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      {/* Page Header */}
      <div className="space-y-4 text-center max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold font-display tracking-tight">
          Discover the <span className="text-primary-glow">Ecosystem</span>
        </h1>
        <p className="text-zinc-400 text-sm">
          Search creators, contracts, creative interest groups, hackathons, and jams.
        </p>

        {/* Global Search Bar */}
        <div className="relative max-w-xl mx-auto">
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/60 border border-border/80 focus:border-primary-glow/70 rounded-xl py-3 pl-12 pr-4 text-sm outline-none text-white transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
          />
          <Search className="w-5 h-5 text-zinc-500 absolute left-4 top-3.5" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-center border-b border-border/40 pb-3 gap-2 mb-8 overflow-x-auto no-scrollbar">
        {[
          { id: 'creators', label: 'Creators', icon: Users },
          { id: 'projects', label: 'Projects & Jobs', icon: Briefcase },
          { id: 'communities', label: 'Communities', icon: Compass },
          { id: 'events', label: 'Events & Jams', icon: Calendar }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${activeTab === tab.id ? 'bg-primary/20 text-primary-glow border-primary/30 shadow-[0_0_15px_rgba(124,58,237,0.1)]' : 'bg-transparent border-transparent text-zinc-400 hover:text-white'}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Results grid */}
      <div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-48 rounded-2xl bg-zinc-900 border border-zinc-800" />
            ))}
          </div>
        ) : (
          <>
            {/* Creators Tab */}
            {activeTab === 'creators' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creators.map(creator => (
                  <CreatorCard key={creator._id || creator.id} creator={creator} />
                ))}
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === 'projects' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map(project => (
                  <ProjectCard key={project._id} project={project} />
                ))}
              </div>
            )}

            {/* Communities Tab */}
            {activeTab === 'communities' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {communities.map(comm => {
                  const isMember = comm.members.includes(user?.id);
                  return (
                    <div key={comm._id} className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950 flex flex-col justify-between h-48 hover:-translate-y-1 transition-all duration-300">
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

            {/* Events Tab */}
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
            {((activeTab === 'creators' && creators.length === 0) ||
              (activeTab === 'projects' && projects.length === 0) ||
              (activeTab === 'communities' && communities.length === 0) ||
              (activeTab === 'events' && events.length === 0)) && (
              <div className="glass-panel p-12 text-center rounded-2xl border border-zinc-900 bg-zinc-950 max-w-md mx-auto">
                <Compass className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold">No results found</h4>
                <p className="text-zinc-500 text-xs mt-1">Try refining your keyword query.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Discover;
