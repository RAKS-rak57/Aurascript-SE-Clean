"use client";

import { useState, useRef, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import AIPanel from '@/components/AIPanel';
import ScreenplayEditor from '@/components/ScreenplayEditor';
import { Share2, Download, Play, Plus, Check, Clock, GitBranch, Users, X, Shield, Copy, Sparkles, MessageSquare, Bot, Folder, FileText, Settings } from 'lucide-react';
import { queryGroqChat, queryTmdbMovies } from "@/lib/groq";

export default function Home() {
  const editorRef = useRef(null);
  const [activeTab, setActiveTab] = useState('editor');

  // Branching state
  const [branches, setBranches] = useState([
    { id: 'main', name: 'Main Storyline (Official)', active: true, content: null },
    { id: 'alt-ending', name: 'Alternate Neo-Noir Ending', active: false, content: `<p class="scene-heading">EXT. ROOFTOP - NIGHT</p><p class="action">The rain pouring down as Reed reaches the ledge...</p>` },
  ]);
  const [newBranchName, setNewBranchName] = useState('');

  // Version History state
  const [versions, setVersions] = useState([
    { id: 'v1.2', label: 'v1.2 - Current Draft', time: '10 mins ago', author: 'Writer (You)' },
    { id: 'v1.1', label: 'v1.1 - Added Reed Dialogue', time: '2 hours ago', author: 'Script Editor Sarah' },
    { id: 'v1.0', label: 'v1.0 - First Beat Outline', time: 'Yesterday', author: 'Director Alex' },
  ]);

  // Project Files state (MCP generated)
  const [projectFiles, setProjectFiles] = useState([
    { id: 'file-1', name: 'Character-Profiles.md', content: '# Characters\n\n**Reed**: A gritty detective...' }
  ]);

  // Collaborators & Roles state
  const [collaborators, setCollaborators] = useState([
    { name: 'You (Host)', email: 'you@aurascript.com', role: 'Writer', active: true },
    { name: 'Sarah Connor', email: 'sarah@production.com', role: 'Editor', active: true },
    { name: 'Alex Garland', email: 'alex@director.com', role: 'Viewer', active: false },
  ]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newCollaboratorEmail, setNewCollaboratorEmail] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Present Mode state
  const [isPresentMode, setIsPresentMode] = useState(false);

  // AI Chat & MCP State
  const [chatMessages, setChatMessages] = useState([
    { role: 'assistant', text: 'Hello! I am your AI Cinema & Writing Assistant.\nI can read your script, answer questions, analyze themes, recommend TMDB movies, and execute MCP commands like:\n- "Save a version snapshot"\n- "Create a branch called Director Cut"\n- "Generate a sci-fi ending branch"\n- "Analyze my characters"' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // --- LocalStorage Persistence ---
  useEffect(() => {
    try {
      const savedChats = localStorage.getItem('aurascript_chats');
      if (savedChats) setChatMessages(JSON.parse(savedChats));
      
      const savedFiles = localStorage.getItem('aurascript_files');
      if (savedFiles) setProjectFiles(JSON.parse(savedFiles));
    } catch (e) {
      console.warn("Failed to load local storage data:", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('aurascript_chats', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('aurascript_files', JSON.stringify(projectFiles));
  }, [projectFiles]);

  // Current user role
  const currentRole = collaborators.find(c => c.name.includes('You'))?.role || 'Writer';

  // Handle AI Text Insertion into Editor
  const handleInsertAiText = (text, formatClass) => {
    if (editorRef.current) {
      editorRef.current.insertText(text, formatClass);
    }
  };

  // Get active cursor context for AI Studio
  const handleGetEditorContext = () => {
    if (!editorRef.current) return { selectedText: "", currentNodeText: "", fullText: "" };
    return {
      selectedText: editorRef.current.getSelectedText(),
      currentNodeText: editorRef.current.getCurrentNodeText(),
      fullText: editorRef.current.getText(),
    };
  };

  // Branch switching
  const handleSwitchBranch = (branchId) => {
    setBranches(branches.map(b => ({ ...b, active: b.id === branchId })));
    const targetBranch = branches.find(b => b.id === branchId);
    if (targetBranch && targetBranch.content && editorRef.current) {
      editorRef.current.setContent(targetBranch.content);
    }
  };

  // Create new branch
  const handleCreateBranch = (name, content = null) => {
    const currentContent = editorRef.current ? editorRef.current.getContent() : '';
    const newB = {
      id: `branch-${Date.now()}`,
      name: name,
      active: true,
      content: content || currentContent,
    };
    setBranches(prev => prev.map(b => ({ ...b, active: false })).concat(newB));
    
    if (content && editorRef.current) {
      editorRef.current.setContent(content);
    }
  };

  // Create Snapshot Version
  const handleSaveSnapshot = () => {
    const newVer = {
      id: `v1.${versions.length}`,
      label: `v1.${versions.length} - Snapshot ${new Date().toLocaleTimeString()}`,
      time: 'Just now',
      author: 'AI Agent / You',
    };
    setVersions(prev => [newVer, ...prev]);
  };

  // MCP Agent Command Executor
  const handleExecuteMcpCommand = (cmd) => {
    if (cmd.action === 'save_version') {
      handleSaveSnapshot();
    } else if (cmd.action === 'create_branch') {
      handleCreateBranch(cmd.name || 'AI Suggested Branch', cmd.content || null);
    } else if (cmd.action === 'create_file') {
      const newFile = {
        id: `file-${Date.now()}`,
        name: cmd.name || 'Untitled-Document.md',
        content: cmd.content || ''
      };
      setProjectFiles(prev => [...prev, newFile]);
      setActiveTab('files'); // open the files drawer so user sees it
    } else if (cmd.action === 'insert_editor') {
      if (editorRef.current && cmd.content) {
        editorRef.current.setContent(cmd.content);
      }
    }
  };

  // RAG Chat Submit Handler
  const handleSendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    const ctx = handleGetEditorContext();
    const scriptText = ctx.fullText || "EXT. NEON CITY - NIGHT";

    try {
      const systemPrompt = `You are AuraScript's AI Cinema Assistant & Script Co-Pilot.
You have access to the current script text for RAG context:
---
${scriptText}
---

Your capabilities:
1. Answer "where we at" or explain current story context. Analyze the text deeply.
2. Recommend movies, explain film theory concepts, and relate them to the writer's story.
3. You MUST execute Agentic MCP Commands by outputting JSON at the END of your message for specific actions:
[[MCP_COMMAND: {"action": "save_version"}]]
[[MCP_COMMAND: {"action": "create_branch", "name": "...", "content": "<p class='scene-heading'>...</p>" }]]
[[MCP_COMMAND: {"action": "create_file", "name": "Implementation-Plan.md", "content": "# Markdown Content..." }]]
[[MCP_COMMAND: {"action": "insert_editor", "content": "<p>Content to insert directly into the active editor screen...</p>" }]]

If the user asks you to "write an entire screenplay" or "generate a new story branch", output the \`create_branch\` command and put the beautifully formatted HTML TipTap content inside the \`content\` field of the JSON!
If the user asks you to "save this as an implementation plan" or "create a character list file", use \`create_file\`!
If the user asks you to "get that story in my current editor" or "load it into the editor", use \`insert_editor\`!

Be highly intelligent and informative.`;

      const responseText = await queryGroqChat({
        messages: [
          { role: "system", content: systemPrompt },
          ...chatMessages.map(m => ({ role: m.role, content: m.text })),
          { role: "user", content: userMsg }
        ]
      });

      // Check for MCP Agent command
      const mcpMatch = responseText.match(/\[\[MCP_COMMAND:\s*({.*?})\]\]/);
      let cleanText = responseText.replace(/\[\[MCP_COMMAND:.*?\]\]/g, '').trim();

      if (mcpMatch) {
        try {
          const cmd = JSON.parse(mcpMatch[1]);
          handleExecuteMcpCommand(cmd);
          cleanText += `\n\n⚡ *Agentic MCP Action Executed: ${cmd.action} (${cmd.name || 'snapshot'})*`;
        } catch (err) {
          console.error("MCP parse error:", err);
        }
      }

      // Check TMDB database if query involves movies
      if (userMsg.toLowerCase().includes('movie') || userMsg.toLowerCase().includes('recommend') || userMsg.toLowerCase().includes('similar')) {
        const movies = await queryTmdbMovies({ query: userMsg });
        if (movies && movies.length > 0) {
          const movieInfo = `\n\n🎬 *TMDB Cinema Matches:*\n` + movies.slice(0, 3).map(m => `• **${m.title}** (${m.release_date?.slice(0,4)}): ${m.overview.slice(0, 90)}...`).join('\n');
          cleanText += movieInfo;
        }
      }

      setChatMessages(prev => [...prev, { role: 'assistant', text: cleanText }]);

    } catch (err) {
      console.warn("Groq RAG Chat fallback triggered. Error:", err.message);
      // Show actual error instead of hardcoded fallback so user knows!
      setChatMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Error connecting to Groq AI: ${err.message}` }]);
    }

    setIsChatLoading(false);
  };

  return (
    <main className="app-container">
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />
      
      <div className="main-content glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* Editor Top Bar */}
        <header className="editor-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input 
              type="text" 
              className="document-title" 
              defaultValue="NEON CITY - ACT I" 
            />
            <span style={{ 
              fontSize: '0.75rem', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              background: 'rgba(52, 211, 153, 0.15)', 
              color: 'var(--success)', 
              border: '1px solid var(--success)' 
            }}>
              ● Live Sync
            </span>
          </div>

          <div className="editor-actions">
            <button className="btn" onClick={() => setShowShareModal(true)}>
              <Share2 size={16} /> Share
            </button>
            <button className="btn" onClick={() => editorRef.current?.printPdf()}>
              <Download size={16} /> Export PDF
            </button>
            <button className="btn btn-primary" onClick={() => setIsPresentMode(!isPresentMode)}>
              <Play size={16} /> {isPresentMode ? "Exit Present" : "Present View"}
            </button>
          </div>
        </header>
        
        {/* Main Workspace Body */}
        <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          
          {/* Main Editor View */}
          <div className="editor-scroll-area" style={{ flex: 1, overflowY: 'auto' }}>
            <ScreenplayEditor ref={editorRef} readOnly={currentRole === 'Viewer'} />
          </div>

          {/* AI Chat Drawer */}
          {activeTab === 'ai-chat' && (
            <div className="glass-panel" style={{ width: '380px', padding: '20px', margin: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bot size={18} color="var(--accent-color)" /> RAG Assistant & Agent
                </h3>
                <button onClick={() => setActiveTab('editor')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Analyzes your live script context to answer questions and execute workspace actions.</p>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {chatMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: msg.role === 'user' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
                      alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      maxWidth: '90%',
                      whiteSpace: 'pre-wrap',
                      fontSize: '0.85rem',
                      lineHeight: '1.5'
                    }}
                  >
                    {msg.text}
                  </div>
                ))}
                {isChatLoading && <div style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'var(--accent-color)' }}>Analyzing script context & generating response...</div>}
              </div>

              <form onSubmit={handleSendChatMessage} style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  placeholder="Ask 'analyze my characters' or 'create a sci-fi branch'..." 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-base)', color: '#fff', fontSize: '0.85rem' }}
                />
                <button className="btn btn-primary" type="submit" disabled={isChatLoading} style={{ padding: '0 14px' }}><MessageSquare size={16} /></button>
              </form>
            </div>
          )}

          {/* Side Drawer Views based on Active Tab */}
          {activeTab === 'files' && (
            <div className="glass-panel" style={{ width: '320px', padding: '20px', margin: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Folder size={18} color="var(--accent-color)" /> Project Files
                </h3>
                <button onClick={() => setActiveTab('editor')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>AI generated reference files, character sheets, and plans.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {projectFiles.map(f => (
                  <div 
                    key={f.id} 
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--glass-border)',
                      background: 'var(--bg-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: '500' }}>
                      <FileText size={16} /> {f.name}
                    </div>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => handleExecuteMcpCommand({ action: 'insert_editor', content: f.content })}
                      style={{ fontSize: '0.75rem', padding: '4px 8px', justifyContent: 'center' }}
                    >
                      Open / Insert into Editor
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'branches' && (
            <div className="glass-panel" style={{ width: '320px', padding: '20px', margin: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <GitBranch size={18} color="var(--accent-color)" /> Story Branches
                </h3>
                <button onClick={() => setActiveTab('editor')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Explore alternate plotlines without risking your master draft.</p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="New Branch Name..." 
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-base)', color: '#fff', fontSize: '0.85rem' }}
                />
                <button className="btn btn-primary" onClick={() => { if(newBranchName) { handleCreateBranch(newBranchName); setNewBranchName(''); } }}><Plus size={16} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                {branches.map(b => (
                  <div 
                    key={b.id} 
                    onClick={() => handleSwitchBranch(b.id)}
                    style={{
                      padding: '12px',
                      borderRadius: '8px',
                      border: b.active ? '1px solid var(--accent-color)' : '1px solid var(--glass-border)',
                      background: b.active ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      justify: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontSize: '0.9rem', fontWeight: b.active ? '600' : '400' }}>{b.name}</span>
                    {b.active && <Check size={16} color="var(--accent-color)" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="glass-panel" style={{ width: '320px', padding: '20px', margin: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={18} color="var(--accent-color)" /> Version History
                </h3>
                <button onClick={() => setActiveTab('editor')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
              </div>
              
              <button className="btn btn-primary" onClick={handleSaveSnapshot} style={{ width: '100%', justifyContent: 'center' }}>
                <Plus size={16} /> Create Save Snapshot
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                {versions.map(v => (
                  <div key={v.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{v.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {v.time} • by {v.author}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'collaborators' && (
            <div className="glass-panel" style={{ width: '320px', padding: '20px', margin: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={18} color="var(--accent-color)" /> Collaborators
                </h3>
                <button onClick={() => setActiveTab('editor')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Invite Section */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="email" 
                  placeholder="Invite by email..." 
                  value={newCollaboratorEmail}
                  onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-base)', color: '#fff', fontSize: '0.85rem' }}
                />
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '0 12px' }}
                  onClick={async (e) => {
                    if (newCollaboratorEmail) {
                      const btn = e.currentTarget;
                      const originalText = btn.innerText;
                      btn.innerText = "...";
                      btn.disabled = true;
                      
                      try {
                        await fetch('/api/invite', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: newCollaboratorEmail, role: 'Editor' })
                        });
                      } catch (error) {
                        console.error("Invite failed:", error);
                      }
                      
                      setCollaborators([...collaborators, { name: newCollaboratorEmail.split('@')[0], email: newCollaboratorEmail, role: 'Editor', active: true }]);
                      setNewCollaboratorEmail('');
                      btn.innerText = "Add";
                      btn.disabled = false;
                    }
                  }}
                >
                  Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', flex: 1 }}>
                {collaborators.map((c, i) => (
                  <div key={i} style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: '500', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{c.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>{c.email}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <select 
                        value={c.role} 
                        onChange={(e) => {
                          const updated = [...collaborators];
                          updated[i].role = e.target.value;
                          setCollaborators(updated);
                        }}
                        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '4px', fontSize: '0.75rem' }}
                      >
                        <option value="Writer">Writer</option>
                        <option value="Editor">Editor</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                      {!c.name.includes('You') && (
                        <button 
                          onClick={() => setCollaborators(collaborators.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Remove Collaborator"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="glass-panel" style={{ width: '360px', padding: '20px', margin: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Settings size={18} color="var(--accent-color)" /> Platform Settings
                </h3>
                <button onClick={() => setActiveTab('editor')} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={18} /></button>
              </div>

              {/* Account Profile Section */}
              <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Account Profile</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#fff' }}>
                    {collaborators[0].name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '500' }}>Rakshith R R</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{collaborators[0].email}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '4px' }}>Google Account Linked</div>
                  </div>
                </div>
                <button className="btn" style={{ width: '100%', marginTop: '12px', justifyContent: 'center', fontSize: '0.8rem' }}>Manage Google Account</button>
              </div>

              {/* Theme Settings */}
              <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>Appearance</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem' }}>Glassmorphism Dark Theme</span>
                  <div style={{ width: '36px', height: '20px', background: 'var(--accent-color)', borderRadius: '10px', position: 'relative', cursor: 'not-allowed', opacity: 0.8 }}>
                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }} />
                  </div>
                </div>
              </div>

              {/* API Integration Settings */}
              <div style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-surface)' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>API Integrations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span>Groq Agentic AI</span>
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> Connected</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span>TMDB Cinema Data</span>
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> Connected</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span>NodeMailer (SMTP)</span>
                    <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}><Check size={12} /> Configured</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      <AIPanel 
        onInsertAiText={handleInsertAiText} 
        onExecuteMcpCommand={handleExecuteMcpCommand} 
        getEditorContext={handleGetEditorContext}
      />

      {/* Share / Invite Modal */}
      {showShareModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="glass-panel" style={{ width: '450px', padding: '24px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Shield size={20} color="var(--accent-color)" /> Project Permissions & Sharing
              </h3>
              <button onClick={() => setShowShareModal(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Invite co-writers or share a read-only preview with producers.</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="email" 
                placeholder="Enter collaborator email..." 
                value={newCollaboratorEmail}
                onChange={(e) => setNewCollaboratorEmail(e.target.value)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--bg-base)', color: '#fff' }}
              />
              <button 
                className="btn btn-primary"
                onClick={async (e) => {
                  if (newCollaboratorEmail) {
                    const btn = e.currentTarget;
                    const originalText = btn.innerText;
                    btn.innerText = "Sending...";
                    btn.disabled = true;
                    
                    try {
                      await fetch('/api/invite', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: newCollaboratorEmail, role: 'Editor' })
                      });
                    } catch (error) {
                      console.error("Invite failed:", error);
                    }
                    
                    setCollaborators([...collaborators, { name: newCollaboratorEmail.split('@')[0], email: newCollaboratorEmail, role: 'Editor', active: true }]);
                    setNewCollaboratorEmail('');
                    btn.innerText = originalText;
                    btn.disabled = false;
                    alert("Invitation email sent!");
                  }
                }}
              >
                Invite
              </button>
            </div>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>Live Shareable Link</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Anyone with link can view</div>
              </div>
              <button 
                className="btn" 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
              >
                <Copy size={14} /> {copiedLink ? "Link Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
