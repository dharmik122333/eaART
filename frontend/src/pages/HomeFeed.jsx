import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Send, Image, Video, Award, HelpCircle, Heart, MessageSquare, 
  Share2, Bookmark, Trash2, MapPin, Globe, Compass, ChevronDown, Check, UserPlus,
  Briefcase, Users, Code, Film, Camera, Palette, FileText, CheckCircle, Smile, Edit2
} from 'lucide-react';

const HomeFeed = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('latest');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Post creation state
  const [postTitle, setPostTitle] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postCategory, setPostCategory] = useState('General');
  const [postTags, setPostTags] = useState('');
  const [postLocation, setPostLocation] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Poll creation state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);

  // Active post comments state
  const [expandedComments, setExpandedComments] = useState({});
  const [postComments, setPostComments] = useState({});
  const [newCommentText, setNewCommentText] = useState({});
  const [activeReplyBox, setActiveReplyBox] = useState({});
  const [replyText, setReplyText] = useState({});

  // Comment edit & likes states
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  // Follow tracking states
  const [followingIds, setFollowingIds] = useState([]);

  // Stats / widgets states
  const [trendingTags, setTrendingTags] = useState(['#UnrealEngine5', '#CreativeTech', '#StartupLife', '#3DArt', '#Cinematography']);
  const [suggestedCreators, setSuggestedCreators] = useState([]);

  const fileInputRef = useRef(null);

  // Fetch following list
  const fetchFollowing = async () => {
    if (!currentUser) return;
    try {
      const res = await api.get(`/api/follow/${currentUser.id}/following`);
      if (res.success) {
        setFollowingIds(res.following.map(f => f.followingId?._id || f.followingId));
      }
    } catch (err) {
      console.error('Failed to load following list:', err.message);
    }
  };

  // Fetch feed posts
  const fetchFeed = async (reset = false) => {
    try {
      setLoading(true);
      const currentOffset = reset ? 0 : offset;
      
      let url = `/api/posts?tab=${activeTab}&offset=${currentOffset}&limit=10`;
      
      // If "For You", fetch recommendation engine
      if (activeTab === 'forYou') {
        url = `/api/recommendations/posts`;
      }

      const res = await api.get(url);
      if (res.success) {
        if (reset) {
          setPosts(res.posts);
          setOffset(res.posts.length);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p._id));
            const unique = res.posts.filter(p => !existingIds.has(p._id));
            return [...prev, ...unique];
          });
          setOffset(prev => prev + res.posts.length);
        }
        if (res.posts.length < 10 || activeTab === 'forYou') {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch suggested creators for right side widgets
  const fetchSuggested = async () => {
    try {
      const res = await api.get('/api/users?limit=4');
      if (res.success) {
        setSuggestedCreators(res.users.filter(u => u._id !== currentUser?.id).slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeed(true);
    fetchSuggested();
    if (currentUser) {
      fetchFollowing();
    }
  }, [activeTab, currentUser]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setOffset(0);
    setHasMore(true);
  };

  // Handle files selection
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prev => [...prev, ...files]);

    const previews = files.map(file => URL.createObjectURL(file));
    setFilePreviews(prev => [...prev, ...previews]);
  };

  // Handle Poll options changes
  const handlePollOptionChange = (idx, val) => {
    const opts = [...pollOptions];
    opts[idx] = val;
    setPollOptions(opts);
  };

  const addPollOptionField = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  // Submit Post
  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postTitle.trim()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', postTitle);
      formData.append('caption', postCaption);
      formData.append('category', postCategory);
      formData.append('tags', postTags);
      formData.append('location', postLocation);
      formData.append('visibility', visibility);

      if (showPoll && pollQuestion.trim()) {
        formData.append('pollQuestion', pollQuestion);
        const filledOptions = pollOptions.filter(o => o.trim() !== '');
        formData.append('pollOptions', filledOptions.join(','));
      }

      if (selectedFiles.length > 0) {
        selectedFiles.forEach(file => {
          formData.append('media', file);
        });
      }

      const res = await api.post('/api/posts', formData, true);
      if (res.success) {
        setPosts(prev => [res.post, ...prev]);
        
        // Reset state
        setPostTitle('');
        setPostCaption('');
        setPostCategory('General');
        setPostTags('');
        setPostLocation('');
        setSelectedFiles([]);
        setFilePreviews([]);
        setShowPoll(false);
        setPollQuestion('');
        setPollOptions(['', '']);
      }
    } catch (err) {
      alert(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Follow
  const handleToggleFollow = async (authorId) => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await api.post(`/api/follow/${authorId}`);
      if (res.success) {
        setFollowingIds(prev => 
          prev.includes(authorId)
            ? prev.filter(id => id !== authorId)
            : [...prev, authorId]
        );
      }
    } catch (err) {
      alert(err.message || 'Follow action failed');
    }
  };

  // Actions
  const handleLikePost = async (postId) => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await api.post(`/api/posts/${postId}/like`);
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              likesCount: res.likesCount,
              likes: res.likes // Update array check
            };
          }
          return p;
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBookmarkPost = async (postId) => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await api.post(`/api/posts/${postId}/bookmark`);
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              bookmarks: res.bookmarks || []
            };
          }
          return p;
        }));
        alert(res.bookmarked ? 'Saved to bookmarks' : 'Removed from bookmarks');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePollVote = async (postId, optionId) => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await api.post(`/api/posts/${postId}/poll/vote`, { optionId });
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return { ...p, poll: res.poll };
          }
          return p;
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Comments Management
  const toggleCommentsSection = async (postId) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));

    if (!postComments[postId]) {
      try {
        const res = await api.get(`/api/comments/post/${postId}`);
        if (res.success) {
          setPostComments(prev => ({
            ...prev,
            [postId]: res.comments
          }));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddComment = async (postId) => {
    if (!currentUser) return navigate('/login');
    const text = newCommentText[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post('/api/comments', { postId, content: text });
      if (res.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: [res.comment, ...(prev[postId] || [])]
        }));
        setNewCommentText(prev => ({ ...prev, [postId]: '' }));

        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
          }
          return p;
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddReply = async (postId, commentId) => {
    if (!currentUser) return navigate('/login');
    const text = replyText[commentId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post(`/api/comments/${commentId}/reply`, { content: text });
      if (res.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => c._id === commentId ? res.comment : c)
        }));
        setReplyText(prev => ({ ...prev, [commentId]: '' }));
        setActiveReplyBox(prev => ({ ...prev, [commentId]: false }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLikeComment = async (postId, commentId) => {
    if (!currentUser) return navigate('/login');
    try {
      const res = await api.post(`/api/comments/${commentId}/like`);
      if (res.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => c._id === commentId ? { ...c, likes: res.likes } : c)
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEditCommentSubmit = async (postId, commentId) => {
    if (!editingCommentText.trim()) return;
    try {
      const res = await api.put(`/api/comments/${commentId}`, { content: editingCommentText });
      if (res.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => c._id === commentId ? { ...c, content: editingCommentText } : c)
        }));
        setEditingCommentId(null);
        setEditingCommentText('');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!currentUser) return;
    if (!window.confirm('Delete this comment permanently?')) return;
    try {
      const res = await api.delete(`/api/comments/${commentId}`);
      if (res.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: prev[postId].filter(c => c._id !== commentId)
        }));
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) };
          }
          return p;
        }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post permanently?')) return;
    try {
      const res = await api.delete(`/api/posts/${postId}`);
      if (res.success) {
        setPosts(prev => prev.filter(p => p._id !== postId));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 bg-black text-white min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar Profile Widget */}
        <div className="hidden lg:block space-y-6">
          {currentUser && (
            <div className="glass-panel p-6 rounded-2xl border border-border/80 text-center relative overflow-hidden bg-zinc-950/70">
              <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-primary to-primary-hover/50" />
              <div className="relative pt-6 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-4 border-zinc-950 overflow-hidden bg-zinc-800 flex items-center justify-center font-bold text-lg shadow-lg">
                  {currentUser.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <h3 className="text-sm font-bold text-white mt-3 flex items-center gap-1.5 justify-center">
                  <span>{currentUser.name}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-primary-glow fill-zinc-950" />
                </h3>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5">@{currentUser.username || 'username'}</span>
                <p className="text-[11px] text-zinc-400 mt-2 font-medium leading-relaxed px-2">{currentUser.headline || 'Creator Community Member'}</p>
                <div className="w-full h-px bg-zinc-900 my-4" />
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="block text-xs font-bold text-white font-mono">{followingIds.length}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Following</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-white font-mono">{currentUser.profileViews || 0}</span>
                    <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Views</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Communities & events list */}
          <div className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950/45 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Fast Navigation</h4>
            <div className="space-y-3 text-xs">
              <Link to="/discover" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
                <Compass className="w-4 h-4 text-primary-glow" />
                <span>Explore Portfolios</span>
              </Link>
              <Link to="/explore-projects" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
                <Briefcase className="w-4 h-4 text-primary-glow" />
                <span>Browse Projects</span>
              </Link>
              <Link to="/communities" className="flex items-center gap-2 text-zinc-400 hover:text-white transition">
                <Users className="w-4 h-4 text-primary-glow" />
                <span>Hub Communities</span>
              </Link>
            </div>
          </div>
        </div>

        {/* MID COLUMN: Home Feed & Create Post */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* CREATE POST CARD */}
          {currentUser && (
            <div className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs">
                  {currentUser.profileImage ? (
                    <img src={currentUser.profileImage} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    currentUser.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1">
                  <form onSubmit={handleCreatePost} className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Give your update a title..." 
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold border-b border-zinc-900 pb-2 outline-none text-white placeholder-zinc-650"
                    />
                    <textarea 
                      placeholder="Share your achievements, certs, code snippets or artwork..." 
                      rows="2"
                      value={postCaption}
                      onChange={(e) => setPostCaption(e.target.value)}
                      className="w-full bg-transparent text-xs outline-none text-zinc-300 resize-none placeholder-zinc-550 leading-relaxed"
                    />

                    {/* Poll Setup */}
                    {showPoll && (
                      <div className="p-3.5 rounded-xl border border-zinc-900 bg-black/40 space-y-3">
                        <input 
                          type="text"
                          placeholder="What is your poll question?"
                          value={pollQuestion}
                          onChange={(e) => setPostQuestion(e.target.value)}
                          className="w-full bg-transparent text-xs font-bold border-b border-zinc-800 pb-1.5 outline-none text-white placeholder-zinc-500"
                        />
                        <div className="space-y-2">
                          {pollOptions.map((opt, index) => (
                            <input 
                              key={index}
                              type="text"
                              placeholder={`Option ${index + 1}`}
                              value={opt}
                              onChange={(e) => handlePollOptionChange(index, e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-850 px-3 py-1.5 rounded-lg text-xs outline-none text-zinc-400 placeholder-zinc-600"
                            />
                          ))}
                        </div>
                        {pollOptions.length < 5 && (
                          <button 
                            type="button"
                            onClick={addPollOptionField}
                            className="text-[10px] text-primary-glow font-bold hover:underline"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>
                    )}

                    {/* File Previews */}
                    {filePreviews.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {filePreviews.map((src, i) => (
                          <div key={i} className="relative w-16 h-16 rounded overflow-hidden border border-zinc-800">
                            <img src={src} alt="Preview" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action tools panel */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-900">
                      <div className="flex gap-2 flex-wrap">
                        <button 
                          type="button" 
                          onClick={() => fileInputRef.current.click()}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-450 hover:text-white hover:border-zinc-700 transition text-xs"
                          title="Attach files, images, videos or audio"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attach Files</span>
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setShowPoll(!showPoll)}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${showPoll ? 'bg-primary/20 border-primary text-primary-glow font-bold' : 'bg-zinc-900 border-zinc-805 text-zinc-400 hover:text-white'}`}
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Create Poll</span>
                        </button>

                        <select 
                          value={postCategory}
                          onChange={(e) => setPostCategory(e.target.value)}
                          className="bg-zinc-905 border border-zinc-800 text-zinc-400 text-xs rounded-lg px-2.5 py-1.5 outline-none hover:text-white"
                        >
                          <option value="General">🌍 General</option>
                          <option value="Arts & Design">🎨 Artwork</option>
                          <option value="Photography">📸 Photography</option>
                          <option value="Gaming">🎮 Game Showcase</option>
                          <option value="Film & Entertainment">🎬 Movie Showcase</option>
                          <option value="Technology">💻 Coding Projects</option>
                          <option value="Certificates">🏆 Certificates</option>
                          <option value="Hiring">💼 Hiring Post</option>
                          <option value="Collaboration">🤝 Collaboration Request</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-3">
                        <input 
                          type="text" 
                          placeholder="Tags (comma)..." 
                          value={postTags}
                          onChange={(e) => setPostTags(e.target.value)}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 outline-none placeholder-zinc-600 max-w-[110px]"
                        />
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          multiple 
                          onChange={handleFileChange} 
                          className="hidden" 
                          accept="image/*,video/*,audio/*,application/pdf,application/zip"
                        />
                        <button 
                          type="submit" 
                          disabled={submitting || !postTitle.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:bg-zinc-800 disabled:text-zinc-650 text-white text-xs font-semibold shadow-lg hover:shadow-primary/20 transition-all duration-200"
                        >
                          {submitting ? 'Posting...' : 'Post'}
                          <Send className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Social Tabs List */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
              {[
                { id: 'forYou', label: 'For You' },
                { id: 'following', label: 'Following' },
                { id: 'trending', label: 'Trending' },
                { id: 'latest', label: 'Latest' },
                { id: 'hiring', label: 'Hiring' },
                { id: 'collaboration', label: 'Collaboration' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-primary/25 border border-primary/40 text-primary-glow shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* FEED LISTINGS */}
          <div className="space-y-6">
            {posts.length === 0 && !loading ? (
              <div className="glass-panel p-8 text-center text-zinc-500 text-xs">
                <span>No updates found. Be the first to share an update!</span>
              </div>
            ) : (
              posts.map(post => {
                const author = post.authorId;
                const authorIdStr = author?._id || author;
                const isLiked = post.likes && post.likes.includes(currentUser?.id);
                const isBookmarked = post.bookmarks && post.bookmarks.includes(currentUser?.id);
                const isFollowing = followingIds.includes(authorIdStr);

                return (
                  <div key={post._id} className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950">
                    
                    {/* Card Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <Link to={`/profile/${author?.username || authorIdStr}`}>
                          <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-sm">
                            {author?.profileImage ? (
                              <img src={author.profileImage} alt={author?.name} className="w-full h-full object-cover" />
                            ) : (
                              author?.name?.charAt(0).toUpperCase()
                            )}
                          </div>
                        </Link>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link to={`/profile/${author?.username || authorIdStr}`} className="font-bold text-sm hover:underline hover:text-primary-glow transition flex items-center gap-1">
                              <span>{author?.name || 'Creator'}</span>
                              <CheckCircle className="w-3.5 h-3.5 text-primary-glow fill-zinc-950" />
                            </Link>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">
                              {post.category}
                            </span>
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{author?.headline || 'Visual Developer'}</p>
                          <p className="text-[9px] text-zinc-650 mt-0.5 font-mono">
                            {new Date(post.createdAt).toLocaleDateString()} {post.location && `• ${post.location}`}
                          </p>
                        </div>
                      </div>

                      {/* Header Right: Follow button or Delete Option */}
                      <div className="flex items-center gap-2">
                        {currentUser && currentUser.id !== authorIdStr && (
                          <button
                            onClick={() => handleToggleFollow(authorIdStr)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                              isFollowing 
                                ? 'bg-zinc-900 border-zinc-800 text-zinc-400' 
                                : 'bg-primary/20 border-primary/30 text-primary-glow hover:bg-primary hover:text-white'
                            }`}
                          >
                            {isFollowing ? 'Unfollow' : 'Follow'}
                          </button>
                        )}
                        {currentUser?.id === authorIdStr && (
                          <button 
                            onClick={() => handleDeletePost(post._id)}
                            className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="mt-4 space-y-3">
                      <h3 className="text-sm font-bold font-display">{post.title}</h3>
                      {post.caption && (
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
                      )}

                      {/* Media Renderings */}
                      {post.media && post.media.length > 0 && (
                        <div className="rounded-xl overflow-hidden border border-zinc-900 bg-black">
                          {post.mediaType === 'video' ? (
                            <video src={post.media[0]} controls className="w-full max-h-[350px] object-contain" />
                          ) : post.mediaType === 'audio' ? (
                            <div className="p-4 bg-zinc-900 flex justify-center">
                              <audio src={post.media[0]} controls className="w-full" />
                            </div>
                          ) : (
                            // Images (Render first or grid)
                            <div className="grid grid-cols-1 gap-2">
                              {post.media.map((src, i) => (
                                <img key={i} src={src} alt="Post Attachment" className="w-full max-h-[350px] object-cover" />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Poll Option List */}
                      {post.poll && post.poll.options && (
                        <div className="mt-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-900 space-y-2">
                          <h4 className="text-xs font-bold text-white mb-2">{post.poll.question}</h4>
                          {post.poll.options.map((opt) => {
                            const totalVotes = post.poll.options.reduce((acc, o) => acc + o.votes.length, 0);
                            const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                            const hasVoted = post.poll.options.some(o => o.votes.includes(currentUser?.id));

                            return (
                              <button
                                key={opt._id}
                                disabled={hasVoted}
                                onClick={() => handlePollVote(post._id, opt._id)}
                                className="relative w-full text-left p-2.5 rounded-lg border border-zinc-805 bg-zinc-950 overflow-hidden disabled:cursor-default transition-all group"
                              >
                                <div 
                                  className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-500" 
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="relative flex justify-between text-xs">
                                  <span className="font-semibold text-zinc-300 group-hover:text-white transition">{opt.text}</span>
                                  <span className="font-mono text-zinc-400 font-bold">{pct}% ({opt.votes.length})</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Post Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.tags.map((tag, idx) => (
                            <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-550">
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Interactions Button Bar */}
                    <div className="flex flex-wrap items-center justify-between border-t border-zinc-900 mt-4 pt-3 text-zinc-400 text-xs gap-3">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => handleLikePost(post._id)}
                          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${isLiked ? 'text-pink-500 bg-pink-500/10 font-bold' : 'hover:text-white hover:bg-zinc-800'}`}
                        >
                          <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500' : ''}`} />
                          <span>{post.likesCount || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => toggleCommentsSection(post._id)}
                          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-white hover:bg-zinc-800 transition ${expandedComments[post._id] ? 'text-primary-glow bg-primary/10' : ''}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>{post.commentsCount || 0}</span>
                        </button>

                        <button 
                          onClick={() => handleBookmarkPost(post._id)}
                          className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-all ${isBookmarked ? 'text-yellow-500 bg-yellow-500/10 font-bold' : 'hover:text-white hover:bg-zinc-800'}`}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
                          <span>Save</span>
                        </button>
                      </div>

                      {/* Recruiter / Hire & Collaborate Buttons */}
                      {currentUser && currentUser.id !== authorIdStr && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/profile/${author?.username || authorIdStr}`)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 hover:bg-emerald-500 hover:text-white font-bold text-[10px] transition"
                          >
                            Hire Creator
                          </button>
                          <button
                            onClick={() => navigate('/messages')}
                            className="px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/25 text-primary-glow hover:bg-primary hover:text-white font-bold text-[10px] transition"
                          >
                            Collaborate
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Expanded Comments Drawer */}
                    {expandedComments[post._id] && (
                      <div className="mt-4 border-t border-zinc-900 pt-4 space-y-4">
                        
                        {/* write comment */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Write a comment..." 
                            value={newCommentText[post._id] || ''}
                            onChange={(e) => setNewCommentText({ ...newCommentText, [post._id]: e.target.value })}
                            className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs outline-none text-white placeholder-zinc-500"
                          />
                          <button 
                            onClick={() => handleAddComment(post._id)}
                            className="p-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition"
                          >
                            Comment
                          </button>
                        </div>

                        {/* comments list */}
                        <div className="space-y-4">
                          {postComments[post._id] && postComments[post._id].map(comment => {
                            const cAuthor = comment.authorId;
                            const isCommentLiked = comment.likes && comment.likes.includes(currentUser?.id);

                            return (
                              <div key={comment._id} className="space-y-2 pl-2 border-l border-zinc-850">
                                <div className="flex items-start justify-between">
                                  <div className="flex gap-2 items-center">
                                    <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-[10px]">
                                      {cAuthor?.profileImage ? (
                                        <img src={cAuthor.profileImage} alt={cAuthor.name} className="w-full h-full object-cover" />
                                      ) : (
                                        cAuthor?.name?.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div>
                                      <span className="font-bold text-[11px] text-zinc-350">{cAuthor?.name}</span>
                                      <span className="text-[9px] text-zinc-550 ml-2 font-mono">
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Delete comment if own */}
                                  {currentUser && (currentUser.id === (cAuthor?._id || cAuthor) || currentUser.isAdmin) && (
                                    <div className="flex gap-1.5">
                                      <button 
                                        onClick={() => {
                                          setEditingCommentId(comment._id);
                                          setEditingCommentText(comment.content);
                                        }}
                                        className="text-zinc-600 hover:text-white p-0.5"
                                        title="Edit comment"
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteComment(post._id, comment._id)}
                                        className="text-zinc-650 hover:text-red-400 p-0.5"
                                        title="Delete comment"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </div>

                                {/* Comment Content or Inline Edit Box */}
                                {editingCommentId === comment._id ? (
                                  <div className="flex gap-2 pl-8 pt-1">
                                    <input 
                                      type="text" 
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      className="flex-1 bg-zinc-950 border border-zinc-850 px-3 py-1 rounded text-xs text-white outline-none"
                                    />
                                    <button 
                                      onClick={() => handleEditCommentSubmit(post._id, comment._id)}
                                      className="px-2.5 py-1 rounded bg-primary text-white text-[10px] font-bold"
                                    >
                                      Save
                                    </button>
                                    <button 
                                      onClick={() => setEditingCommentId(null)}
                                      className="px-2.5 py-1 rounded bg-zinc-900 text-zinc-400 text-[10px]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <p className="text-xs text-zinc-300 pl-8 leading-relaxed">{comment.content}</p>
                                )}

                                {/* Comment Actions: Like & Reply toggles */}
                                <div className="flex items-center gap-4 pl-8 text-[9px] text-zinc-500">
                                  <button 
                                    onClick={() => handleLikeComment(post._id, comment._id)}
                                    className={`flex items-center gap-1 ${isCommentLiked ? 'text-pink-500 font-bold' : 'hover:text-white'}`}
                                  >
                                    <Heart className="w-3 h-3" />
                                    <span>{comment.likes ? comment.likes.length : 0} Likes</span>
                                  </button>
                                  <button 
                                    onClick={() => setActiveReplyBox(prev => ({ ...prev, [comment._id]: !prev[comment._id] }))}
                                    className="hover:text-white font-semibold"
                                  >
                                    Reply
                                  </button>
                                </div>

                                {/* Reply Input Container */}
                                {activeReplyBox[comment._id] && (
                                  <div className="pl-8 pt-2 flex gap-2">
                                    <input 
                                      type="text" 
                                      placeholder="Reply to this comment..." 
                                      value={replyText[comment._id] || ''}
                                      onChange={(e) => setReplyText({ ...replyText, [comment._id]: e.target.value })}
                                      className="flex-1 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded text-xs outline-none text-white"
                                    />
                                    <button 
                                      onClick={() => handleAddReply(post._id, comment._id)}
                                      className="px-3 py-1 rounded bg-primary text-white text-[10px] font-bold"
                                    >
                                      Reply
                                    </button>
                                  </div>
                                )}

                                {/* Nested Replies Rendering */}
                                {comment.replies && comment.replies.length > 0 && (
                                  <div className="pl-8 space-y-2.5 pt-2.5">
                                    {comment.replies.map((reply, ridx) => (
                                      <div key={ridx} className="space-y-1 pl-2 border-l border-zinc-850 bg-zinc-950/30 p-1.5 rounded-lg">
                                        <div className="flex items-center gap-2">
                                          <div className="w-5 h-5 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-[9px]">
                                            {reply.profileImage ? (
                                              <img src={reply.profileImage} alt={reply.name} className="w-full h-full object-cover" />
                                            ) : (
                                              reply.name?.charAt(0).toUpperCase()
                                            )}
                                          </div>
                                          <div>
                                            <span className="font-bold text-[10px] text-zinc-350">{reply.name}</span>
                                            <span className="text-[8px] text-zinc-600 ml-2 font-mono">
                                              {new Date(reply.createdAt).toLocaleDateString()}
                                            </span>
                                          </div>
                                        </div>
                                        <p className="text-[11px] text-zinc-300 pl-7 leading-relaxed">{reply.content}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}

            {/* Pagination Loader */}
            {hasMore && posts.length > 0 && (
              <button 
                onClick={() => fetchFeed(false)}
                disabled={loading}
                className="w-full py-2.5 bg-zinc-900 border border-zinc-805 hover:bg-zinc-850 text-zinc-450 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
              >
                {loading ? 'Retrieving updates...' : 'Load More Posts'}
              </button>
            )}
          </div>
        </div>

        {/* Right Sidebar Widgets */}
        <div className="hidden lg:block space-y-6">
          
          {/* Suggested Creators list widget */}
          <div className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Suggested Creators</h3>
            <div className="space-y-4">
              {suggestedCreators.map(creator => (
                <div key={creator._id} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Link to={`/profile/${creator.username || creator._id}`} className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs">
                        {creator.profileImage ? (
                          <img src={creator.profileImage} alt={creator.name} className="w-full h-full object-cover" />
                        ) : (
                          creator.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Link>
                    <div className="overflow-hidden">
                      <Link to={`/profile/${creator.username || creator._id}`} className="block text-xs font-bold text-white hover:underline truncate">
                        {creator.name}
                      </Link>
                      <span className="text-[9px] text-zinc-500 truncate block">{creator.headline || 'Creator Talent'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleFollow(creator._id)}
                    className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition flex-shrink-0"
                    title="Follow Creator"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trending hashtags widget */}
          <div className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950/70 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Trending Topics</h3>
            <div className="space-y-3">
              {trendingTags.map((tag, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-zinc-300 font-mono">{tag}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">1.2k posts</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default HomeFeed;
