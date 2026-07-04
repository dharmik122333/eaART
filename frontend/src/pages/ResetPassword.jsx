import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { KeyRound, Lock, ClipboardCheck, ArrowRight, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Prefill email if coming from forgot-password flow
  const initialEmail = location.state?.email || '';

  const [formData, setFormData] = useState({
    email: initialEmail,
    code: '',
    newPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, code, newPassword } = formData;
    if (!email || !code || !newPassword) {
      return setError('Please fill in all fields.');
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/reset-password', { email, code, newPassword });
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Verification failed. The code may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel max-w-md w-full space-y-8 p-8 rounded-2xl border border-border shadow-[0_10px_50px_rgba(124,58,237,0.15)] relative overflow-hidden">
        
        {/* Glow overlay */}
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-primary-glow/10 rounded-full filter blur-[40px] pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <Lock className="w-12 h-12 text-primary-glow mx-auto mb-2" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Set New Password
          </h2>
          <p className="text-xs text-zinc-400">
            Verify the 8-digit code received on your console log or mail.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center flex flex-col items-center gap-3 relative z-10 animate-bounce">
            <ClipboardCheck className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="font-semibold text-sm">Password Updated!</p>
              <p className="text-[11px] text-zinc-400 mt-1">Redirecting you to login screen...</p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-5 relative z-10" onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition duration-200"
                  placeholder="name@domain.com"
                />
              </div>

              {/* Reset Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">Verification Code</label>
                <input
                  name="code"
                  type="text"
                  required
                  value={formData.code}
                  onChange={handleChange}
                  className="block w-full px-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 font-mono tracking-widest text-center focus:outline-none transition duration-200"
                  placeholder="EX: ABCDEF12"
                />
              </div>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-300">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    name="newPassword"
                    type="password"
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Verifying...' : 'Reset Password'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="text-center mt-6 relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel and Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
