import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { CREATOR_CATEGORIES } from '../utils/categories';
import { 
  User, MapPin, Building, Sparkles, UploadCloud, AlertCircle, 
  CheckCircle, Lock, Shield, EyeOff, BellRing, Trash2, Ban 
} from 'lucide-react';

const Settings = () => {
  const { user, updateProfile, uploadProfileImage, logout } = useAuth();
  const navigate = useNavigate();

  // Settings form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    location: user?.location || '',
    organization: user?.organization || '',
    category: user?.category || '',
    skills: user?.skills?.join(', ') || '',
    coverBanner: user?.coverBanner || '',
    headline: user?.headline || '',
    industry: user?.industry || ''
  });

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Password fields
  const [passData, setPassData] = useState({ password: '', confirmPassword: '' });
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Image Upload state
  const [imageFile, setImageFile] = useState(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgSuccess, setImgSuccess] = useState(false);

  // Cover image upload
  const [coverFile, setCoverFile] = useState(null);
  const [coverLoading, setCoverLoading] = useState(false);
  const [coverSuccess, setCoverSuccess] = useState(false);

  // Mock Privacy/Notif settings
  const [privacy, setPrivacy] = useState({ publicSearch: true, showViews: true });
  const [notifOpts, setNotifOpts] = useState({ emailAlerts: true, messageAlerts: true });

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
        username: formData.username,
        bio: formData.bio,
        location: formData.location,
        organization: formData.organization,
        category: formData.category,
        skills: formData.skills,
        coverBanner: formData.coverBanner,
        headline: formData.headline,
        industry: formData.industry
      });
      setSuccessMsg('Your account profile was updated successfully!');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update settings.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassSuccess('');
    setPassError('');

    if (!passData.password) return setPassError('Please enter a password');
    if (passData.password !== passData.confirmPassword) {
      return setPassError('Passwords do not match');
    }

    try {
      await api.put('/api/users/profile', { password: passData.password });
      setPassSuccess('Password updated successfully!');
      setPassData({ password: '', confirmPassword: '' });
    } catch (err) {
      setPassError(err.message || 'Failed to update password.');
    }
  };

  const handleImageFileChange = (e) => {
    setImageFile(e.target.files[0]);
    setImgSuccess(false);
  };

  const handleImageUpload = async (e) => {
    e.preventDefault();
    if (!imageFile) return;

    setImgLoading(true);
    setImgSuccess(false);

    try {
      const data = new FormData();
      data.append('image', imageFile);
      await uploadProfileImage(data);
      setImgSuccess(true);
      setImageFile(null);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save profile picture.');
    } finally {
      setImgLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate your account? You will be hidden from searches.')) return;
    try {
      const res = await api.put('/api/users/deactivate');
      if (res.success) {
        logout();
        navigate('/');
      }
    } catch (err) {
      alert(err.message || 'Deactivation failed.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('CRITICAL WARNING: This will delete your account and all data forever. This cannot be undone. Continue?')) return;
    try {
      const res = await api.delete('/api/users/profile');
      if (res.success) {
        logout();
        navigate('/');
      }
    } catch (err) {
      alert(err.message || 'Account deletion failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 py-6">
      {/* Page Header */}
      <div>
        <span className="text-xs font-mono font-bold text-primary-glow uppercase tracking-wider">
          Account Workspace
        </span>
        <h2 className="text-3xl font-extrabold text-white mt-1">
          Profile Settings
        </h2>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your handles, authentication parameters, banners, notifications, and privacy options.
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
        
        {/* Left Column: Avatars and Cover Image Settings */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-border text-center space-y-6">
            <h3 className="text-sm font-bold text-white border-b border-border/40 pb-3 text-left">
              Visual Branding
            </h3>

            <div className="flex flex-col items-center space-y-4">
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
                <span className="text-[11px] text-zinc-500 font-mono">@{user?.username || 'no-handle'}</span>
              </div>

              <form onSubmit={handleImageUpload} className="w-full space-y-3">
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="block w-full text-[11px] text-zinc-400 file:mr-3 file:py-1 file:px-2.5 file:rounded file:border-0 file:bg-zinc-800 file:text-white file:text-xs cursor-pointer"
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
                <span className="text-xs text-emerald-400 font-medium">Avatar updated!</span>
              )}
            </div>
          </div>

          {/* Privacy & Notifications Settings */}
          <div className="glass-panel p-6 rounded-2xl border border-border space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-border/40 pb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary-glow" />
              <span>Privacy & Controls</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={privacy.publicSearch}
                  onChange={(e) => setPrivacy({ ...privacy, publicSearch: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-primary"
                />
                <span className="text-xs text-zinc-300">Public profile in search index</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={notifOpts.emailAlerts}
                  onChange={(e) => setNotifOpts({ ...notifOpts, emailAlerts: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-950 text-primary focus:ring-primary"
                />
                <span className="text-xs text-zinc-300">Email alerts on new projects</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Columns: Roster and Profile details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-8 rounded-2xl border border-border">
            <h3 className="text-base font-bold text-white tracking-tight border-b border-border/40 pb-3 mb-6">
              Creator Account Settings
            </h3>

            <form onSubmit={handleProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Unique Username handle */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Username Handle</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500 text-xs">@</span>
                    <input
                      type="text"
                      name="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full pl-7 pr-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary font-semibold"
                    />
                  </div>
                </div>

                {/* Headline */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Professional Headline</label>
                  <input
                    type="text"
                    name="headline"
                    value={formData.headline}
                    onChange={handleChange}
                    placeholder="e.g. Lead 3D Artist & Motion Designer"
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Location */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                    placeholder="City, Country"
                  />
                </div>

                {/* Industry */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Industry Sector</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    placeholder="e.g. Gaming / Film VFX"
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Cover Banner URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Cover Banner Image URL</label>
                  <input
                    type="text"
                    name="coverBanner"
                    value={formData.coverBanner}
                    onChange={handleChange}
                    placeholder="https://example.com/banner.png"
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Role Contextual Fields */}
              {user?.role === 'Creator' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Category Domain</label>
                    <select
                      name="category"
                      required
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-zinc-300 focus:outline-none focus:border-primary"
                    >
                      {CREATOR_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-zinc-300">Skills Tags (Comma-separated)</label>
                    <input
                      type="text"
                      name="skills"
                      value={formData.skills}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                      placeholder="React, Game Design, UI/UX"
                    />
                  </div>
                </div>
              )}

              {user?.role === 'Recruiter' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-300">Company / Organization</label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary"
                    placeholder="My Creative Agency"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Biography Summary</label>
                <textarea
                  name="bio"
                  rows="4"
                  value={formData.bio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none focus:border-primary resize-none"
                  placeholder="Share details about your professional creative background..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-semibold rounded-lg shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Saving details...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* Change Password Block */}
          <div className="glass-panel p-8 rounded-2xl border border-border space-y-6">
            <h3 className="text-base font-bold text-white border-b border-border/40 pb-3">
              Security Credentials
            </h3>

            {passSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded">
                {passSuccess}
              </div>
            )}

            {passError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded">
                {passError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">New Password</label>
                <input 
                  type="password"
                  value={passData.password}
                  onChange={(e) => setPassData({ ...passData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Confirm New Password</label>
                <input 
                  type="password"
                  value={passData.confirmPassword}
                  onChange={(e) => setPassData({ ...passData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 bg-zinc-950 border border-border rounded-lg text-xs text-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-lg border border-border transition"
              >
                Change Password
              </button>
            </form>
          </div>

          {/* Critical Danger Actions Zone */}
          <div className="glass-panel p-8 rounded-2xl border border-red-500/15 bg-red-500/[0.01] space-y-6">
            <h3 className="text-base font-bold text-red-400 border-b border-red-500/20 pb-3 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>Danger Zone</span>
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-950/40 border border-border rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1">
                  <Ban className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Deactivate Profile</span>
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Temporarily hide your profile cards and open job requests from other members.
                </p>
              </div>
              <button 
                onClick={handleDeactivate}
                className="px-4 py-2 border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-semibold rounded-lg transition"
              >
                Deactivate
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-zinc-950/40 border border-red-500/20 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-red-400 flex items-center gap-1">
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Permanently delete all your creative portfolios, projects, and messages forever.
                </p>
              </div>
              <button 
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold rounded-lg transition"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
