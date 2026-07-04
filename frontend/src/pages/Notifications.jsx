import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Bell, Heart, MessageSquare, UserPlus, Briefcase, 
  HelpCircle, ShieldAlert, ArrowRight, Eye, Check 
} from 'lucide-react';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/notifications');
      if (res.success) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark single read
  const handleMarkRead = async (id) => {
    try {
      const res = await api.put(`/api/notifications/${id}/read`);
      if (res.success) {
        setNotifications(prev => prev.map(n => {
          if (n._id === id) return { ...n, isRead: true };
          return n;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark all read
  const handleMarkAllRead = async () => {
    try {
      const res = await api.put('/api/notifications/read-all');
      if (res.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Map icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-violet-400" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-blue-400" />;
      case 'hire':
        return <Briefcase className="w-4 h-4 text-green-400" />;
      case 'collaborate':
        return <UserPlus className="w-4 h-4 text-yellow-400" />;
      case 'view_profile':
        return <Eye className="w-4 h-4 text-cyan-400" />;
      default:
        return <Bell className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary-glow border border-primary/20">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">Notifications</h1>
            <p className="text-xs text-zinc-400">Keep track of your interactions and application status.</p>
          </div>
        </div>

        {notifications.some(n => !n.isRead) && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Roster of alerts */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-16 rounded-xl bg-zinc-900 border border-zinc-850" />
            ))}
          </div>
        ) : (
          <>
            {notifications.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-zinc-900 bg-zinc-950">
                <Bell className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-xs">Your inbox is empty.</p>
              </div>
            ) : (
              notifications.map(notif => {
                const sender = notif.senderId;
                const senderIdStr = sender?._id || sender;
                return (
                  <div 
                    key={notif._id}
                    className={`glass-panel p-4 rounded-xl border border-zinc-900/60 flex items-center justify-between gap-4 transition-all duration-200 ${notif.isRead ? 'bg-zinc-950/20' : 'bg-primary/5 border-l-4 border-l-primary-glow shadow-[0_0_15px_rgba(124,58,237,0.05)]'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Left icon wrapper */}
                      <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* sender avatar */}
                      {sender && (
                        <Link to={`/creator/${senderIdStr}`}>
                          <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs shrink-0">
                            {sender.profileImage ? (
                              <img src={sender.profileImage} alt={sender.name} className="w-full h-full object-cover" />
                            ) : (
                              sender.name.charAt(0).toUpperCase()
                            )}
                          </div>
                        </Link>
                      )}

                      {/* message details */}
                      <div>
                        <p className="text-xs text-zinc-300">
                          {sender && (
                            <Link to={`/creator/${senderIdStr}`} className="font-bold text-white hover:underline mr-1">
                              {sender.name}
                            </Link>
                          )}
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-zinc-500 font-mono mt-0.5 block">
                          {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Right side check marks */}
                    <div className="flex items-center gap-2">
                      {notif.referenceId && (
                        <Link 
                          to={notif.type === 'message' ? '/messages' : `/feed`}
                          className="p-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition"
                          title="View reference"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                      {!notif.isRead && (
                        <button 
                          onClick={() => handleMarkRead(notif._id)}
                          className="text-[9px] text-primary-glow font-bold hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
