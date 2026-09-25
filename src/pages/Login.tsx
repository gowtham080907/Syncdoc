import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Layers, ArrowRight, UserPlus, Sparkles, User, Lock, AlertCircle, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '../components/common/Button';
import { EditorRole } from '../types/user';

const ROLES: EditorRole[] = [
  'Lead Technical Writer',
  'Frontend Engineer',
  'AST Architect',
  'Backend Engineer',
  'Reviewer',
];

const ACCENT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e'];

export const Login: React.FC = () => {
  const { editors, login, loginWithCredentials, registerUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'signin' | 'register' | 'demo'>('signin');
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sign In state
  const [signInUserId, setSignInUserId] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInError, setSignInError] = useState<string | null>(null);
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<EditorRole>('Frontend Engineer');
  const [regColor, setRegColor] = useState('#3b82f6');
  const [regAvatar, setRegAvatar] = useState('');
  const [regError, setRegError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError(null);

    if (!signInUserId.trim() || !signInPassword) {
      setSignInError('Please enter your Email Address and Password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await loginWithCredentials(signInUserId, signInPassword);
      if (result.success) {
        navigate('/');
      } else {
        setSignInError(result.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      setSignInError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setRegError('Please fill in all required fields.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 8) {
      setRegError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regRole,
        color: regColor,
        avatar: regAvatar,
      });

      if (result.success) {
        navigate('/');
      } else {
        setRegError(result.message || 'Registration failed.');
      }
    } catch (err: any) {
      setRegError(err.message || 'Unable to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSelect = (userId: string) => {
    login(userId);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 font-sans selection:bg-brand-500 selection:text-white">
      {/* Ambient Background Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Top Header */}
      <div className="relative z-10 max-w-6xl mx-auto w-full flex items-center justify-between py-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5 font-bold text-xl text-white">
          <div className="p-2 bg-gradient-to-tr from-brand-600 to-indigo-500 rounded-xl text-white shadow-lg">
            <Layers className="w-5 h-5" />
          </div>
          <span className="bg-gradient-to-r from-white via-slate-200 to-brand-300 bg-clip-text text-transparent">
            SyncDoc
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Backend JWT Authentication Active</span>
        </div>
      </div>

      {/* Center Auth Card Container */}
      <div className="relative z-10 max-w-md mx-auto w-full py-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/10 text-brand-300 border border-brand-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Collaborative Document Platform
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {activeTab === 'signin'
              ? 'Sign In to Your Account'
              : activeTab === 'register'
              ? 'Register Editor Account'
              : 'Select Quick Demo Persona'}
          </h1>
          <p className="text-xs text-slate-400">
            {activeTab === 'signin'
              ? 'Enter your Email Address and Password to edit technical documents.'
              : activeTab === 'register'
              ? 'Create a new editor profile to collaborate in real-time.'
              : 'Pick a pre-configured editor persona to test live multi-user features.'}
          </p>
        </div>

        {/* Tab Switcher Bar */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('signin');
              setSignInError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'signin'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setRegError(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'register'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'demo'
                ? 'bg-brand-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Demo Switcher
          </button>
        </div>

        {/* Tab 1: SIGN IN FORM */}
        {activeTab === 'signin' && (
          <form onSubmit={handleSignIn} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            {signInError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{signInError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  disabled={isSubmitting}
                  value={signInUserId}
                  onChange={(e) => setSignInUserId(e.target.value)}
                  placeholder="e.g. sree@syncdoc.io"
                  className="w-full bg-slate-950 text-sm text-slate-100 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-800 focus:border-brand-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showSignInPassword ? 'text' : 'password'}
                  required
                  disabled={isSubmitting}
                  value={signInPassword}
                  onChange={(e) => setSignInPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full bg-slate-950 text-sm text-slate-100 pl-10 pr-10 py-2.5 rounded-xl border border-slate-800 focus:border-brand-500 outline-none transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowSignInPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={isSubmitting}
              className="w-full shadow-lg mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Logging in...</span>
                </>
              ) : (
                'Sign In to SyncDoc'
              )}
            </Button>
          </form>
        )}

        {/* Tab 2: REGISTER FORM */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            {regError && (
              <div className="flex items-center gap-2 p-3 bg-red-950/80 border border-red-500/40 rounded-xl text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{regError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Full Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                disabled={isSubmitting}
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Jordan Smith"
                className="w-full bg-slate-950 text-xs text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                disabled={isSubmitting}
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="jordan@syncdoc.io"
                className="w-full bg-slate-950 text-xs text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors disabled:opacity-50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full bg-slate-950 text-xs text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  required
                  disabled={isSubmitting}
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-slate-950 text-xs text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors disabled:opacity-50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Team Role
                </label>
                <select
                  disabled={isSubmitting}
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as EditorRole)}
                  className="w-full bg-slate-950 text-xs text-slate-100 px-3 py-2 rounded-lg border border-slate-800 focus:border-brand-500 outline-none transition-colors disabled:opacity-50"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-1.5 py-1">
                  {ACCENT_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      disabled={isSubmitting}
                      onClick={() => setRegColor(c)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        regColor === c ? 'scale-125 border-white ring-2 ring-brand-500' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              type="submit"
              disabled={isSubmitting}
              icon={!isSubmitting ? <UserPlus className="w-4 h-4" /> : undefined}
              className="w-full shadow-lg mt-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account & Start Editing'
              )}
            </Button>
          </form>
        )}

        {/* Tab 3: DEMO SWITCHER */}
        {activeTab === 'demo' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="text-xs text-slate-400 mb-2">
              Click any editor persona to log in instantly for testing live multi-user editing:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editors.map((editor) => (
                <button
                  type="button"
                  key={editor.id}
                  onClick={() => handleDemoSelect(editor.id)}
                  className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 hover:border-brand-500/60 rounded-xl text-left transition-all hover:-translate-y-0.5 group"
                >
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center text-white font-bold text-xs ring-1 ring-slate-700 group-hover:ring-brand-500 shrink-0"
                    style={{ backgroundColor: editor.color }}
                  >
                    {editor.avatar ? (
                      <img src={editor.avatar} alt={editor.name} className="w-full h-full object-cover" />
                    ) : (
                      editor.name.charAt(0).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 group-hover:text-brand-300 truncate">
                      {editor.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      ID: <code className="text-brand-400">{editor.id}</code> &bull; {editor.role}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-brand-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative z-10 text-center py-4 border-t border-slate-900 text-xs text-slate-400">
        SyncDoc Collaborative Engine &bull; Built with Yjs, React & AST Node Architecture
      </div>
    </div>
  );
};

export default Login;
