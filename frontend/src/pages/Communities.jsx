import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Compass, Users, MessageSquare, ArrowRight, ShieldAlert } from 'lucide-react';

const Communities = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCommunities = async () => {
    try {
      const res = await api.get('/api/communities');
      if (res.success) {
        setCommunities(res.communities);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleJoinToggle = async (id, isMember) => {
    try {
      const endpoint = `/api/communities/${id}/${isMember ? 'leave' : 'join'}`;
      const res = await api.post(endpoint);
      if (res.success) {
        setCommunities(prev => prev.map(c => {
          if (c._id === id) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="space-y-2 border-b border-zinc-900 pb-4 mb-8">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Creative <span className="text-primary-glow">Communities</span>
        </h1>
        <p className="text-zinc-400 text-xs">
          Join sector clusters, share your work, get feedback, and find co-founders.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-44 rounded-2xl bg-zinc-900 border border-zinc-850" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {communities.map(comm => {
            const isMember = comm.members.includes(user?.id);
            return (
              <div 
                key={comm._id} 
                className="glass-panel overflow-hidden rounded-2xl border border-border/80 bg-zinc-950/80 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Banner / Cover */}
                <div className="h-24 w-full bg-zinc-900 relative overflow-hidden">
                  {comm.coverImage ? (
                    <img src={comm.coverImage} alt={comm.name} className="w-full h-full object-cover opacity-60" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-violet-900 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <h3 className="text-md font-bold font-display text-white">{comm.name}</h3>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-300 font-mono bg-zinc-950/85 px-2 py-0.5 rounded border border-zinc-900">
                      <Users className="w-3 h-3" />
                      {comm.members.length} members
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs text-zinc-400 leading-relaxed min-h-[48px] line-clamp-3">
                    {comm.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center justify-between border-t border-zinc-900 pt-3 mt-4">
                    <Link 
                      to={`/feed?communityId=${comm._id}`} 
                      className="flex items-center gap-1.5 text-xs text-primary-glow font-bold hover:underline"
                    >
                      <span>Browse Feed</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    {user && (
                      <button
                        onClick={() => handleJoinToggle(comm._id, isMember)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${isMember ? 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white' : 'bg-primary hover:bg-primary-hover text-white shadow-lg hover:shadow-primary/20'}`}
                      >
                        {isMember ? 'Leave' : 'Join Community'}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Communities;
