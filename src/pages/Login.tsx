import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, UserPlus, Sparkles, Lock, Mail, User, AlertCircle, Eye, EyeOff, ShieldCheck, RefreshCw } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Login: React.FC = () => {
  const { editors, login, loginWithCredentials } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'demo'>('signin');
  const navigate = useNavigate();

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    if (!signInEmail.trim() || !signInPassword) {
      setSignInError('Please enter your Email or Username and Password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = loginWithCredentials(signInEmail, signInPassword);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setSignInError(result.message || 'Invalid credentials.');
      }
    } catch (err: any) {
      setSignInError(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSelect = (userId: string) => {
    login(userId);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <div className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2.5 font-extrabold text-xl text-slate-900">
          <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <span>
            Sync<span className="text-blue-600">Doc</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>AST CRDT Authentication Active</span>
        </div>
      </div>

      {/* Center Auth Card Container */}
      <div className="relative z-10 max-w-md mx-auto w-full py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-3.5 h-3.5" /> Real-time Collaborative Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
            {activeTab === 'signin' ? 'Sign In to SyncDoc' : 'Select Quick Demo User'}
          </h1>
          <p className="text-xs text-slate-600">
            {activeTab === 'signin'
              ? 'Enter your email address and password to access collaborative documents.'
              : 'Pick a pre-configured team persona to test multi-user editing.'}
          </p>
        </div>

        {/* Tab Switcher Bar */}
        <div className="flex items-center p-1 bg-slate-200/60 border border-slate-200 rounded-xl text-xs font-semibold">
          <button
            onClick={() => {
              setActiveTab('signin');
              setSignInError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'signin'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'demo'
                ? 'bg-white text-blue-700 shadow-sm font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Demo Team Switcher
          </button>
        </div>

        {/* Tab 1: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-4">
            {signInError && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{signInError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  placeholder="sujitha@example.com or sujitha"
                  className="w-full bg-slate-50 text-sm text-slate-900 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Password reset is managed by Team Member 4 (Database & Auth team).'); }} className="text-[11px] font-semibold text-blue-600 hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 text-sm text-slate-900 pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-blue-600 focus:bg-white outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <div className="text-center pt-2">
              <span className="text-xs text-slate-600">Don't have an account? </span>
              <Link to="/register" className="text-xs font-bold text-blue-600 hover:underline">
                Create Account
              </Link>
            </div>
          </form>
        )}

        {/* Tab 2: DEMO TEAM SWITCHER */}
        {activeTab === 'demo' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md space-y-3">
            <div className="text-xs text-slate-500 mb-2">
              Select an active team member to instantly log in:
            </div>
            <div className="space-y-2">
              {editors.map((editor) => (
                <button
                  key={editor.id}
                  onClick={() => handleDemoSelect(editor.id)}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-xl text-left transition-all hover:bg-blue-50/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs ring-2 ring-white shadow-sm shrink-0"
                      style={{ backgroundColor: editor.color || '#3b82f6' }}
                    >
                      {editor.avatar ? (
                        <img src={editor.avatar} alt={editor.name} className="w-full h-full object-cover" />
                      ) : (
                        editor.name.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                        {editor.name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {editor.email} &bull; <span className="font-semibold text-blue-600">{editor.role}</span>
                      </div>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4 border-t border-slate-200 text-xs text-slate-500">
        SyncDoc Collaborative Engine &bull; Frontend Architecture & Editor Layer
      </div>
    </div>
  );
};

export default Login;
