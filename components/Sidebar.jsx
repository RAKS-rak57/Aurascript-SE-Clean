"use client";

import { FileText, GitBranch, History, Users, Settings, Sparkles, Folder } from "lucide-react";

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="sidebar glass-panel">
      <h2><FileText size={24} color="var(--accent-color)" /> AuraScript</h2>
      
      <div className="sidebar-nav" style={{ flex: 1 }}>
        <div 
          className={`nav-item ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => onSelectTab('editor')}
        >
          <FileText size={18} />
          <span>Script Editor</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => onSelectTab('files')}
        >
          <Folder size={18} />
          <span>Project Files</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'branches' ? 'active' : ''}`}
          onClick={() => onSelectTab('branches')}
        >
          <GitBranch size={18} />
          <span>Branches</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onSelectTab('history')}
        >
          <History size={18} />
          <span>Version History</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'collaborators' ? 'active' : ''}`}
          onClick={() => onSelectTab('collaborators')}
        >
          <Users size={18} />
          <span>Collaborators</span>
        </div>

        <div 
          className={`nav-item ${activeTab === 'ai-chat' ? 'active' : ''}`}
          onClick={() => onSelectTab('ai-chat')}
        >
          <Sparkles size={18} />
          <span>AI Chat & MCP Agent</span>
        </div>
      </div>

      <div className="sidebar-nav">
        <div 
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onSelectTab('settings')}
        >
          <Settings size={18} />
          <span>Settings</span>
        </div>
      </div>
    </aside>
  );
}
