import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Send, Image, MessageSquare, Compass, Eye, ShieldAlert, ArrowLeft,
  Pin, Trash2, Shield, MoreVertical, Paperclip, Smile, Search,
  AlertCircle, Check, CheckCheck, UserCheck, X, File, Film, Volume2, 
  Download, Loader, ThumbsUp, Heart, Laugh, Flame, AlertOctagon, HelpCircle
} from 'lucide-react';

const Messages = () => {
  const { user } = useAuth();
  
  // Sidebar Tabs: 'chats' or 'users'
  const [sidebarTab, setSidebarTab] = useState('chats'); 
  const [searchQuery, setSearchQuery] = useState('');
  
  const [conversations, setConversations] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeChat, setActiveChat] = useState(null); 
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConvos, setLoadingConvos] = useState(true);

  // Advanced features state
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  
  // Upload and progress state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); 
  const [attachment, setAttachment] = useState(null); // { url, name, type }

  // Drag & drop status
  const [isDragging, setIsDragging] = useState(false);

  // Modals / Viewers
  const [fullscreenImage, setFullscreenImage] = useState(null);
  const [showSecurityModal, setShowSecurityModal] = useState(false);

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

  // Fetch conversations
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

  // Fetch users
  const fetchAllUsers = async () => {
    try {
      const res = await api.get('/api/users/creators');
      if (res.success) {
        const list = (res.creators || []).filter(u => u._id !== user?.id);
        setAllUsers(list);
      }
    } catch (err) {
      console.error('Failed to load creators:', err.message);
    }
  };

  // Fetch history
  const fetchChatHistory = async (targetUser) => {
    try {
      setLoadingHistory(true);
      setActiveChat(targetUser);
      setShowHeaderMenu(false);
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

  useEffect(() => {
    if (user) {
      fetchConversations();
      fetchAllUsers();
      const interval = setInterval(fetchConversations, 6000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Poll chat timeline
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

  const togglePin = (userId, e) => {
    e.stopPropagation();
    const updated = pinnedConvos.includes(userId)
      ? pinnedConvos.filter(id => id !== userId)
      : [...pinnedConvos, userId];
    setPinnedConvos(updated);
    localStorage.setItem('pinned_conversations', JSON.stringify(updated));
  };

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

  // Upload file to Backend (which routes to Cloudinary or local fallback)
  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(15);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploadProgress(40);
      
      // Simulate progress increment
      const progressTimer = setInterval(() => {
        setUploadProgress(p => (p < 90 ? p + 10 : p));
      }, 200);

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      clearInterval(progressTimer);
      setUploadProgress(95);

      const res = await response.json();
      
      if (res.success) {
        setAttachment({
          url: res.url,
          name: res.fileName,
          type: res.fileType
        });
      } else {
        alert(res.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Network upload failure.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) uploadFile(file);
  };

  // Drag & Drop Events
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  // Clipboard Paste Event
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          uploadFile(file);
          e.preventDefault();
        }
      }
    }
  };

  // Toggle Message Reaction
  const handleToggleReaction = async (msgId, emoji) => {
    try {
      const res = await api.post(`/api/messages/message/${msgId}/react`, { emoji });
      if (res.success) {
        setMessages(prev => prev.map(m => {
          if (m._id === msgId) {
            return res.message || m;
          }
          return m;
        }));
      }
    } catch (err) {
      console.error(err);
    }
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
        payload.media = originalAttach.url;
        payload.fileName = originalAttach.name;
        payload.fileType = originalAttach.type;
      }

      const res = await api.post('/api/messages', payload);
      if (res.success) {
        setMessages(prev => [...prev, res.message]);
        
        // Mock automatic sync reply to make chat feel alive!
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const replyText = `I got your message and attachment. I'll review it and get back to you!`;
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

  // Filters convos/users by query
  const filteredConvos = conversations.filter(c => 
    c.user && c.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const sortedConvos = [...filteredConvos].sort((a, b) => {
    const aPinned = pinnedConvos.includes(a.user?._id) ? 1 : 0;
    const bPinned = pinnedConvos.includes(b.user?._id) ? 1 : 0;
    return bPinned - aPinned;
  });

  const emojis = ['👍', '❤️', '🔥', '😂', '😮', '🎉', '💡', '🎨', '💼'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black min-h-screen text-white">
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`glass-panel rounded-2xl border bg-zinc-950/85 overflow-hidden flex h-[620px] shadow-2xl relative transition-all ${
          isDragging ? 'border-primary border-dashed bg-primary/[0.02]' : 'border-border/80'
        }`}
      >
        
        {/* Drag Over Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 bg-zinc-950/80 pointer-events-none flex flex-col items-center justify-center gap-3">
            <Paperclip className="w-12 h-12 text-primary-glow animate-bounce" />
            <h3 className="text-lg font-bold text-white">Drag & Drop Files Here</h3>
            <p className="text-xs text-zinc-400">Release to upload attachment to chat</p>
          </div>
        )}

        {/* LEFT SIDE BAR: Chats list */}
        <div className={`w-full md:w-80 border-r border-zinc-900 flex flex-col h-full ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-900 bg-zinc-950 space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-extrabold tracking-tight font-display">Messenger Box</h2>
              <button 
                onClick={() => setShowSecurityModal(true)} 
                className="text-zinc-500 hover:text-white transition"
                title="Encryption details"
              >
                <Shield className="w-4 h-4" />
              </button>
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
                    <Compass className="w-6 h-6 mx-auto text-zinc-750 animate-pulse" />
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
                          <button 
                            onClick={(e) => togglePin(cUser._id, e)} 
                            className={`p-0.5 rounded hover:bg-zinc-850 transition ${isPinned ? 'text-primary-glow' : 'text-zinc-600'}`}
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
                        <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs border border-zinc-805">
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
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-red-450 transition"
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
                        <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group relative`}>
                          <div className="max-w-[70%] space-y-1 relative">
                            
                            {/* Message Reaction Hover Bar (Only show if not deleted) */}
                            {!msg.deletedForEveryone && (
                              <div className={`absolute -top-7 z-10 flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${
                                isMe ? 'right-2' : 'left-2'
                              }`}>
                                {['👍', '❤️', '🔥', '😂'].map(emoji => (
                                  <button
                                    key={emoji}
                                    onClick={() => handleToggleReaction(msg._id, emoji)}
                                    className="hover:scale-125 transition text-[10px]"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}

                            <div className={`rounded-2xl px-3.5 py-2 text-xs shadow-md relative ${
                              isMe ? 'bg-primary text-white rounded-tr-none' : 'bg-zinc-900/90 text-zinc-200 rounded-tl-none'
                            }`}>
                              
                              {/* Attachment layouts */}
                              {hasAttachment && !msg.deletedForEveryone && (
                                <div className="mb-2 bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-2">
                                  {msg.fileType === 'image' ? (
                                    <img 
                                      src={msg.media} 
                                      alt={msg.fileName} 
                                      className="max-h-40 rounded object-cover w-full cursor-pointer hover:opacity-95 transition"
                                      onClick={() => setFullscreenImage(msg.media)}
                                    />
                                  ) : msg.fileType === 'video' ? (
                                    <video src={msg.media} controls className="max-h-40 w-full rounded object-contain" />
                                  ) : msg.fileType === 'audio' ? (
                                    <audio src={msg.media} controls className="w-full h-8" />
                                  ) : (
                                    <div className="flex items-center justify-between gap-3 bg-zinc-950 p-2 rounded border border-zinc-800">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <File className="w-4 h-4 text-primary-glow flex-shrink-0" />
                                        <span className="text-[10px] text-zinc-350 truncate block font-mono">{msg.fileName}</span>
                                      </div>
                                      <a 
                                        href={msg.media} 
                                        download={msg.fileName} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-1 rounded bg-zinc-900 text-zinc-400 hover:text-white transition flex-shrink-0"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              )}

                              <p className={`leading-relaxed whitespace-pre-wrap ${msg.deletedForEveryone ? 'italic text-zinc-500' : ''}`}>
                                {msg.text}
                              </p>

                              {/* Render Reaction Overlays */}
                              {msg.reactions && msg.reactions.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {Object.entries(
                                    msg.reactions.reduce((acc, curr) => {
                                      acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                                      return acc;
                                    }, {})
                                  ).map(([emoji, count]) => (
                                    <span key={emoji} className="text-[8px] bg-zinc-950/60 border border-zinc-850 px-1.5 py-0.5 rounded-full flex items-center gap-1 text-zinc-300 font-bold">
                                      <span>{emoji}</span>
                                      <span>{count}</span>
                                    </span>
                                  ))}
                                </div>
                              )}

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

                              {/* Hover Delete Action (only own messages) */}
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

              {/* Bottom attachment details preview */}
              {attachment && (
                <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Paperclip className="w-3.5 h-3.5 text-primary-glow animate-pulse" />
                    <span className="truncate max-w-[200px] font-mono text-[10px]">{attachment.name}</span>
                    <span className="text-[8px] bg-primary/20 text-primary-glow border border-primary/20 px-1 rounded uppercase font-bold tracking-wider">Ready to send</span>
                  </div>
                  <button onClick={() => setAttachment(null)} className="text-zinc-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Upload Progress Loader Bar */}
              {uploading && (
                <div className="px-4 py-2 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between text-xs gap-3">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Loader className="w-3.5 h-3.5 text-primary-glow animate-spin" />
                    <span>Uploading file to secure Cloudinary server...</span>
                  </div>
                  <span className="font-mono font-bold text-primary-glow">{uploadProgress}%</span>
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
                  accept="image/*,video/*,audio/*,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition"
                  title="Attach images, videos, audio, PDF, DOCX, ZIP"
                  disabled={uploading}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

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
                  onPaste={handlePaste}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none text-white placeholder-zinc-500 focus:border-zinc-700 transition"
                  disabled={isBlocked || uploading}
                />

                <button
                  type="submit"
                  disabled={isBlocked || uploading}
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

      {/* FULLSCREEN IMAGE VIEWER MODAL */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2"
            onClick={() => setFullscreenImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img src={fullscreenImage} alt="Fullscreen Attachment" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
        </div>
      )}

      {/* ENCRYPTION DISCLOSURE SECURITY MODAL */}
      {showSecurityModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowSecurityModal(false)}
        >
          <div 
            className="glass-panel max-w-md w-full p-6 rounded-2xl border border-border space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary-glow" />
                <span>Security & Transit Encryption</span>
              </h3>
              <button onClick={() => setShowSecurityModal(false)} className="text-zinc-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3 text-xs leading-relaxed text-zinc-400">
              <div className="flex gap-3 items-start bg-zinc-900/60 p-3 rounded-lg border border-zinc-800">
                <AlertCircle className="w-5 h-5 text-primary-glow flex-shrink-0 mt-0.5" />
                <p>
                  <strong>Encryption Status:</strong> Standard end-to-end encryption (E2EE) keys protocol is not configured.
                </p>
              </div>

              <p>
                All communications and chat messages are encrypted in transit over secure sockets layer (<strong>HTTPS</strong>) to prevent snooping on public Wi-Fi networks.
              </p>
              
              <p>
                Files and media are stored securely in <strong>Cloudinary</strong> vaults, and passwords remain hashed on our MongoDB Atlas clusters using <strong>bcrypt</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Messages;
