import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return setError('Please enter your registered email address');
    
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      if (res.success) {
        setSuccess(true);
        // Automatically redirect to reset password screen in 3 seconds
        setTimeout(() => {
          navigate('/reset-password', { state: { email } });
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="glass-panel max-w-md w-full space-y-8 p-8 rounded-2xl border border-border shadow-[0_10px_50px_rgba(124,58,237,0.15)] relative overflow-hidden">
        
        {/* Background glow overlay */}
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-primary-glow/10 rounded-full filter blur-[40px] pointer-events-none" />

        <div className="text-center space-y-2 relative z-10">
          <KeyRound className="w-12 h-12 text-primary-glow mx-auto mb-2 animate-pulse" />
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Recover Access
          </h2>
          <p className="text-xs text-zinc-400 max-w-xs mx-auto">
            Provide your email address to receive your 8-digit verification code.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium text-center animate-shake">
            {error}
          </div>
        )}

        {success ? (
          <div className="p-5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium text-center flex flex-col items-center gap-3 relative z-10">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <div>
              <p className="font-semibold text-sm">Code Dispatched!</p>
              <p className="text-[11px] text-zinc-400 mt-1">Redirecting you to the verification screen...</p>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
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
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition duration-200"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'Sending Code...' : 'Get Verification Code'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="text-center mt-6 relative z-10">
          <Link to="/login" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
