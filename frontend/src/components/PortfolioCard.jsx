import React from 'react';
import { Play, Trash2, ExternalLink } from 'lucide-react';

const PortfolioCard = ({ item, onDelete, isOwner }) => {
  const { _id, title, description, mediaURL, mediaType } = item;

  return (
    <div className="glass-panel group rounded-xl overflow-hidden border border-border flex flex-col h-full relative">
      {/* Media Content */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
        {mediaType === 'video' ? (
          <div className="relative w-full h-full group/video">
            <video 
              src={mediaURL} 
              className="w-full h-full object-cover" 
              preload="metadata"
              controls={false}
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center group-hover/video:bg-black/20 transition-all duration-200">
              <div className="w-12 h-12 rounded-full bg-primary/80 border border-primary-glow/50 text-white flex items-center justify-center shadow-lg group-hover/video:scale-110 transition-transform">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
          </div>
        ) : (
          <img 
            src={mediaURL} 
            alt={title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        )}

        {/* Top Actions overlay */}
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <a 
            href={mediaURL} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-border"
            title="Open original"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          {isOwner && onDelete && (
            <button 
              onClick={() => onDelete(_id)}
              className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-400 hover:text-red-300 border border-red-900/50"
              title="Delete Item"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Description Panel */}
      <div className="p-4 flex-grow flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1 mb-1">
            {title}
          </h4>
          <p className="text-xs text-zinc-400 line-clamp-2">
            {description}
          </p>
        </div>
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
          <span>{mediaType.toUpperCase()}</span>
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};

export default PortfolioCard;
