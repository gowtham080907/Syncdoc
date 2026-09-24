import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layers, Users, FileCode2, Cpu, GitMerge, ArrowRight, Sparkles, Code2 } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Public Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <Link to="/" className="flex items-center gap-2.5 font-bold text-xl text-white">
          <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/30">
            <Layers className="w-5 h-5" />
          </div>
          <span className="font-black tracking-tight text-white text-xl">
            Sync<span className="text-indigo-400">Doc</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Sign In
          </Link>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/register')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-bold text-xs rounded-xl"
          >
            Start Collaborating
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold mb-8 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Real-Time AST Conflict Resolution Engine</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl leading-tight">
          SYNC DOC
          <span className="block text-indigo-600 mt-2">Collaborate. Edit. Sync.</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl font-normal leading-relaxed">
          A real-time collaborative document platform designed for structured and conflict-aware editing.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/register')}
            icon={<ArrowRight className="w-5 h-5" />}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-600/25"
          >
            Start Collaborating
          </Button>

          <a
            href="#features"
            className="px-6 py-3.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-xs"
          >
            Explore Features
          </a>
        </div>

        {/* Visual Editor Preview Mockup */}
        <div className="mt-14 w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden text-left">
          {/* Mock Browser Titlebar */}
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 text-xs font-semibold text-slate-400">syncdoc.app / documents / doc-arch-spec</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live (4 Collaborators)
              </span>
            </div>
          </div>

          {/* Mock Document Content Area */}
          <div className="p-8 sm:p-12 space-y-6 font-sans">
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                SyncDoc AST & CRDT Architecture Specification
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-medium">
                <span>Updated 2 minutes ago</span>
                <span>•</span>
                <span>Block ID: #blk-001</span>
              </div>
            </div>

            {/* Paragraph Block with Remote Cursor */}
            <div className="relative p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 shadow-xs">
              <div className="absolute -top-3 left-4 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <span>Sujitha (You) editing</span>
              </div>
              <p className="text-slate-900 text-sm leading-relaxed font-medium">
                SyncDoc separates standard character-level CRDT text synchronization from structural AST node modifications.
                Incoming operations update individual block nodes without rebuilding the document tree.
              </p>
            </div>

            {/* Code Block with Remote Cursor */}
            <div className="relative p-4 rounded-xl border border-slate-800 bg-slate-900 text-slate-100 font-mono text-xs shadow-md">
              <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                🟢 Sree is editing block #blk-code-02
              </div>
              <div className="text-slate-400 mb-2 font-bold">// astNodeToBlock transformation interface</div>
              <pre className="text-emerald-400">
{`interface ASTNode {
  id: "node-ast-104",
  type: "paragraph",
  content: "CRDT tree state synchronized with 14ms latency",
  children: []
}`}
              </pre>
            </div>

            {/* Conflict Banner Preview */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex flex-wrap items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-200 text-amber-900 rounded-lg font-bold text-xs">
                  AST CONFLICT
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Concurrent Block Mutation Detected</h4>
                  <p className="text-xs text-amber-800 font-medium">AST Engine identified structural diff in #blk-code-02</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs">Review Conflict</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
              Engineered for Production Collaboration
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto text-sm sm:text-base">
              Built on Yjs CRDTs, WebSocket rooms, and AST conflict detection to give technical teams total editing safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">1. Real-Time Collaboration</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Multi-user CRDT document editing powered by Yjs. Typing is synchronized instantly without network delays.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-bold mb-4">
                <FileCode2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">2. Block-Based Editing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Documents are composed of stable blocks (Headings, Paragraphs, Code Blocks, Lists, Quotes) rather than raw text.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold mb-4">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">3. Structured Documents</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Every block maintains a stable unique ID and order, allowing delta-aware non-destructive React re-rendering.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-bold mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">4. Live Presence & Cursors</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                See collaborator avatars, active block highlights, and real-time remote cursors as team members edit.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center font-bold mb-4">
                <GitMerge className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">5. Conflict-Aware Editing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Never lose local input when concurrent updates occur. Local state, focus, and selection remain intact.
              </p>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center font-bold mb-4">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">6. AST Integration</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Seamless AST adapter maps remote AST node changes directly to React blocks for structural diffing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Flowchart Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">How SyncDoc Architecture Works</h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            End-to-end data flow from user keystroke to AST conflict resolution
          </p>
        </div>

        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 min-w-[700px]">
            <div className="flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200 w-36 text-center">
              <span className="text-xs font-bold text-slate-500 uppercase">Step 1</span>
              <span className="text-sm font-extrabold text-slate-900 mt-1">User</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center p-4 bg-indigo-50 border border-indigo-200 rounded-xl w-36 text-center">
              <span className="text-xs font-bold text-indigo-600 uppercase">Step 2</span>
              <span className="text-sm font-extrabold text-indigo-900 mt-1">Block Editor</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center p-4 bg-blue-50 border border-blue-200 rounded-xl w-36 text-center">
              <span className="text-xs font-bold text-blue-600 uppercase">Step 3</span>
              <span className="text-sm font-extrabold text-blue-900 mt-1">Yjs / CRDT</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center p-4 bg-emerald-50 border border-emerald-200 rounded-xl w-36 text-center">
              <span className="text-xs font-bold text-emerald-600 uppercase">Step 4</span>
              <span className="text-sm font-extrabold text-emerald-900 mt-1">WebSocket</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center p-4 bg-amber-50 border border-amber-200 rounded-xl w-36 text-center">
              <span className="text-xs font-bold text-amber-600 uppercase">Step 5</span>
              <span className="text-sm font-extrabold text-amber-900 mt-1">AST Diff</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 rotate-90 md:rotate-0" />

            <div className="flex flex-col items-center p-4 bg-purple-50 border border-purple-200 rounded-xl w-36 text-center">
              <span className="text-xs font-bold text-purple-600 uppercase">Step 6</span>
              <span className="text-sm font-extrabold text-purple-900 mt-1">Conflict Resolution</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-900 text-slate-400 border-t border-slate-800 py-8 px-6 text-center text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-white">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>SyncDoc Collaborative Engine</span>
          </div>
          <p>© 2026 SyncDoc Team — Real-time Document Platform with AST Conflict Resolution.</p>
        </div>
      </footer>
    </div>
  );
};
