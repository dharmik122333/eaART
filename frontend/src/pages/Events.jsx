import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calendar, MapPin, Award, Users, AlertTriangle } from 'lucide-react';

const Events = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await api.get('/api/events');
      if (res.success) {
        setEvents(res.events);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleAttend = async (id) => {
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
      alert(err.message || 'Already registered');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="space-y-2 border-b border-zinc-900 pb-4 mb-8">
        <h1 className="text-2xl font-bold font-display tracking-tight">
          Upcoming <span className="text-primary-glow">Events & Jams</span>
        </h1>
        <p className="text-zinc-400 text-xs">
          Explore upcoming game jams, coding hackathons, startup incubators, and workshop meetups.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[1, 2].map(n => (
            <div key={n} className="h-56 rounded-2xl bg-zinc-900 border border-zinc-850" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map(event => {
            const isRegistered = event.attendees.includes(user?.id);
            return (
              <div 
                key={event._id} 
                className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950 flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow font-mono font-bold uppercase tracking-wider">
                        {event.type}
                      </span>
                      <h3 className="text-md font-bold font-display text-white mt-2">{event.title}</h3>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                      {event.attendees.length} attending
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-3 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                <div className="space-y-3 border-t border-zinc-900 pt-4 mt-4">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 max-w-[200px] truncate">
                      <MapPin className="w-3.5 h-3.5" />
                      {event.location}
                    </span>
                  </div>

                  {user && (
                    <button
                      onClick={() => handleAttend(event._id)}
                      disabled={isRegistered}
                      className={`w-full py-2 rounded-xl text-xs font-semibold transition ${isRegistered ? 'bg-zinc-900 text-zinc-500 border border-zinc-850 cursor-default' : 'bg-white hover:bg-zinc-200 text-black shadow-md'}`}
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
    </div>
  );
};

export default Events;
