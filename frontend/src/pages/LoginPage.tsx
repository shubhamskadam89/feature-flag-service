import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loginApi } from '../api/auth';
import { AuthGraphic } from '../components/AuthGraphic';
import { ArrowLeft, KeyRound, Mail, AlertTriangle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(false);

    if (!email || !password) {
      setError('Please fill out all fields.');
      return;
    }

    try {
      setLoading(true);
      const res = await loginApi(email, password);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({
        id: res.data.userId,
        name: res.data.name,
        email: res.data.email
      }));
      if (res.data.organizationId) {
        localStorage.setItem('activeOrgId', res.data.organizationId);
      }
      // Redirect to landing or admin console dashboard (route /)
      navigate('/');
    } catch (err) {
      const error = err as { message?: string };
      setError(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col md:flex-row bg-[#fffdf6] text-[#131311] select-none font-display">
      
      {/* Back to Home Header button */}
      <Link 
        to="/" 
        className="absolute top-6 left-6 z-30 flex items-center gap-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#131311] hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
      </Link>

      {/* Left side: Editorial Cream login form */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col justify-center px-8 md:px-20 py-20 relative bg-[#fffdf6] bg-grid-light">
        <div className="max-w-md w-full mx-auto space-y-8 relative z-10">
          
          {/* Header titles */}
          <div className="space-y-2">
            <span className="font-mono text-[9px] font-bold text-emerald-800 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 inline-block">
              // SECURED CLIENT AREA
            </span>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-none">
              WELCOME<br />
              BACK.
            </h1>
            <p className="text-xs text-[#575755] font-medium leading-relaxed">
              Log in to manage flag keys, rules evaluate, environments, and view edge telemetry audit logs.
            </p>
          </div>

          {/* Validation Alert */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded p-4 flex items-start gap-2.5 text-xs font-mono">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email input */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-[#575755] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-[#131311]" /> Email Address
              </label>
              <input
                type="email"
                required
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/50 border-2 border-[#131311] rounded px-4 py-3 text-xs font-mono text-[#131311] focus:outline-none focus:bg-white"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-mono font-bold text-[#575755] uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-[#131311]" /> Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/50 border-2 border-[#131311] rounded px-4 py-3 text-xs font-mono text-[#131311] focus:outline-none focus:bg-white"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-[#131311] text-white hover:bg-black font-display font-black text-xs uppercase tracking-widest rounded transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD'}</span>
              <ArrowRight className="w-4 h-4 text-[#c6fd50]" />
            </button>

          </form>

          {/* Bottom text Link */}
          <div className="pt-4 border-t border-[#131311]/10 flex justify-between items-center text-xs font-mono relative">
            <span className="text-[#575755]">New to Flags.Dev?</span>
            <Link to="/register" className="font-bold underline hover:text-black">
              Create an account →
            </Link>
            
            {/* Handwritten note next to link */}
            <span className="font-handwritten text-base text-emerald-800 absolute -bottom-6 -left-2 rotate-[-3deg] hidden sm:inline-block">
              // Setup takes 30 seconds
            </span>
          </div>

        </div>
      </div>

      {/* Right side: Dark Charcoal edge maps animation */}
      <div className="hidden md:block w-1/2 min-h-screen border-l border-[#131311]/15">
        <AuthGraphic />
      </div>

    </div>
  );
};

export default LoginPage;
