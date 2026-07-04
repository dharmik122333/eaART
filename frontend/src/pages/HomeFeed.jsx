import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Send, Image, Video, Award, HelpCircle, Heart, MessageSquare, 
  Share2, Bookmark, Trash2, MapPin, Globe, Compass, ChevronDown, Check, UserPlus
} from 'lucide-react';

const HomeFeed = () => {
  const { user } = useAuth();
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

  // Stats / widgets states
  const [trendingTags, setTrendingTags] = useState(['#GameJam', '#UnrealEngine5', '#3DArt', '#IndieFilm', '#FullStackWeb']);
  const [suggestedCreators, setSuggestedCreators] = useState([]);

  const fileInputRef = useRef(null);

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
          setPosts(prev => [...prev, ...res.posts]);
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
        // Exclude current user
        setSuggestedCreators(res.users.filter(u => u._id !== user?.id).slice(0, 3));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFeed(true);
    fetchSuggested();
  }, [activeTab]);

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

      selectedFiles.forEach(file => {
        formData.append('media', file);
      });

      if (showPoll && pollQuestion.trim()) {
        formData.append('pollQuestion', pollQuestion);
        // filter empty options
        const filteredOpts = pollOptions.filter(o => o.trim() !== '');
        formData.append('pollOptions', filteredOpts.join(','));
      }

      const res = await api.post('/api/posts', formData, true);
      if (res.success) {
        // Prepend new post
        setPosts(prev => [res.post, ...prev]);
        
        // Reset states
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
      alert(err.message || 'Post creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Like
  const handleLikePost = async (postId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/like`);
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              likesCount: res.likesCount,
              likedByUser: res.liked
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Bookmark
  const handleBookmarkPost = async (postId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/bookmark`);
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return {
              ...p,
              bookmarkedByUser: res.bookmarked
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Poll Vote
  const handlePollVote = async (postId, optionId) => {
    try {
      const res = await api.post(`/api/posts/${postId}/poll/vote`, { optionId });
      if (res.success) {
        setPosts(prev => prev.map(p => {
          if (p._id === postId) {
            return res.post;
          }
          return p;
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to submit vote');
    }
  };

  // Fetch comments
  const toggleCommentsSection = async (postId) => {
    if (expandedComments[postId]) {
      setExpandedComments(prev => ({ ...prev, [postId]: false }));
      return;
    }

    try {
      const res = await api.get(`/api/comments/post/${postId}`);
      if (res.success) {
        setPostComments(prev => ({ ...prev, [postId]: res.comments }));
        setExpandedComments(prev => ({ ...prev, [postId]: true }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Post Comment
  const handleAddComment = async (postId) => {
    const text = newCommentText[postId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post('/api/comments', { postId, content: text });
      if (res.success) {
        // Prepend new comment
        setPostComments(prev => ({
          ...prev,
          [postId]: [res.comment, ...(prev[postId] || [])]
        }));
        
        // Clear input
        setNewCommentText(prev => ({ ...prev, [postId]: '' }));

        // Increment local posts counts
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

  // Post Sub-reply
  const handleAddReply = async (postId, commentId) => {
    const text = replyText[commentId];
    if (!text || !text.trim()) return;

    try {
      const res = await api.post(`/api/comments/${commentId}/reply`, { content: text });
      if (res.success) {
        setPostComments(prev => ({
          ...prev,
          [postId]: prev[postId].map(c => {
            if (c._id === commentId) {
              return res.comment;
            }
            return c;
          })
        }));
        setReplyText(prev => ({ ...prev, [commentId]: '' }));
        setActiveReplyBox(prev => ({ ...prev, [commentId]: false }));
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete own post
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

  // Follow Creator from widget
  const handleFollowCreator = async (creatorId) => {
    try {
      const res = await api.post(`/api/follow/${creatorId}`);
      if (res.success) {
        setSuggestedCreators(prev => prev.map(c => {
          if (c._id === creatorId) {
            return { ...c, followedByUser: res.followed };
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Column: Creator Mini Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel rounded-2xl overflow-hidden border border-border/80 bg-zinc-950">
            {/* cover banner */}
            <div className="h-20 w-full bg-gradient-to-r from-violet-900 to-black relative">
              {user?.coverBanner && (
                <img src={user.coverBanner} alt="cover" className="w-full h-full object-cover" />
              )}
            </div>
            {/* profile details */}
            <div className="p-4 pt-0 relative flex flex-col items-center text-center border-b border-border/40">
              <div className="w-16 h-16 rounded-full border-2 border-primary-glow bg-zinc-900 -mt-8 overflow-hidden flex items-center justify-center font-bold text-lg text-primary-glow shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name.charAt(0).toUpperCase()
                )}
              </div>
              <h3 className="mt-2 text-md font-bold font-display">{user?.name}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">{user?.headline || user?.role}</p>
              <p className="text-[10px] text-zinc-500 font-mono mt-1">{user?.industry || 'Creative Roster'}</p>
              
              <Link 
                to={user?.role === 'Creator' ? `/creator/${user?.id}` : '/dashboard'} 
                className="mt-3 w-full py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:border-primary-glow/60 transition-all text-center"
              >
                View Profile
              </Link>
            </div>
            
            {/* stats overview */}
            <div className="p-3 space-y-2 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Profile views</span>
                <span className="font-mono text-white font-bold">{user?.profileViews || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Portfolio views</span>
                <span className="font-mono text-white font-bold">{user?.portfolioViews || 0}</span>
              </div>
            </div>
          </div>

          {/* Communities & events quick shortcut */}
          <div className="glass-panel p-4 rounded-2xl border border-border/85 bg-zinc-950/80 space-y-4">
            <h4 className="text-xs font-bold text-zinc-300 tracking-wider uppercase">Quick Hub</h4>
            <div className="space-y-2 text-xs">
              <Link to="/communities" className="flex items-center gap-2 text-zinc-400 hover:text-primary-glow transition-all py-1">
                <Compass className="w-4 h-4" />
                <span>Creative Communities</span>
              </Link>
              <Link to="/events" className="flex items-center gap-2 text-zinc-400 hover:text-primary-glow transition-all py-1">
                <Award className="w-4 h-4" />
                <span>Upcoming Festivals & Jams</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Middle Column: Central Feed */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Post Form */}
          <div className="glass-panel p-4 rounded-2xl border border-border/80 bg-zinc-950">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt="User avatar" className="w-full h-full object-cover" />
                  ) : (
                    user?.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input 
                    type="text" 
                    placeholder="Give your update a title..." 
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    className="w-full bg-transparent outline-none border-none text-white font-semibold text-sm placeholder-zinc-500"
                    required
                  />
                  <textarea 
                    placeholder="Share what you are working on, certificates, ideas, or contract alerts..."
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    rows={3}
                    className="w-full bg-transparent outline-none border-none text-zinc-300 text-xs placeholder-zinc-500 resize-none"
                  />
                </div>
              </div>

              {/* Poll builder panel */}
              {showPoll && (
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                  <input 
                    type="text"
                    placeholder="Ask a question..."
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded text-xs outline-none text-white placeholder-zinc-500"
                  />
                  <div className="space-y-1.5">
                    {pollOptions.map((opt, index) => (
                      <input 
                        key={index}
                        type="text"
                        placeholder={`Option ${index + 1}`}
                        value={opt}
                        onChange={(e) => handlePollOptionChange(index, e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 px-3 py-1 rounded text-xs outline-none text-zinc-400 placeholder-zinc-600"
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
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition text-xs"
                    title="Upload images/videos"
                  >
                    <Image className="w-3.5 h-3.5" />
                    <span>Media</span>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowPoll(!showPoll)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition ${showPoll ? 'bg-primary/20 border-primary text-primary-glow' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'}`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Create Poll</span>
                  </button>

                  <select 
                    value={postCategory}
                    onChange={(e) => setPostCategory(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-lg px-2 py-1 outline-none hover:text-white"
                  >
                    <option value="General">General</option>
                    <option value="Arts & Design">Design</option>
                    <option value="Film & Entertainment">Film</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Music & Audio">Music</option>
                    <option value="Technology">Tech</option>
                    <option value="Hiring">Hiring Post</option>
                    <option value="Collaboration">Collaboration</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <input 
                    type="text" 
                    placeholder="Tags (comma separated)..." 
                    value={postTags}
                    onChange={(e) => setPostTags(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 outline-none placeholder-zinc-600 max-w-[130px]"
                  />
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    multiple 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*,video/*,audio/*"
                  />
                  <button 
                    type="submit" 
                    disabled={submitting || !postTitle.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary-hover disabled:bg-zinc-800 disabled:text-zinc-600 text-white text-xs font-semibold shadow-lg hover:shadow-primary/20 transition-all duration-200"
                  >
                    {submitting ? 'Posting...' : 'Post'}
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Social Tabs list */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth">
              {['latest', 'forYou', 'following', 'trending', 'hiring', 'collaboration'].map(tab => (
                <button
                  key={tab}
                  onClick={() => handleTabChange(tab)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${activeTab === tab ? 'bg-primary/20 text-primary-glow border border-primary/30' : 'text-zinc-400 hover:text-white'}`}
                >
                  {tab === 'forYou' ? '✨ For You' : tab}
                </button>
              ))}
            </div>
          </div>

          {/* Roster of Post Cards */}
          <div className="space-y-6">
            {posts.map(post => {
              const author = post.authorId;
              const isLiked = post.likedByUser;
              const isBookmarked = post.bookmarkedByUser;
              const authorIdStr = author?._id || author;

              return (
                <div key={post._id} className="glass-panel p-5 rounded-2xl border border-border/80 bg-zinc-950">
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Link to={`/creator/${authorIdStr}`}>
                        <div className="w-10 h-10 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-sm">
                          {author?.profileImage ? (
                            <img src={author.profileImage} alt={author.name} className="w-full h-full object-cover" />
                          ) : (
                            author?.name?.charAt(0).toUpperCase()
                          )}
                        </div>
                      </Link>
                      <div>
                        <div className="flex items-center gap-2">
                          <Link to={`/creator/${authorIdStr}`} className="font-bold text-sm hover:underline hover:text-primary-glow transition">
                            {author?.name || 'Creator'}
                          </Link>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-500 font-semibold uppercase tracking-wider">{post.category}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-0.5">{author?.headline || 'Visual Developer'}</p>
                        <p className="text-[9px] text-zinc-600 mt-0.5 font-mono">{new Date(post.createdAt).toLocaleDateString()} {post.location && `• ${post.location}`}</p>
                      </div>
                    </div>

                    {/* Options (Delete if own post) */}
                    {user?.id === authorIdStr && (
                      <button 
                        onClick={() => handleDeletePost(post._id)}
                        className="text-zinc-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
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
                          const hasVoted = post.poll.options.some(o => o.votes.includes(user?.id));

                          return (
                            <button
                              key={opt._id}
                              disabled={hasVoted}
                              onClick={() => handlePollVote(post._id, opt._id)}
                              className="relative w-full text-left p-2.5 rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden disabled:cursor-default transition-all group"
                            >
                              {/* progress overlay bar */}
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
                          <span key={idx} className="text-[9px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Interactions Button Bar */}
                  <div className="flex items-center justify-between border-t border-zinc-900 mt-4 pt-3 text-zinc-400 text-xs">
                    <button 
                      onClick={() => handleLikePost(post._id)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${isLiked ? 'text-pink-500 bg-pink-500/10 font-bold' : 'hover:text-white hover:bg-zinc-800'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-pink-500' : ''}`} />
                      <span>{post.likesCount || 0}</span>
                    </button>
                    
                    <button 
                      onClick={() => toggleCommentsSection(post._id)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:text-white hover:bg-zinc-800 transition ${expandedComments[post._id] ? 'text-primary-glow bg-primary/10' : ''}`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.commentsCount || 0}</span>
                    </button>

                    <button 
                      onClick={() => handleBookmarkPost(post._id)}
                      className={`flex items-center gap-1.5 py-1 px-2.5 rounded-lg transition-all ${isBookmarked ? 'text-yellow-500 bg-yellow-500/10 font-bold' : 'hover:text-white hover:bg-zinc-800'}`}
                    >
                      <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-yellow-500' : ''}`} />
                      <span>Save</span>
                    </button>
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
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* comment roster */}
                      <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                        {(postComments[post._id] || []).map((comm) => (
                          <div key={comm._id} className="space-y-1.5 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-900/60">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-[10px]">
                                {comm.authorId?.profileImage ? (
                                  <img src={comm.authorId.profileImage} alt={comm.authorId.name} className="w-full h-full object-cover" />
                                ) : (
                                  comm.authorId?.name?.charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-bold text-[11px] text-zinc-300">{comm.authorId?.name}</span>
                              <span className="text-[8px] text-zinc-500 font-mono ml-auto">{new Date(comm.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-[11px] text-zinc-300 pl-8">{comm.content}</p>

                            {/* Replies roster */}
                            {comm.replies && comm.replies.length > 0 && (
                              <div className="pl-8 pt-1 space-y-1.5">
                                {comm.replies.map((rep, rIdx) => (
                                  <div key={rIdx} className="p-1.5 rounded bg-zinc-950/60 border border-zinc-900 flex flex-col">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                      <div className="w-4 h-4 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-[8px]">
                                        {rep.profileImage ? (
                                          <img src={rep.profileImage} alt={rep.name} className="w-full h-full object-cover" />
                                        ) : (
                                          rep.name?.charAt(0).toUpperCase()
                                        )}
                                      </div>
                                      <span className="font-bold text-[9px] text-zinc-400">{rep.name}</span>
                                    </div>
                                    <p className="text-[10px] text-zinc-400 pl-5">{rep.content}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply option */}
                            <div className="pl-8 flex items-center gap-2">
                              {activeReplyBox[comm._id] ? (
                                <div className="flex gap-1.5 w-full mt-1.5">
                                  <input 
                                    type="text" 
                                    placeholder="Write reply..." 
                                    value={replyText[comm._id] || ''}
                                    onChange={(e) => setReplyText({ ...replyText, [comm._id]: e.target.value })}
                                    className="flex-1 bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-[10px] outline-none text-zinc-300"
                                  />
                                  <button 
                                    onClick={() => handleAddReply(post._id, comm._id)}
                                    className="px-2 py-1 rounded bg-primary text-white text-[9px] font-bold"
                                  >
                                    Send
                                  </button>
                                  <button 
                                    onClick={() => setActiveReplyBox({ ...activeReplyBox, [comm._id]: false })}
                                    className="text-[9px] text-zinc-500 hover:text-white"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setActiveReplyBox({ ...activeReplyBox, [comm._id]: true })}
                                  className="text-[9px] text-zinc-500 hover:text-white font-bold hover:underline"
                                >
                                  Reply
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="space-y-4">
                {[1, 2].map(n => (
                  <div key={n} className="glass-panel p-5 rounded-2xl border border-zinc-900 bg-zinc-950 animate-pulse space-y-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800" />
                      <div className="space-y-2 flex-1">
                        <div className="h-3 w-1/3 bg-zinc-800 rounded" />
                        <div className="h-2.5 w-1/4 bg-zinc-800 rounded" />
                      </div>
                    </div>
                    <div className="h-3 w-full bg-zinc-800 rounded" />
                    <div className="h-3 w-5/6 bg-zinc-800 rounded" />
                    <div className="h-40 w-full bg-zinc-800 rounded-xl" />
                  </div>
                ))}
              </div>
            )}

            {!loading && posts.length === 0 && (
              <div className="glass-panel p-8 text-center rounded-2xl border border-zinc-900 bg-zinc-950">
                <Compass className="w-8 h-8 text-zinc-500 mx-auto mb-2" />
                <p className="text-zinc-400 text-xs">No posts found in this category.</p>
              </div>
            )}

            {hasMore && !loading && posts.length > 0 && (
              <button 
                onClick={() => fetchFeed()}
                className="w-full py-2.5 rounded-xl border border-zinc-900 hover:border-zinc-700 bg-zinc-950 text-xs font-semibold text-zinc-400 hover:text-white transition"
              >
                Load More Updates
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Trending tags & Suggested Connections */}
        <div className="lg:col-span-1 space-y-6">
          {/* Creator suggestions list */}
          <div className="glass-panel p-4 rounded-2xl border border-border/80 bg-zinc-950">
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase mb-3">Trending Creators</h3>
            <div className="space-y-3">
              {suggestedCreators.map(creator => (
                <div key={creator._id} className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Link to={`/creator/${creator._id}`}>
                      <div className="w-8 h-8 rounded-full bg-zinc-800 overflow-hidden flex items-center justify-center font-bold text-xs">
                        {creator.profileImage ? (
                          <img src={creator.profileImage} alt={creator.name} className="w-full h-full object-cover" />
                        ) : (
                          creator.name.charAt(0).toUpperCase()
                        )}
                      </div>
                    </Link>
                    <div className="overflow-hidden">
                      <Link to={`/creator/${creator._id}`} className="block text-xs font-bold hover:text-primary-glow truncate max-w-[110px]">
                        {creator.name}
                      </Link>
                      <span className="block text-[9px] text-zinc-500 truncate max-w-[110px]">{creator.headline || creator.role}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleFollowCreator(creator._id)}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold transition-all ${creator.followedByUser ? 'bg-zinc-800 border-zinc-700 text-zinc-400' : 'bg-primary/20 border-primary text-primary-glow hover:bg-primary/45'}`}
                  >
                    {creator.followedByUser ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Topics tags */}
          <div className="glass-panel p-4 rounded-2xl border border-border/80 bg-zinc-950">
            <h3 className="text-xs font-bold text-zinc-300 tracking-wider uppercase mb-3">Trending Topics</h3>
            <div className="flex flex-wrap gap-2">
              {trendingTags.map((tag, idx) => (
                <span key={idx} className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer transition">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default HomeFeed;
