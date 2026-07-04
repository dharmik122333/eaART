import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { CREATOR_CATEGORIES } from '../utils/categories';
import { User, MapPin, Building, Sparkles, UploadCloud, AlertCircle, CheckCircle } from 'lucide-react';

const Settings = () => {
  const { user, updateProfile, uploadProfileImage } = useAuth();

  // Settings form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    location: user?.location || '',
    organization: user?.organization || '',
    category: user?.category || '',
    skills: user?.skills?.join(', ') || ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Image Upload state
  const [imageFile, setImageFile] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgSuccess, setImgSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        location: formData.location,
        organization: formData.organization,
        category: formData.category,
        skills: formData.skills
      });
      setSuccessMsg('Your profile has been updated successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update profile settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e) => {
    setImageFile(e.target.files[0]);
    setImgSuccess(false);
    setErrorMsg('');
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return;

    setImgLoading(true);
    setErrorMsg('');
    setImgSuccess(false);

    try {
      const data = new FormData();
      data.append('image', imageFile);

      await uploadProfileImage(data);
      setImgSuccess(true);
      setImageFile(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload profile image.');
    } finally {
      setImgLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Page Header */}
      <div>
        <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
          Account Settings
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-1">
          Profile Settings
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Customize your public portfolio page, availability tags, and personal bio description.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
          <CheckCircle className="w-5 h-5" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-4 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          <AlertCircle className="w-5 h-5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar Update Panel */}
        <div className="glass-panel p-6 rounded-2xl border border-border h-fit space-y-6">
          <h3 className="text-base font-bold text-white tracking-tight border-b border-border/40 pb-3">
            Profile Image
          </h3>

          <div className="flex flex-col items-center text-center space-y-4">
            {user?.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.name} 
                className="w-24 h-24 rounded-full border-2 border-primary/50 object-cover" 
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary/45 text-primary-glow flex items-center justify-center font-bold text-3xl">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold text-white">{user?.name}</h4>
              <span className="text-xs text-zinc-500 font-mono">{user?.role}</span>
            </div>

            <form onSubmit={handleImageUpload} className="w-full space-y-3">
              <input 
                type="file" 
                accept="image/*"
                onChange={handleImageFileChange}
                className="block w-full text-xs text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-zinc-800 file:text-white file:text-xs focus:outline-none cursor-pointer"
              />

              {imageFile && (
                <button
                  type="submit"
                  disabled={imgLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-lg"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{imgLoading ? 'Uploading...' : 'Save Avatar'}</span>
                </button>
              )}
            </form>

            {imgSuccess && (
              <span className="text-xs text-emerald-400 font-medium">Avatar updated successfully!</span>
            )}
          </div>
        </div>

        {/* Right Columns: Info Form Details */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-2xl border border-border">
          <h3 className="text-base font-bold text-white tracking-tight border-b border-border/40 pb-3 mb-6">
            Personal Roster Info
          </h3>

          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Full Name</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Location</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                    placeholder="City, Country"
                  />
                </div>
              </div>
            </div>

            {/* Role Contextual Fields: Creator */}
            {user?.role === 'Creator' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                
                {/* Creator Category */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Creative Domain Category</label>
                  <select
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-sm text-zinc-300 focus:outline-none focus:border-primary"
                  >
                    {CREATOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills tags */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Skills Tags (Comma-separated)</label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                    placeholder="React, Game Design, UI/UX"
                  />
                </div>
              </div>
            )}

            {/* Role Contextual Fields: Recruiter */}
            {user?.role === 'Recruiter' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Company / Organization</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                    <Building className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full pl-10 pr-3 py-2 bg-zinc-950 border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary"
                    placeholder="My Creative Agency"
                  />
                </div>
              </div>
            )}

            {/* Biography Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-300">Biography / Summary</label>
              <textarea
                name="bio"
                rows="4"
                value={formData.bio}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-sm text-white focus:outline-none focus:border-primary leading-relaxed"
                placeholder="Share information about your creative journey, background projects, work experience..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Saving details...' : 'Save Profile Details'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
