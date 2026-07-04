import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CREATOR_CATEGORIES } from '../utils/categories';
import { User, Mail, KeyRound, MapPin, Building, AlertTriangle, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Creator',
    category: '',
    skills: '',
    location: '',
    organization: ''
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleRoleSelect = (role) => {
    setFormData({
      ...formData,
      role,
      category: '',
      skills: '',
      organization: ''
    });
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, role } = formData;

    if (!name || !email || !password) {
      return setLocalError('Please fill in name, email, and password.');
    }

    if (role === 'Creator' && !formData.category) {
      return setLocalError('Please select a creator category.');
    }

    setLoading(true);
    setLocalError('');

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setLocalError(err.message || 'Registration failed. Try using a different email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel max-w-lg w-full space-y-8 p-8 rounded-2xl border border-border shadow-[0_10px_50px_rgba(124,58,237,0.15)] relative overflow-hidden">
        
        {/* Glow overlay */}
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-primary-glow/10 rounded-full filter blur-[40px] pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Create Account
          </h2>
          <p className="text-xs text-zinc-400">
            Join Project EARTH talent ecosystem
          </p>
        </div>

        {/* Error panel */}
        {localError && (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-shake">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
          {/* Role selector buttons */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-300">Choose your role</span>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleSelect('Creator')}
                className={`py-3 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                  formData.role === 'Creator'
                    ? 'bg-primary/20 text-primary-glow border-primary shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                    : 'bg-zinc-950 text-zinc-400 border-border hover:border-zinc-800'
                }`}
              >
                Creator / Freelancer
              </button>
              <button
                type="button"
                onClick={() => handleRoleSelect('Recruiter')}
                className={`py-3 rounded-lg border text-sm font-semibold transition-all duration-200 ${
                  formData.role === 'Recruiter'
                    ? 'bg-primary/20 text-primary-glow border-primary shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                    : 'bg-zinc-950 text-zinc-400 border-border hover:border-zinc-800'
                }`}
              >
                Recruiter / Business
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Name input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-xs font-semibold text-zinc-300">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  placeholder="John Doe"
                />
              </div>
            </div>

            {/* Email input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-zinc-300">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  placeholder="john@example.com"
                />
              </div>
            </div>

            {/* Password input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-zinc-300">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  placeholder="•••••••• (Min 6 characters)"
                />
              </div>
            </div>

            {/* Location input */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="location" className="text-xs font-semibold text-zinc-300">
                Location (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  id="location"
                  name="location"
                  type="text"
                  value={formData.location}
                  onChange={handleChange}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                  placeholder="San Francisco, CA"
                />
              </div>
            </div>

            {/* Contextual fields for Creator */}
            {formData.role === 'Creator' && (
              <>
                {/* Category select */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="category" className="text-xs font-semibold text-zinc-300">
                    Primary Creative Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={formData.category}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary text-sm text-zinc-300 focus:outline-none transition"
                  >
                    <option value="">Select a Category</option>
                    {CREATOR_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Skills inputs */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="skills" className="text-xs font-semibold text-zinc-300">
                    Skill Tags (Comma-separated)
                  </label>
                  <input
                    id="skills"
                    name="skills"
                    type="text"
                    value={formData.skills}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                    placeholder="React, Blender, UI/UX, Photography"
                  />
                </div>
              </>
            )}

            {/* Contextual fields for Recruiter */}
            {formData.role === 'Recruiter' && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="organization" className="text-xs font-semibold text-zinc-300">
                  Organization / Company Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <Building className="w-4 h-4" />
                  </div>
                  <input
                    id="organization"
                    name="organization"
                    type="text"
                    required
                    value={formData.organization}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition"
                    placeholder="Zenith Creative Agency"
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Registering...' : 'Register'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center text-xs text-zinc-400 mt-6 relative z-10">
          <span>Already registered? </span>
          <Link to="/login" className="text-primary-glow font-semibold hover:underline transition">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
