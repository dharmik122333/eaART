import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Briefcase, Calendar, DollarSign, ArrowRight, Bookmark, 
  Share2, MapPin, Globe, Users, Send 
} from 'lucide-react';
import { getCategoryColor } from '../utils/categories';

const ProjectCard = ({ project }) => {
  const { user } = useAuth();
  const { 
    _id, title, description, budget, deadline, requiredSkills, 
    category, recruiterId, status, coverImage, companyLogo, 
    companyName, location, workType, openPositions, applicantsCount, savedBy 
  } = project;

  const [isSaved, setIsSaved] = useState(savedBy && user ? savedBy.includes(user.id) : false);
  const [saveLoading, setSaveLoading] = useState(false);

  const formattedDeadline = new Date(deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const handleSaveToggle = async (e) => {
    e.preventDefault();
    if (!user) return alert('Please log in to save projects');
    
    setSaveLoading(true);
    try {
      if (isSaved) {
        await api.delete(`/api/portfolios/bookmarks/${_id}`);
      } else {
        await api.post(`/api/portfolios/bookmarks`, { projectId: _id });
      }
      setIsSaved(!isSaved);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(`${window.location.origin}/project/${_id}`);
    alert('Project details link copied to clipboard!');
  };

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl overflow-hidden flex flex-col justify-between h-full border border-border relative">
      
      {/* 1. Project Cover Banner */}
      <div className="relative h-32 w-full bg-zinc-900">
        {coverImage ? (
          <img src={coverImage} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-purple-950/60 to-indigo-950/60" />
        )}
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border bg-black/60 backdrop-blur-md ${getCategoryColor(category)}`}>
            {category}
          </span>
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button 
            onClick={handleSaveToggle}
            disabled={saveLoading}
            className={`p-1.5 rounded-lg backdrop-blur-md transition ${
              isSaved ? 'bg-primary text-white' : 'bg-black/60 text-zinc-400 hover:text-white'
            }`}
            title="Save Project"
          >
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleShare}
            className="p-1.5 rounded-lg bg-black/60 text-zinc-400 hover:text-white backdrop-blur-md transition"
            title="Share Project"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Company Logo Overlapping Circle */}
      <div className="relative px-6">
        <div className="absolute -top-6 left-6 w-12 h-12 rounded-xl bg-zinc-950 border border-border overflow-hidden flex items-center justify-center font-bold text-sm shadow-md">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="w-full h-full object-cover" />
          ) : (
            (companyName || recruiterId?.organization || recruiterId?.name || 'C').charAt(0).toUpperCase()
          )}
        </div>
      </div>

      {/* 3. Card Body */}
      <div className="px-6 pt-8 flex-grow space-y-3.5">
        <div>
          <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
            {companyName || recruiterId?.organization || 'Independent Recruiter'}
          </span>
          <h3 className="text-base font-bold text-white tracking-tight hover:text-primary-glow transition duration-200 mt-0.5">
            <Link to={`/project/${_id}`}>{title}</Link>
          </h3>
        </div>

        {/* Dynamic metadata tags */}
        <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 font-mono">
          <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            <MapPin className="w-3 h-3 text-zinc-500" />
            {location || 'Remote'}
          </span>
          <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            <Globe className="w-3 h-3 text-zinc-500" />
            {workType || 'Remote'}
          </span>
          <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
            <Users className="w-3 h-3 text-zinc-500" />
            {openPositions || 1} positions
          </span>
        </div>

        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Required Skills */}
        <div className="flex flex-wrap gap-1">
          {requiredSkills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-300 font-medium">
              {skill}
            </span>
          ))}
          {requiredSkills.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900/60 border border-zinc-850/80 text-zinc-500">
              +{requiredSkills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* 4. Footer info */}
      <div className="px-6 pb-6 pt-4 border-t border-border/40 mt-5 flex items-center justify-between gap-4">
        <div>
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Budget</span>
          <div className="flex items-center text-xs font-semibold text-white font-mono mt-0.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>{budget.toLocaleString()}</span>
          </div>
        </div>

        <div>
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold block">Applicants</span>
          <div className="flex items-center text-xs font-medium text-zinc-300 gap-1 font-mono mt-0.5">
            <Users className="w-3.5 h-3.5 text-primary-glow" />
            <span>{applicantsCount || 0} applied</span>
          </div>
        </div>

        <Link 
          to={`/project/${_id}`} 
          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-primary/20 text-primary-glow hover:bg-primary hover:text-white rounded-lg text-xs font-semibold shadow-md transition"
        >
          <span>Details</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

    </div>
  );
};

export default ProjectCard;
