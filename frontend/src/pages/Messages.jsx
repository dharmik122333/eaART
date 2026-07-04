import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Send, Image, MessageSquare, Compass, Eye, ShieldAlert, ArrowLeft } from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Selected user details
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // Typing state mock
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch conversation roster
  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/messages/conversations');
      if (res.success) {
        setConversations(res.conversations);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingConvos(false);
    }
  };

  // Fetch chat history with specific user
  const fetchChatHistory = async (targetUser) => {
    try {
      setLoadingHistory(true);
      setActiveChat(targetUser);
      
      const res = await api.get(`/api/messages/history/${targetUser._id}`);
      if (res.success) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Poll conversations list
    return () => clearInterval(interval);
  }, []);

  // Poll current active chat history
  useEffect(() => {
    if (!activeChat) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/messages/history/${activeChat._id}`);
        if (res.success) {
          // Only update if message counts differ (simple optimization)
          if (res.messages.length !== messages.length) {
            setMessages(res.messages);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000); // poll every 4s for real-time feel

    return () => clearInterval(interval);
  }, [activeChat, messages.length]);

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const originalText = inputText;
    setInputText('');

    try {
      const res = await api.post('/api/messages', {
        recipientId: activeChat._id,
        text: originalText
      });

      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        
        // Trigger mock typing reply from recipient after 2 seconds to make the chat feel ALIVE!
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          // Simulate receiving a reply in local fallback database
          const replyText = `Thanks for reaching out! Let's review the timeline and requirements for the project.`;
          api.post('/api/messages', {
            recipientId: user.id, // send to self from recipient
            text: replyText
          }).then(replyRes => {
            if (replyRes.success) {
              // Update message thread
              // Wait for next poll or trigger manual refetch
              fetchChatHistory(activeChat);
            }
          });
        }, 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
      setInputText(originalText);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      <div className="glass-panel rounded-2xl border border-border/80 bg-zinc-950/80 overflow-hidden flex h-[600px] shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        
        {/* Left Side Pane: Conversations List */}
        <div className={`w-full md:w-80 border-r border-zinc-900 flex flex-col h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
            <h2 className="text-md font-bold font-display">Collaborations Box</h2>
            <MessageSquare className="w-4 h-4 text-zinc-500" />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-950/40">
            {loadingConvos ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[1, 2].map(n => (
                  <div key={n} className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 w-1/2 bg-zinc-800 rounded" />
                      <div className="h-2 w-3/4 bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    <Compass className="w-6 h-6 mx-auto mb-2 text-zinc-600" />
                    <span>No active chats. Start one from explore or communities!</span>
                  </div>
                ) : (
                  conversations.map(convo => {
                    const cUser = convo.user;
                    if (!cUser) return null;
                    const isSelected = activeChat && activeChat._id === cUser._id;

                    return (
                      <button
                        key={cUser._id}
                        onClick={() => fetchChatHistory(cUser)}
                        className={`w-full flex items-center gap-3 p-3 text-left border-b border-zinc-900/60 transition-all ${isSelected ? 'bg-primary/20 border-l-4 border-l-primary-glow' : 'hover:bg-zinc-900/30'}`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs border border-zinc-850">
                            {cUser.profileImage ? (
                              <img src={cUser.profileImage} alt={cUser.name} className="w-full h-full object-cover" />
                            ) : (
                              cUser.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          {/* online mock dot */}
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-zinc-950" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-white truncate max-w-[110px]">{cUser.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">
                              {new Date(convo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{convo.lastMessage}</p>
                        </div>
                        {!convo.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary-glow shadow-[0_0_10px_#a855f7]" />
                        )}
                      </button>
                    );
                  })
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Side Pane: Chat View */}
        <div className={`flex-1 flex flex-col h-full bg-zinc-950/30 ${!activeChat ? 'hidden md:flex justify-center items-center' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-900 bg-zinc-950 flex items-center gap-3">
                <button 
                  onClick={() => setActiveChat(null)}
                  className="md:hidden text-zinc-400 hover:text-white p-1 rounded-lg"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-zinc-855 overflow-hidden flex items-center justify-center font-bold text-xs border border-zinc-800">
                    {activeChat.profileImage ? (
                      <img src={activeChat.profileImage} alt={activeChat.name} className="w-full h-full object-cover" />
                    ) : (
                      activeChat.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-zinc-950" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white leading-none">{activeChat.name}</h3>
                  <span className="text-[9px] text-green-400 font-semibold mt-0.5 block">online</span>
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-3 bg-zinc-950/20">
                {loadingHistory ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="text-xs text-zinc-500">Loading chat timeline...</span>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => {
                      const isMe = (msg.senderId?._id || msg.senderId) === user?.id;
                      return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-xs shadow-md ${isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-200 rounded-tl-none'}`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-1 text-[8px] text-zinc-400 font-mono">
                              <span>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMe && (
                                <span className={msg.isRead ? 'text-primary-glow font-bold' : 'text-zinc-600'}>
                                  {msg.isRead ? 'Read' : 'Sent'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* typing animation indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-900 text-zinc-400 rounded-2xl rounded-tl-none px-4 py-2 text-xs flex items-center gap-1">
                          <span className="font-semibold">{activeChat.name} is typing</span>
                          <span className="animate-pulse">...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Messages Input Box */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-900 bg-zinc-950 flex gap-2">
                <input
                  type="text"
                  placeholder={`Write your message to ${activeChat.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none text-white placeholder-zinc-500 focus:border-zinc-700 transition"
                  required
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white transition font-bold"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center text-zinc-500 p-8">
              <MessageSquare className="w-8 h-8 mx-auto text-zinc-700 mb-2" />
              <h3 className="text-sm font-bold text-white">Select a Chat to Start</h3>
              <p className="text-xs mt-1 text-zinc-400">Initiate discussions on contract deliverables, milestones, or portfolios.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Messages;
