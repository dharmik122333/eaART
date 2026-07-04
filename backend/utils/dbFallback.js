const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '../data');
const dbFile = path.join(dataDir, 'db.json');

// Ensure database file exists with all new collections
const initDbFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  let structureExists = false;
  if (fs.existsSync(dbFile)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
      if (parsed.posts && parsed.comments && parsed.likes && parsed.followers && 
          parsed.notifications && parsed.messages && parsed.communities && 
          parsed.events && parsed.bookmarks) {
        structureExists = true;
      }
    } catch (e) {
      structureExists = false;
    }
  }

  if (!structureExists) {
    fs.writeFileSync(
      dbFile,
      JSON.stringify({
        users: [],
        portfolios: [],
        projects: [],
        applications: [],
        posts: [],
        comments: [],
        likes: [],
        followers: [],
        notifications: [],
        messages: [],
        communities: [],
        events: [],
        bookmarks: []
      }, null, 2)
    );
  }
};

const readData = () => {
  initDbFile();
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {
      users: [], portfolios: [], projects: [], applications: [],
      posts: [], comments: [], likes: [], followers: [],
      notifications: [], messages: [], communities: [], events: [], bookmarks: []
    };
  }
};

const writeData = (data) => {
  initDbFile();
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
};

// Check if mongoose is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Seed default communities and hackathons
const seedBaseData = (data) => {
  let changed = false;

  if (data.communities.length === 0) {
    data.communities = [
      {
        _id: 'comm_1',
        name: 'Gaming & 3D Art',
        description: 'Blender modeling assets, Unreal Engine blueprints pipelines, shader coding, and game production mechanics.',
        coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600',
        members: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'comm_2',
        name: 'Film & Entertainment',
        description: 'Cinematography rigs, script writing, video reels, camera gears, and audio tracks production.',
        coverImage: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600',
        members: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'comm_3',
        name: 'Interactive Tech',
        description: 'Three.js shaders, WebGL performance, full stack React systems, and creative technology installations.',
        coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600',
        members: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'comm_4',
        name: 'Music & Synthesis',
        description: 'Eurorack synthesizers, audio sequencing, digital orchestrations, and film score composition.',
        coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600',
        members: [],
        createdAt: new Date().toISOString()
      }
    ];
    changed = true;
  }

  if (data.events.length === 0) {
    data.events = [
      {
        _id: 'eve_1',
        title: 'Global Creative Jam 2026',
        description: 'Join developers, filmmakers, and musicians to create an interactive micro-narrative in 48 hours.',
        type: 'Game Jam',
        date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Online (Discord Workspace)',
        organizerId: 'system',
        attendees: [],
        createdAt: new Date().toISOString()
      },
      {
        _id: 'eve_2',
        title: 'Project EARTH Design Hackathon',
        description: 'Design the future of collaborative workspaces for creators. Total cash pool: $15,000.',
        type: 'Hackathon',
        date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'San Francisco Hub & Online',
        organizerId: 'system',
        attendees: [],
        createdAt: new Date().toISOString()
      }
    ];
    changed = true;
  }

  if (changed) {
    writeData(data);
  }
};

const currentData = readData();
seedBaseData(currentData);

