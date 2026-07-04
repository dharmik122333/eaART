export const CREATOR_CATEGORIES = [
  'Arts & Design',
  'Film & Entertainment',
  'Gaming',
  'Music & Audio',
  'Technology',
  'Photography',
  'Fashion & Beauty',
  'Events',
  'Writing',
  'Architecture',
  'Innovation'
];

export const getCategoryColor = (category) => {
  const colors = {
    'Arts & Design': 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    'Film & Entertainment': 'text-red-400 bg-red-500/10 border-red-500/20',
    'Gaming': 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    'Music & Audio': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    'Technology': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    'Photography': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    'Fashion & Beauty': 'text-teal-400 bg-teal-500/10 border-teal-500/20',
    'Events': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    'Writing': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    'Architecture': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    'Innovation': 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/20',
  };
  return colors[category] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
};
