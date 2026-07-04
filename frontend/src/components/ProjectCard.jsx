import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { getCategoryColor } from '../utils/categories';

const ProjectCard = ({ project }) => {
  const { _id, title, description, budget, deadline, requiredSkills, category, recruiterId, status } = project;

  const formattedDeadline = new Date(deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="glass-panel glass-panel-hover rounded-xl p-6 flex flex-col justify-between h-full border border-border relative overflow-hidden">
      {/* Top Banner Status Info */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${getCategoryColor(category)}`}>
          {category}
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
          status === 'open' 
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
        }`}>
          {status}
        </span>
      </div>

      <div className="flex-grow">
        <h3 className="text-lg font-bold text-white tracking-tight mb-2 hover:text-primary-glow transition duration-200">
          <Link to={`/project/${_id}`}>{title}</Link>
        </h3>
        
        {recruiterId && (
          <p className="text-xs text-zinc-500 mb-4">
            Posted by <span className="text-zinc-300 font-medium">{recruiterId.name}</span>
            {recruiterId.organization && ` at ${recruiterId.organization}`}
          </p>
        )}

        <p className="text-sm text-zinc-400 line-clamp-3 mb-6">
          {description}
        </p>

        {/* Required Skills Badges */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {requiredSkills.slice(0, 4).map((skill, idx) => (
            <span key={idx} className="text-xs px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium">
              {skill}
            </span>
          ))}
          {requiredSkills.length > 4 && (
            <span className="text-xs px-2.5 py-1 rounded bg-zinc-900/60 border border-zinc-800/80 text-zinc-500 font-medium">
              +{requiredSkills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Details */}
      <div className="border-t border-border/60 pt-4 mt-auto flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Budget</span>
          <div className="flex items-center text-sm font-semibold text-white font-mono">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>{budget.toLocaleString()}</span>
          </div>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Deadline</span>
          <div className="flex items-center text-sm font-medium text-zinc-300 gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5 text-primary-glow" />
            <span>{formattedDeadline}</span>
          </div>
        </div>

        <Link 
          to={`/project/${_id}`} 
          className="flex items-center justify-center p-2 rounded-lg bg-primary/10 text-primary-glow hover:bg-primary hover:text-white transition-all duration-200"
          title="View Details"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

export default ProjectCard;
