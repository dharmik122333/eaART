const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '../data');
const dbFile = path.join(dataDir, 'db.json');

// Ensure database file exists
const initDbFile = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(
      dbFile,
      JSON.stringify({ users: [], portfolios: [], projects: [], applications: [] }, null, 2)
    );
  }
};

const readData = () => {
  initDbFile();
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return { users: [], portfolios: [], projects: [], applications: [] };
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

// Initialize empty DB if not present
const currentData = readData();

module.exports = {
  isMongoConnected,
  
  // Custom database fallback helper actions
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

    createUser: (userData) => {
      const db = readData();
      const newUser = {
        _id: 'user_' + Date.now(),
        ...userData,
        createdAt: new Date().toISOString()
      };
      db.users.push(newUser);
      writeData(db);
      return newUser;
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
    }
  }
};