module.exports = {
  isMongoConnected,
  
  // Custom fallback database actions
  fallbackDb: {
    // --- Users ---
    findUsers: (query = {}) => {
      const db = readData();
      return db.users.filter(u => {
        let match = true;
        if (query.role && u.role !== query.role) match = false;
        if (query.category && u.category !== query.category) match = false;
        if (query.availability !== undefined && u.availability !== query.availability) match = false;
        if (query.search) {
          const s = query.search.toLowerCase();
          const nameMatch = u.name.toLowerCase().includes(s);
          const bioMatch = u.bio && u.bio.toLowerCase().includes(s);
          const locMatch = u.location && u.location.toLowerCase().includes(s);
          if (!nameMatch && !bioMatch && !locMatch) match = false;
        }
        if (query.skills && query.skills.length > 0) {
          const hasAll = query.skills.every(skill => 
            u.skills && u.skills.some(us => us.toLowerCase().includes(skill.toLowerCase()))
          );
          if (!hasAll) match = false;
        }
        return match;
      });
    },

    findUserById: (id) => {
      const db = readData();
      return db.users.find(u => u._id === id || (u.id && u.id.toString() === id));
    },

    findUserByEmail: (email) => {
      const db = readData();
      return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    },

    findUserByUsername: (username) => {
      const db = readData();
      if (!username) return null;
      const cleanUsername = username.startsWith('@') ? username.substring(1) : username;
      return db.users.find(u => u.username && u.username.toLowerCase() === cleanUsername.toLowerCase());
    },

    createUser: (userData) => {
      const db = readData();
      const defaultUsername = userData.username || 
        (userData.name ? userData.name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'user') + '_' + Date.now().toString().slice(-4);
      
      const newUser = {
        _id: 'user_' + Date.now(),
        username: defaultUsername.startsWith('@') ? defaultUsername.substring(1) : defaultUsername,
        coverBanner: '',
        headline: '',
        industry: '',
        experience: [],
        education: [],
        achievements: [],
        profileViews: 0,
        portfolioViews: 0,
        emailVerified: false,
        isAdmin: false,
        ...userData,
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      writeData(db);
      return newUser;
    },

    deleteUser: (id) => {
      const db = readData();
      db.users = db.users.filter(u => u._id !== id);
      db.projects = db.projects.filter(p => p.recruiterId !== id);
      db.applications = db.applications.filter(a => a.creatorId !== id);
      db.posts = db.posts.filter(p => p.authorId !== id);
      db.comments = db.comments.filter(c => c.authorId !== id);
      db.likes = db.likes.filter(l => l.userId !== id);
      writeData(db);
      return true;
    },

    updateUser: (id, updateFields) => {
      const db = readData();
      const idx = db.users.findIndex(u => u._id === id);
      if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...updateFields };
        writeData(db);
        return db.users[idx];
      }
      return null;
    },

    // --- Projects ---
    findProjects: (query = {}) => {
      const db = readData();
      return db.projects.filter(p => {
        let match = true;
        if (query.category && p.category !== query.category) match = false;
        if (query.status && p.status !== query.status) match = false;
        if (query.recruiterId && p.recruiterId !== query.recruiterId) match = false;
        if (query.search) {
          const s = query.search.toLowerCase();
          const titleMatch = p.title.toLowerCase().includes(s);
          const descMatch = p.description.toLowerCase().includes(s);
          if (!titleMatch && !descMatch) match = false;
        }
        if (query.minBudget && p.budget < query.minBudget) match = false;
        if (query.maxBudget && p.budget > query.maxBudget) match = false;
        return match;
      }).map(p => {
        const rec = db.users.find(u => u._id === p.recruiterId);
        return {
          ...p,
          recruiterId: rec ? { _id: rec._id, name: rec.name, organization: rec.organization, profileImage: rec.profileImage } : null
        };
      });
    },

    findProjectById: (id) => {
      const db = readData();
      const p = db.projects.find(p => p._id === id);
      if (!p) return null;
      const rec = db.users.find(u => u._id === p.recruiterId);
      return {
        ...p,
        recruiterId: rec ? { _id: rec._id, name: rec.name, email: rec.email, organization: rec.organization, profileImage: rec.profileImage, bio: rec.bio, location: rec.location } : null
      };
    },

    createProject: (projData) => {
      const db = readData();
      const newProj = {
        _id: 'proj_' + Date.now(),
        ...projData,
        status: 'open',
        createdAt: new Date().toISOString()
      };
      db.projects.push(newProj);
      writeData(db);
      return newProj;
    },

    updateProject: (id, updateFields) => {
      const db = readData();
      const idx = db.projects.findIndex(p => p._id === id);
      if (idx !== -1) {
        db.projects[idx] = { ...db.projects[idx], ...updateFields };
        writeData(db);
        return db.projects[idx];
      }
      return null;
    },

    deleteProject: (id) => {
      const db = readData();
      db.projects = db.projects.filter(p => p._id !== id);
      db.applications = db.applications.filter(a => a.projectId !== id);
      writeData(db);
      return true;
    },

    // --- Portfolios ---
    findPortfoliosByCreator: (creatorId) => {
      const db = readData();
      return db.portfolios.filter(p => p.creatorId === creatorId);
    },

    findPortfolioById: (id) => {
      const db = readData();
      return db.portfolios.find(p => p._id === id);
    },

    createPortfolio: (portData) => {
      const db = readData();
      const newPort = {
        _id: 'port_' + Date.now(),
        ...portData,
        createdAt: new Date().toISOString()
      };
      db.portfolios.push(newPort);
      writeData(db);
      return newPort;
    },

    deletePortfolio: (id) => {
      const db = readData();
      db.portfolios = db.portfolios.filter(p => p._id !== id);
      writeData(db);
      return true;
    },

    // --- Applications ---
    findApplications: (query = {}) => {
      const db = readData();
      return db.applications.filter(a => {
        let match = true;
        if (query.creatorId && a.creatorId !== query.creatorId) match = false;
        if (query.projectId && a.projectId !== query.projectId) match = false;
        return match;
      }).map(a => {
        const creator = db.users.find(u => u._id === a.creatorId);
        const project = db.projects.find(p => p._id === a.projectId);
        const recruiter = project ? db.users.find(u => u._id === project.recruiterId) : null;
        
        return {
          ...a,
          creatorId: creator ? { _id: creator._id, name: creator.name, email: creator.email, profileImage: creator.profileImage, bio: creator.bio, skills: creator.skills, category: creator.category, availability: creator.availability, location: creator.location } : null,
          projectId: project ? { 
            _id: project._id, 
            title: project.title, 
            budget: project.budget, 
            status: project.status, 
            deadline: project.deadline, 
            category: project.category,
            recruiterId: recruiter ? { _id: recruiter._id, name: recruiter.name, organization: recruiter.organization, profileImage: recruiter.profileImage } : null
          } : null
        };
      });
    },

    findApplicationById: (id) => {
      const db = readData();
      const app = db.applications.find(a => a._id === id);
      if (!app) return null;
      const project = db.projects.find(p => p._id === app.projectId);
      return {
        ...app,
        projectId: project
      };
    },

    findApplicationByUnique: (projectId, creatorId) => {
      const db = readData();
      return db.applications.find(a => a.projectId === projectId && a.creatorId === creatorId);
    },

    createApplication: (appData) => {
      const db = readData();
      const newApp = {
        _id: 'app_' + Date.now(),
        ...appData,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      db.applications.push(newApp);
      writeData(db);
      return newApp;
    },

    updateApplication: (id, updateFields) => {
      const db = readData();
      const idx = db.applications.findIndex(a => a._id === id);
      if (idx !== -1) {
        db.applications[idx] = { ...db.applications[idx], ...updateFields };
        writeData(db);
        return db.applications[idx];
      }
      return null;
    },

    // ==========================================
    // --- Posts ---
    // ==========================================
    findPosts: (query = {}) => {
      const db = readData();
      return db.posts.filter(p => {
        let match = true;
        if (query.authorId && p.authorId !== query.authorId) match = false;
        if (query.category && p.category !== query.category) match = false;
        if (query.communityId && p.communityId !== query.communityId) match = false;
        if (query.visibility && p.visibility !== query.visibility) match = false;
        if (query.search) {
          const s = query.search.toLowerCase();
          const titleMatch = p.title.toLowerCase().includes(s);
          const captionMatch = p.caption && p.caption.toLowerCase().includes(s);
          if (!titleMatch && !captionMatch) match = false;
        }
        return match;
      }).map(p => {
        const author = db.users.find(u => u._id === p.authorId);
        const community = p.communityId ? db.communities.find(c => c._id === p.communityId) : null;
        return {
          ...p,
          authorId: author ? { _id: author._id, name: author.name, profileImage: author.profileImage, headline: author.headline } : null,
          communityId: community ? { _id: community._id, name: community.name } : null
        };
      });
    },

    findPostById: (id) => {
      const db = readData();
      const p = db.posts.find(p => p._id === id);
      if (!p) return null;
      const author = db.users.find(u => u._id === p.authorId);
      const community = p.communityId ? db.communities.find(c => c._id === p.communityId) : null;
      return {
        ...p,
        authorId: author ? { _id: author._id, name: author.name, profileImage: author.profileImage, headline: author.headline } : null,
        communityId: community ? { _id: community._id, name: community.name } : null
      };
    },

    createPost: (postData) => {
      const db = readData();
      const newPost = {
        _id: 'post_' + Date.now(),
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        media: [],
        mediaType: 'text',
        tags: [],
        location: '',
        visibility: 'public',
        communityId: null,
        ...postData,
        createdAt: new Date().toISOString()
      };
      db.posts.push(newPost);
      writeData(db);
      return newPost;
    },

    updatePost: (id, updateFields) => {
      const db = readData();
      const idx = db.posts.findIndex(p => p._id === id);
      if (idx !== -1) {
        db.posts[idx] = { ...db.posts[idx], ...updateFields };
        writeData(db);
        return db.posts[idx];
      }
      return null;
    },

    deletePost: (id) => {
      const db = readData();
      db.posts = db.posts.filter(p => p._id !== id);
      db.comments = db.comments.filter(c => c.postId !== id);
      db.likes = db.likes.filter(l => l.postId !== id);
      db.bookmarks = db.bookmarks.filter(b => b.postId !== id);
      writeData(db);
      return true;
    },

    // ==========================================
    // --- Comments ---
    // ==========================================
    findCommentsByPost: (postId) => {
      const db = readData();
      return db.comments.filter(c => c.postId === postId).map(c => {
        const author = db.users.find(u => u._id === c.authorId);
        return {
          ...c,
          authorId: author ? { _id: author._id, name: author.name, profileImage: author.profileImage } : null
        };
      });
    },

    findCommentById: (id) => {
      const db = readData();
      return db.comments.find(c => c._id === id);
    },

    createComment: (commentData) => {
      const db = readData();
      const newComment = {
        _id: 'comment_' + Date.now(),
        replies: [],
        ...commentData,
        createdAt: new Date().toISOString()
      };
      db.comments.push(newComment);
      
      // Increment comment count on post
      const postIdx = db.posts.findIndex(p => p._id === commentData.postId);
      if (postIdx !== -1) {
        db.posts[postIdx].commentsCount = (db.posts[postIdx].commentsCount || 0) + 1;
      }

      writeData(db);
      return newComment;
    },

    updateComment: (id, updateFields) => {
      const db = readData();
      const idx = db.comments.findIndex(c => c._id === id);
      if (idx !== -1) {
        db.comments[idx] = { ...db.comments[idx], ...updateFields };
        writeData(db);
        return db.comments[idx];
      }
      return null;
    },

    // ==========================================
    // --- Likes ---
    // ==========================================
    findLikes: (query = {}) => {
      const db = readData();
      return db.likes.filter(l => {
        let match = true;
        if (query.postId && l.postId !== query.postId) match = false;
        if (query.userId && l.userId !== query.userId) match = false;
        return match;
      });
    },

    createLike: (likeData) => {
      const db = readData();
      // Check if already liked
      const exists = db.likes.some(l => l.postId === likeData.postId && l.userId === likeData.userId);
      if (exists) return null;

      const newLike = {
        _id: 'like_' + Date.now(),
        ...likeData,
        createdAt: new Date().toISOString()
      };
      db.likes.push(newLike);

      // Increment likes on post
      const postIdx = db.posts.findIndex(p => p._id === likeData.postId);
      if (postIdx !== -1) {
        db.posts[postIdx].likesCount = (db.posts[postIdx].likesCount || 0) + 1;
      }

      writeData(db);
      return newLike;
    },

    deleteLike: (postId, userId) => {
      const db = readData();
      const initialLength = db.likes.length;
      db.likes = db.likes.filter(l => !(l.postId === postId && l.userId === userId));
      
      if (db.likes.length < initialLength) {
        // Decrement likes on post
        const postIdx = db.posts.findIndex(p => p._id === postId);
        if (postIdx !== -1) {
          db.posts[postIdx].likesCount = Math.max(0, (db.posts[postIdx].likesCount || 0) - 1);
        }
        writeData(db);
        return true;
      }
      return false;
    },

    // ==========================================
    // --- Followers ---
    // ==========================================
    findFollowers: (query = {}) => {
      const db = readData();
      return db.followers.filter(f => {
        let match = true;
        if (query.followerId && f.followerId !== query.followerId) match = false;
        if (query.followingId && f.followingId !== query.followingId) match = false;
        return match;
      });
    },

    createFollower: (followData) => {
      const db = readData();
      const exists = db.followers.some(f => f.followerId === followData.followerId && f.followingId === followData.followingId);
      if (exists) return null;

      const newFollow = {
        _id: 'follow_' + Date.now(),
        ...followData,
        createdAt: new Date().toISOString()
      };
      db.followers.push(newFollow);
      writeData(db);
      return newFollow;
    },

    deleteFollower: (followerId, followingId) => {
      const db = readData();
      const initialLength = db.followers.length;
      db.followers = db.followers.filter(f => !(f.followerId === followerId && f.followingId === followingId));
      if (db.followers.length < initialLength) {
        writeData(db);
        return true;
      }
      return false;
    },

    // ==========================================
    // --- Notifications ---
    // ==========================================
    findNotificationsByRecipient: (recipientId) => {
      const db = readData();
      return db.notifications.filter(n => n.recipientId === recipientId).map(n => {
        const sender = db.users.find(u => u._id === n.senderId);
        return {
          ...n,
          senderId: sender ? { _id: sender._id, name: sender.name, profileImage: sender.profileImage } : null
        };
      });
    },

    createNotification: (notifData) => {
      const db = readData();
      const newNotif = {
        _id: 'notif_' + Date.now(),
        isRead: false,
        ...notifData,
        createdAt: new Date().toISOString()
      };
      db.notifications.push(newNotif);
      writeData(db);
      return newNotif;
    },

    markNotificationRead: (id, recipientId) => {
      const db = readData();
      const idx = db.notifications.findIndex(n => n._id === id && n.recipientId === recipientId);
      if (idx !== -1) {
        db.notifications[idx].isRead = true;
        writeData(db);
        return db.notifications[idx];
      }
      return null;
    },

    markAllNotificationsRead: (recipientId) => {
      const db = readData();
      db.notifications.forEach(n => {
        if (n.recipientId === recipientId) n.isRead = true;
      });
      writeData(db);
      return true;
    },

    // ==========================================
    // --- Messages ---
    // ==========================================
    findMessages: (query = {}) => {
      const db = readData();
      return db.messages.filter(m => {
        if (query.senderId && query.recipientId) {
          return (m.senderId === query.senderId && m.recipientId === query.recipientId) ||
                 (m.senderId === query.recipientId && m.recipientId === query.senderId);
        }
        return true;
      }).map(m => {
        const sender = db.users.find(u => u._id === m.senderId);
        const recipient = db.users.find(u => u._id === m.recipientId);
        return {
          ...m,
          senderId: sender ? { _id: sender._id, name: sender.name, profileImage: sender.profileImage } : null,
          recipientId: recipient ? { _id: recipient._id, name: recipient.name, profileImage: recipient.profileImage } : null
        };
      });
    },

    createMessage: (msgData) => {
      const db = readData();
      const newMsg = {
        _id: 'msg_' + Date.now(),
        isRead: false,
        media: '',
        ...msgData,
        createdAt: new Date().toISOString()
      };
      db.messages.push(newMsg);
      writeData(db);
      return newMsg;
    },

    // ==========================================
    // --- Communities ---
    // ==========================================
    findCommunities: () => {
      const db = readData();
      return db.communities;
    },

    findCommunityById: (id) => {
      const db = readData();
      return db.communities.find(c => c._id === id);
    },

    createCommunity: (commData) => {
      const db = readData();
      const newComm = {
        _id: 'comm_' + Date.now(),
        members: [],
        coverImage: '',
        ...commData,
        createdAt: new Date().toISOString()
      };
      db.communities.push(newComm);
      writeData(db);
      return newComm;
    },

    joinCommunity: (id, userId) => {
      const db = readData();
      const idx = db.communities.findIndex(c => c._id === id);
      if (idx !== -1) {
        if (!db.communities[idx].members.includes(userId)) {
          db.communities[idx].members.push(userId);
          writeData(db);
        }
        return db.communities[idx];
      }
      return null;
    },

    leaveCommunity: (id, userId) => {
      const db = readData();
      const idx = db.communities.findIndex(c => c._id === id);
      if (idx !== -1) {
        db.communities[idx].members = db.communities[idx].members.filter(m => m !== userId);
        writeData(db);
        return db.communities[idx];
      }
      return null;
    },

    // ==========================================
    // --- Events ---
    // ==========================================
    findEvents: () => {
      const db = readData();
      return db.events;
    },

    findEventById: (id) => {
      const db = readData();
      return db.events.find(e => e._id === id);
    },

    createEvent: (eventData) => {
      const db = readData();
      const newEvent = {
        _id: 'event_' + Date.now(),
        attendees: [],
        ...eventData,
        createdAt: new Date().toISOString()
      };
      db.events.push(newEvent);
      writeData(db);
      return newEvent;
    },

    attendEvent: (id, userId) => {
      const db = readData();
      const idx = db.events.findIndex(e => e._id === id);
      if (idx !== -1) {
        if (!db.events[idx].attendees.includes(userId)) {
          db.events[idx].attendees.push(userId);
          writeData(db);
        }
        return db.events[idx];
      }
      return null;
    },

    // ==========================================
    // --- Bookmarks ---
    // ==========================================
    findBookmarks: (userId) => {
      const db = readData();
      return db.bookmarks.filter(b => b.userId === userId).map(b => {
        const post = b.postId ? db.posts.find(p => p._id === b.postId) : null;
        const project = b.projectId ? db.projects.find(p => p._id === b.projectId) : null;
        
        return {
          ...b,
          postId: post ? { _id: post._id, title: post.title, caption: post.caption } : null,
          projectId: project ? { _id: project._id, title: project.title, description: project.description } : null
        };
      });
    },

    createBookmark: (bookmarkData) => {
      const db = readData();
      // Check duplicate
      const exists = db.bookmarks.some(b => 
        b.userId === bookmarkData.userId && 
        ((bookmarkData.postId && b.postId === bookmarkData.postId) || 
         (bookmarkData.projectId && b.projectId === bookmarkData.projectId))
      );
      if (exists) return null;

      const newBookmark = {
        _id: 'bookmark_' + Date.now(),
        postId: null,
        projectId: null,
        ...bookmarkData,
        createdAt: new Date().toISOString()
      };
      db.bookmarks.push(newBookmark);
      writeData(db);
      return newBookmark;
    },

    deleteBookmark: (userId, itemId) => {
      const db = readData();
      const initialLength = db.bookmarks.length;
      db.bookmarks = db.bookmarks.filter(b => 
        !(b.userId === userId && (b.postId === itemId || b.projectId === itemId))
      );
      if (db.bookmarks.length < initialLength) {
        writeData(db);
        return true;
      }
      return false;
    }
  }
};
