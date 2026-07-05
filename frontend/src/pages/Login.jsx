import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, AlertTriangle, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [otpRequired, setOtpRequired] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setLocalError('');
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return setLocalError('Please fill in all fields.');
    }

    setLoading(true);
    setLocalError('');

    try {
      const res = await login(formData.email, formData.password);
      if (res && res.otpRequired) {
        setOtpRequired(true);
      } else {
        navigate('/feed');
      }
    } catch (err) {
      setLocalError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      return setLocalError('Please enter a valid 6-digit verification code.');
    }

    setLoading(true);
    setLocalError('');

    try {
      await verifyOtp(formData.email, otp);
      navigate('/feed');
    } catch (err) {
      setLocalError(err.message || 'Verification failed. Please check the code and try again.');
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
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-display">
            {otpRequired ? 'Verify Code' : 'Welcome Back'}
          </h2>
          <p className="text-xs text-zinc-400">
            {otpRequired 
              ? `Enter the 6-digit OTP code sent to ${formData.email}` 
              : 'Sign in to access your Project EARTH portal'}
          </p>
        </div>

        {/* Error Dialog */}
        {localError && (
          <div className="flex items-center gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium animate-shake">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {otpRequired ? (
          <form className="mt-8 space-y-6 relative z-10" onSubmit={handleOtpSubmit}>
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="otp" className="text-xs font-semibold text-zinc-300">
                  One-Time Password (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    value={otp}
                    onChange={handleOtpChange}
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 text-center tracking-widest font-mono text-lg focus:outline-none transition duration-200"
                    placeholder="123456"
                    maxLength={6}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => { setOtpRequired(false); setOtp(''); setLocalError(''); }}
                className="w-full text-center text-xs text-zinc-500 hover:text-white transition py-1"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        ) : (
          <form className="mt-8 space-y-6 relative z-10" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Email Input */}
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
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition duration-200"
                    placeholder="name@domain.com"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="text-xs font-semibold text-zinc-300">
                    Password
                  </label>
                </div>
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
                    className="block w-full pl-10 pr-3 py-2.5 rounded-lg bg-zinc-950 border border-border focus:border-primary focus:ring-1 focus:ring-primary text-sm text-white placeholder-zinc-500 focus:outline-none transition duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg hover:shadow-primary/30 transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span>{loading ? 'Signing in...' : 'Sign In'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-zinc-400 mt-6 relative z-10">
          <span>New to the platform? </span>
          <Link to="/register" className="text-primary-glow font-semibold hover:underline transition">
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
