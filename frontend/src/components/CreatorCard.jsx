import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import { getCategoryColor } from '../utils/categories';

const CreatorCard = ({ creator }) => {
  const { _id, name, profileImage, bio, skills, category, availability, location } = creator;

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-6 border border-border flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        {/* Top Info Banner */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(category)}`}>
            {category || 'General'}
          </span>
          <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
            availability 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-zinc-800 text-zinc-500 border-zinc-700'
          }`}>
            {availability ? (
              <>
                <CheckCircle className="w-3 h-3" />
                <span>Open to Work</span>
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" />
                <span>Busy</span>
              </>
            )}
          </span>
        </div>

        {/* User Profile Header */}
        <div className="flex items-center gap-4 mb-4">
          {profileImage ? (
            <img 
              src={profileImage} 
              alt={name} 
              className="w-12 h-12 rounded-full border border-primary/30 object-cover" 
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 text-primary-glow flex items-center justify-center font-bold text-lg">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-base font-bold text-white tracking-tight hover:text-primary-glow transition duration-200">
              <Link to={`/creator/${_id}`}>{name}</Link>
            </h3>
            {location && (
              <span className="flex items-center gap-1 text-xs text-zinc-500">
                <MapPin className="w-3 h-3" />
                <span>{location}</span>
              </span>
            )}
          </div>
        </div>

        {/* Bio summary */}
        <p className="text-sm text-zinc-400 line-clamp-2 mb-6 h-10">
          {bio || 'Creative professional on Project EARTH. Ready to collaborate.'}
        </p>

        {/* Skills List */}
        <div className="flex flex-wrap gap-1 mb-6">
          {skills.slice(0, 3).map((skill, idx) => (
            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-zinc-900 border border-zinc-850 text-zinc-300">
              {skill}
            </span>
          ))}
          {skills.length > 3 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-900/50 text-zinc-500 border border-zinc-850/50">
              +{skills.length - 3} more
            </span>
          )}
        </div>
      </div>

      {/* Button to profile */}
      <Link 
        to={`/creator/${_id}`} 
        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-zinc-800 hover:bg-primary hover:shadow-lg hover:shadow-primary/20 text-sm font-medium text-white transition-all duration-200"
      >
        <span>View Portfolio</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};

export default CreatorCard;
