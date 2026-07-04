import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Send, Image, MessageSquare, Compass, Eye, ShieldAlert, ArrowLeft,
  Pin, Trash2, Shield, MoreVertical, Paperclip, Smile, Search,
  AlertCircle, Check, CheckCheck, UserCheck, X
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  
  // Sidebar Tabs: 'chats' or 'users'
  const [sidebarTab, setSidebarTab] = useState('chats'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Selected target user
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // Advanced feature states
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState(null); // { name, type, base64 }
  const [pinnedConvos, setPinnedConvos] = useState(() => {
    try {
      const saved = localStorage.getItem('pinned_conversations');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Fetch conversations roster
  const fetchConversations = async () => {
    try {
      const res = await api.get('/api/messages/conversations');
      if (res.success) {
        setConversations(res.conversations || []);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err.message);
    } finally {
      setLoadingConvos(false);
    }
  };

  // Fetch all registered creators (to list created users)
  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/api/users/creators');
      if (res.success) {
        // Filter out current logged in user
        const list = (res.creators || []).filter(u => u._id !== user?.id);
        setAllUsers(list);
      }
    } catch (err) {
      console.error('Failed to load creators list:', err.message);
    }
  };

  // Fetch chat history with specific user
  const fetchChatHistory = async (targetUser) => {
    try {
      setLoadingHistory(true);
      setActiveChat(targetUser);
      setShowHeaderMenu(false);
      
      // Update blocking status locally
      setIsBlocked(user?.blockedUsers?.includes(targetUser._id) || false);
      
      const res = await api.get(`/api/messages/history/${targetUser._id}`);
      if (res.success) {
        setMessages(res.messages || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Poll chat lists
  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchAllUsers();
      const interval = setInterval(fetchConversations, 6000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Poll active chat history
  useEffect(() => {
    if (!activeChat) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/api/messages/history/${activeChat._id}`);
        if (res.success) {
          if (res.messages.length !== messages.length) {
            setMessages(res.messages);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeChat, messages.length]);

  // Pin Conversation toggle
  const togglePin = (userId, e) => {
    e.stopPropagation();
    const updated = pinnedConvos.includes(userId)
      ? pinnedConvos.filter(id => id !== userId)
      : [...pinnedConvos, userId];
    setPinnedConvos(updated);
    localStorage.setItem('pinned_conversations', JSON.stringify(updated));
  };

  // Block User Toggle
  const handleBlockUser = async () => {
    if (!activeChat) return;
    try {
      const res = await api.post(`/api/users/block/${activeChat._id}`);
      if (res.success) {
        setIsBlocked(res.blocked);
        alert(res.blocked ? 'User blocked successfully' : 'User unblocked successfully');
      }
    } catch (err) {
      alert(err.message || 'Block action failed.');
    } finally {
      setShowHeaderMenu(false);
    }
  };

  // Report User Modal
  const handleReportUser = async () => {
    if (!activeChat) return;
    const reason = prompt('Please specify your reason for reporting this user:');
    if (!reason) return;
    try {
      await api.post(`/api/users/report/${activeChat._id}`, { reason });
      alert('Report submitted successfully. Thank you for keeping Project EARTH safe.');
    } catch (err) {
      console.error(err);
    } finally {
      setShowHeaderMenu(false);
    }
  };

  // Clear / Delete Conversation
  const handleDeleteConversation = async () => {
    if (!activeChat) return;
    if (!window.confirm('Are you sure you want to delete this entire chat conversation?')) return;
    try {
      const res = await api.delete(`/api/messages/conversations/${activeChat._id}`);
      if (res.success) {
        setMessages([]);
        setActiveChat(null);
        fetchConversations();
      }
    } catch (err) {
      alert(err.message || 'Failed to clear conversation history.');
    }
  };

  // Delete message for everyone
  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm('Delete message for everyone?')) return;
    try {
      const res = await api.delete(`/api/messages/message/${msgId}`);
      if (res.success) {
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, text: 'This message was deleted', deletedForEveryone: true, media: '', fileName: '' } : m));
      }
    } catch (err) {
      alert(err.message || 'Cannot delete message.');
    }
  };

  // Handle media file upload triggers
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      return alert('File size limits are capped at 5MB.');
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachment({
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.name.split('.').pop() || 'file',
        base64: reader.result
      });
    };
    reader.readAsDataURL(file);
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (isBlocked) return alert('You cannot text a blocked user.');
    if (!inputText.trim() && !attachment) return;

    const originalText = inputText;
    const originalAttach = attachment;

    setInputText('');
    setAttachment(null);
    setShowEmojiPicker(false);

    try {
      const payload = {
        recipientId: activeChat._id,
        text: originalText || `Sent file: ${originalAttach.name}`
      };

      if (originalAttach) {
        payload.media = originalAttach.base64;
        payload.fileName = originalAttach.name;
        payload.fileType = originalAttach.type;
      }

      const res = await api.post('/api/messages', payload);
      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        
        // Mock automatic reply to keep conversations alive in staging/demo
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const replyText = `Hey there! Got your message. Let's sync up on the milestones and budget sheet.`;
          api.post('/api/messages', {
            recipientId: user.id,
            text: replyText
          }).then(replyRes => {
            if (replyRes.success) {
              fetchChatHistory(activeChat);
            }
          });
        }, 3000);
      }
    } catch (err) {
      alert(err.message || 'Failed to send message');
      setInputText(originalText);
      setAttachment(originalAttach);
    }
  };

  const handleEmojiClick = (emoji) => {
    setInputText(prev => prev + emoji);
  };

  // Filter conversations/users by query
  const filteredConvos = conversations.filter(c => 
    c.user && c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sorting: Pinned convos should be placed first
  const sortedConvos = [...filteredConvos].sort((a, b) => {
    const aPinned = pinnedConvos.includes(a.user?._id) ? 1 : 0;
    const bPinned = pinnedConvos.includes(b.user?._id) ? 1 : 0;
    return bPinned - aPinned; // pinned first
  });

  const emojis = ['👍', '❤️', '🔥', '😂', '😮', '🎉', '💡', '🎨', '💼', '💻', '🎬'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      <div className="glass-panel rounded-2xl border border-border/80 bg-zinc-950/80 overflow-hidden flex h-[620px] shadow-2xl relative">
        
        {/* LEFT SIDE BAR: Chats / Directory list */}
        <div className={`w-full md:w-80 border-r border-zinc-900 flex flex-col h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header tabs toggle */}
          <div className="p-4 border-b border-zinc-900 bg-zinc-950 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold tracking-tight font-display">Messenger Box</h2>
              <MessageSquare className="w-4 h-4 text-zinc-500" />
            </div>

            {/* Sidebar toggle buttons */}
            <div className="flex bg-zinc-900/50 p-1 rounded-xl border border-border/50 text-xs">
              <button
                onClick={() => setSidebarTab('chats')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                  sidebarTab === 'chats' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Chats
              </button>
              <button
                onClick={() => setSidebarTab('users')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition ${
                  sidebarTab === 'users' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Find Users
              </button>
            </div>

            {/* Sidebar Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-border rounded-lg pl-8 pr-2.5 py-1.5 text-xs outline-none text-white focus:border-zinc-700 placeholder-zinc-500"
              />
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* List panel */}
          <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-950/40">
            {loadingConvos ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[1, 2, 3].map(n => (
                  <div key={n} className="flex gap-2">
                    <div className="w-10 h-10 rounded-full bg-zinc-800" />
                    <div className="flex-grow space-y-2 py-1">
                      <div className="h-3 w-1/2 bg-zinc-800 rounded" />
                      <div className="h-2.5 w-3/4 bg-zinc-800 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : sidebarTab === 'chats' ? (
              <>
                {sortedConvos.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs space-y-2">
                    <Compass className="w-6 h-6 mx-auto text-zinc-700 animate-pulse" />
                    <p>No active chats. Start one by clicking on the 'Find Users' tab!</p>
                  </div>
                ) : (
                  sortedConvos.map(convo => {
                    const cUser = convo.user;
                    if (!cUser) return null;
                    const isSelected = activeChat && activeChat._id === cUser._id;
                    const isPinned = pinnedConvos.includes(cUser._id);

                    return (
                      <div
                        key={cUser._id}
                        onClick={() => fetchChatHistory(cUser)}
                        className={`w-full flex items-center gap-3 p-3.5 text-left border-b border-zinc-900/60 cursor-pointer transition ${
                          isSelected ? 'bg-primary/10 border-l-4 border-l-primary-glow' : 'hover:bg-zinc-900/30'
                        }`}
                      >
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs border border-zinc-800">
                            {cUser.profileImage ? (
                              <img src={cUser.profileImage} alt={cUser.name} className="w-full h-full object-cover" />
                            ) : (
                              cUser.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-zinc-950" />
                        </div>

                        <div className="flex-grow overflow-hidden">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-white truncate max-w-[100px]">
                              {cUser.name}
                            </span>
                            <span className="text-[8px] text-zinc-500 font-mono">
                              {new Date(convo.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">{convo.lastMessage}</p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5">
                          {/* Pinned Icon */}
                          <button 
                            onClick={(e) => togglePin(cUser._id, e)} 
                            className={`p-0.5 rounded hover:bg-zinc-800 transition ${isPinned ? 'text-primary-glow' : 'text-zinc-600'}`}
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                          {!convo.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-glow shadow-[0_0_8px_#a855f7]" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            ) : (
              <>
                {/* Users Directory Tab */}
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-zinc-500 text-xs">
                    <span>No creators found matching that name.</span>
                  </div>
                ) : (
                  filteredUsers.map(u => (
                    <button
                      key={u._id}
                      onClick={() => fetchChatHistory(u)}
                      className="w-full flex items-center gap-3 p-3.5 border-b border-zinc-900/60 hover:bg-zinc-900/30 text-left transition"
                    >
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs border border-zinc-850">
                          {u.profileImage ? (
                            <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-zinc-950" />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <span className="font-bold text-xs text-white truncate block">{u.name}</span>
                        <span className="text-[10px] text-zinc-500 block truncate font-mono">
                          @{u.username || 'no-handle'}
                        </span>
                      </div>
                      <UserCheck className="w-4 h-4 text-zinc-600 hover:text-primary-glow" />
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT SIDE BAR: Chat message box */}
        <div className={`flex-1 flex flex-col h-full bg-zinc-950/30 ${!activeChat ? 'hidden md:flex justify-center items-center' : 'flex'}`}>
          {activeChat ? (
            <>
              {/* Header Box */}
              <div className="p-3.5 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden text-zinc-400 hover:text-white p-1 rounded-lg"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs border border-zinc-800">
                      {activeChat.profileImage ? (
                        <img src={activeChat.profileImage} alt={activeChat.name} className="w-full h-full object-cover" />
                      ) : (
                        activeChat.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border border-zinc-950" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white leading-none flex items-center gap-1.5">
                      <span>{activeChat.name}</span>
                      {isBlocked && (
                        <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded uppercase font-bold tracking-wider">Blocked</span>
                      )}
                    </h3>
                    <span className="text-[9px] text-green-400 font-semibold mt-0.5 block">online</span>
                  </div>
                </div>

                {/* Moderation actions dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                    className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  
                  {showHeaderMenu && (
                    <div className="absolute right-0 top-10 w-44 bg-zinc-950 border border-zinc-900 rounded-xl p-1 shadow-xl z-20 space-y-1">
                      <button 
                        onClick={handleBlockUser}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-red-400 transition"
                      >
                        {isBlocked ? 'Unblock User' : 'Block User'}
                      </button>
                      <button 
                        onClick={handleReportUser}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-yellow-450 transition"
                      >
                        Report User
                      </button>
                      <button 
                        onClick={handleDeleteConversation}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-red-500 hover:bg-red-500/10 transition flex items-center gap-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear History</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Message thread viewport */}
              <div className="flex-1 p-4 overflow-y-auto no-scrollbar space-y-4 bg-zinc-950/20">
                {loadingHistory ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="text-xs text-zinc-500 animate-pulse">Retrieving messaging transcript...</span>
                  </div>
                ) : (
                  <>
                    {messages.map(msg => {
                      const isMe = (msg.senderId?._id || msg.senderId) === user?.id;
                      const hasAttachment = msg.media && msg.fileName;

                      return (
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                          <div className="max-w-[70%] space-y-1">
                            <div className={`rounded-2xl px-3.5 py-2 text-xs shadow-md relative ${
                              isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-zinc-900/90 text-zinc-200 rounded-tl-none'
                            }`}>
                              
                              {/* Attachment layout */}
                              {hasAttachment && (
                                <div className="mb-2 bg-black/30 p-2 rounded-lg border border-white/5 space-y-2">
                                  {msg.fileType === 'image' ? (
                                    <img src={msg.media} alt={msg.fileName} className="max-h-40 rounded object-cover w-full" />
                                  ) : (
                                    <div className="flex items-center gap-2 text-[10px] text-zinc-300">
                                      <Paperclip className="w-3.5 h-3.5 text-primary-glow flex-shrink-0" />
                                      <a href={msg.media} download={msg.fileName} className="underline truncate hover:text-white">
                                        {msg.fileName}
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              <p className={`leading-relaxed whitespace-pre-wrap ${msg.deletedForEveryone ? 'italic text-zinc-500' : ''}`}>
                                {msg.text}
                              </p>

                              <div className="flex items-center justify-end gap-1.5 mt-1 text-[8px] text-zinc-400 font-mono">
                                <span>
                                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isMe && (
                                  <span>
                                    {msg.isRead ? <CheckCheck className="w-3 h-3 text-primary-glow" /> : <Check className="w-3 h-3" />}
                                  </span>
                                )}
                              </div>

                              {/* Hover Delete Action (only own messages, not already deleted) */}
                              {isMe && !msg.deletedForEveryone && (
                                <button 
                                  onClick={() => handleDeleteMessage(msg._id)}
                                  className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition p-1 hover:text-red-500"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-zinc-900/80 text-zinc-400 rounded-2xl rounded-tl-none px-4 py-2 text-xs flex items-center gap-1.5 border border-zinc-850">
                          <span className="font-semibold text-zinc-350">{activeChat.name} is typing</span>
                          <span className="animate-pulse">...</span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Bottom attachment preview */}
              {attachment && (
                <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Paperclip className="w-3.5 h-3.5 text-primary-glow" />
                    <span className="truncate max-w-[200px] font-mono text-[10px]">{attachment.name}</span>
                  </div>
                  <button onClick={() => setAttachment(null)} className="text-zinc-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Emoji box drawer */}
              {showEmojiPicker && (
                <div className="px-4 py-2.5 bg-zinc-950 border-t border-zinc-900 flex flex-wrap gap-2 animate-fadeIn z-10">
                  {emojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleEmojiClick(emoji)}
                      className="p-1 text-sm hover:scale-125 transition"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Input console */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-zinc-900 bg-zinc-950 flex items-center gap-2 relative">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,application/pdf,application/zip"
                />
                
                {/* Clip attachments */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Emojis trigger */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
                  title="Insert emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={isBlocked ? "You cannot message a blocked user" : `Message @${activeChat.username || activeChat.name}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none text-white placeholder-zinc-500 focus:border-zinc-700 transition"
                  disabled={isBlocked}
                />

                <button
                  type="submit"
                  disabled={isBlocked}
                  className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="text-center text-zinc-500 p-8 space-y-2">
              <MessageSquare className="w-10 h-10 mx-auto text-zinc-700 animate-pulse" />
              <h3 className="text-sm font-bold text-white">Select a Chat to Start</h3>
              <p className="text-xs text-zinc-450 leading-relaxed max-w-sm mx-auto">
                Select from active chats in the sidebar, or search all registered creators in the 'Find Users' tab to start texting!
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Messages;
