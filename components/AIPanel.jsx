"use client";

import { useState } from "react";
import { Sparkles, Wand2, Image as ImageIcon, Video, Check, Loader2, RefreshCw, Mic, MicOff, MessageSquare, Globe, Bot, Download } from "lucide-react";
import { queryGroqChat, queryTmdbMovies } from "@/lib/groq";

export default function AIPanel({ onInsertAiText, onExecuteMcpCommand, getEditorContext }) {
  // Preferred Language
  const [language, setLanguage] = useState("English");

  // Suggestion state
  const [selectedSuggestion, setSelectedSuggestion] = useState(
    '"I didn\'t think you\'d actually show up after what happened at Sector 4."'
  );
  const [copied, setCopied] = useState(false);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // Image & Video State
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImg, setGeneratedImg] = useState(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState(null);

  // Voice Dictation State
  const [isRecording, setIsRecording] = useState(false);
  const [speechText, setSpeechText] = useState("");



  // 1. Contextual Dialogue Assistant based on Active Cursor Selection
  const handleRegenerateDialogue = async () => {
    setLoadingSuggestion(true);
    const ctx = getEditorContext ? getEditorContext() : { selectedText: "", currentNodeText: "", fullText: "" };
    const contextPrompt = ctx.selectedText || ctx.currentNodeText || ctx.fullText.slice(-300) || "EXT. NEON CITY - NIGHT";

    try {
      const prompt = `You are an expert Hollywood script doctor.
Context around cursor / selected text: "${contextPrompt}"

Generate ONE new, highly dramatic, context-aware dialogue line in ${language} that fits seamlessly after this line.
Return ONLY the dialogue string inside double quotes. Do not include character name prefix or explanations.`;

      const res = await queryGroqChat({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8
      });

      if (res && res.trim()) {
        setSelectedSuggestion(res.trim().replace(/^"|"$/g, '"'));
      } else {
        throw new Error("Empty response");
      }
    } catch (err) {
      console.warn("Groq fallback triggered:", err.message);
      const fallbackDialogue = [
        '"The shadows in this city talk louder than the people."',
        '"Look around us. Some secrets are better left buried."',
        '"You were never supposed to find that file, Reed."',
      ];
      setSelectedSuggestion(fallbackDialogue[Math.floor(Math.random() * fallbackDialogue.length)]);
    }
    setLoadingSuggestion(false);
  };

  const handleInsert = () => {
    if (onInsertAiText) {
      onInsertAiText(selectedSuggestion.replace(/^"|"$/g, ''), 'dialogue');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 2. Dynamic Real AI Concept Art Generation (Pollinations AI)
  const generateConceptArt = () => {
    setIsGeneratingImg(true);
    const ctx = getEditorContext ? getEditorContext() : { selectedText: "", currentNodeText: "", fullText: "" };
    const sceneText = ctx.selectedText || ctx.currentNodeText || ctx.fullText.slice(-200) || "Neon cyberpunk city at night with rain and hover cars";

    const prompt = `Cinematic movie scene keyframe concept art, ${sceneText.replace(/<[^>]*>?/gm, '')}, 8k resolution, photorealistic cinematic lighting, film production concept design`;
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=450&seed=${seed}&nologo=true`;

    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
      setGeneratedImg(imageUrl);
      setIsGeneratingImg(false);
    };
    img.onerror = () => {
      setGeneratedImg("https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80");
      setIsGeneratingImg(false);
    };
  };

  // 3. Runway Pre-vis Render
  const [renderProgress, setRenderProgress] = useState(0);

  const generateVideoPreVis = () => {
    setIsGeneratingVideo(true);
    setRenderProgress(0);
    
    // Simulate rendering progress
    const interval = setInterval(() => {
      setRenderProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 500);

    setTimeout(() => {
      clearInterval(interval);
      setRenderProgress(100);
      // Cinematic sci-fi/abstract placeholder video (Tears of Steel)
      setGeneratedVideo("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4");
      setIsGeneratingVideo(false);
    }, 4500);
  };

  // 3b. Download Image
  const downloadImage = async (url) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = 'aurascript-concept-art.jpg';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Error downloading image:', error);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.download = 'aurascript-concept-art.jpg';
      link.click();
    }
  };

  // 4. Voice-to-Text Dictation (Web Speech API)
  const toggleVoiceRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your current browser. Please try Chrome or Edge.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = language === 'Spanish' ? 'es-ES' : language === 'French' ? 'fr-FR' : 'en-US';

    recognition.onstart = () => setIsRecording(true);
    
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setSpeechText(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleInsertVoiceText = () => {
    if (speechText && onInsertAiText) {
      onInsertAiText(speechText, 'action');
      setSpeechText("");
    }
  };



  return (
    <aside className="ai-panel glass-panel" style={{ width: '340px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3><Sparkles size={20} color="var(--accent-color)" /> AI Studio & RAG</h3>
      </div>

      {/* Language Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <Globe size={14} /> Language:
        <select 
          value={language} 
          onChange={(e) => setLanguage(e.target.value)}
          style={{ background: 'var(--bg-base)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '4px', padding: '2px 6px' }}
        >
          <option value="English">English</option>
          <option value="Spanish">Spanish (Español)</option>
          <option value="French">French (Français)</option>
          <option value="Hindi">Hindi (हिंदी)</option>
          <option value="Japanese">Japanese (日本語)</option>
        </select>
      </div>
      
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        


        {/* 2. Contextual Dialogue Auto-Complete */}
        <div className="ai-card">
          <div className="ai-card-title flex items-center gap-2">
            <Wand2 size={16} /> Cursor Dialogue Assistant
          </div>
          <div className="ai-card-content">
            <p style={{ marginBottom: '8px', fontSize: '0.8rem' }}>Contextual Suggestion (Cursor Selection):</p>
            <div style={{ 
              padding: '8px 10px', 
              background: 'rgba(99, 102, 241, 0.1)', 
              borderLeft: '3px solid var(--accent-color)', 
              borderRadius: '6px', 
              fontStyle: 'italic',
              fontSize: '0.8rem' 
            }}>
              {loadingSuggestion ? "Groq analyzing selected context..." : selectedSuggestion}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
              <button className="btn btn-primary" onClick={handleInsert} style={{ flex: 1, justifyContent: 'center' }}>
                {copied ? <Check size={14} /> : <Wand2 size={14} />} 
                {copied ? "Inserted!" : "Insert Dialogue"}
              </button>
              <button className="btn" onClick={handleRegenerateDialogue} title="Generate from Cursor Context">
                <RefreshCw size={14} className={loadingSuggestion ? "animate-spin" : ""} />
              </button>
            </div>
          </div>
        </div>

        {/* 3. Midjourney AI Concept Art (Pollinations AI) */}
        <div className="ai-card">
          <div className="ai-card-title flex items-center gap-2">
            <ImageIcon size={16} /> Dynamic Concept Art
          </div>
          <div className="ai-card-content">
            <p style={{ marginBottom: '8px', fontSize: '0.8rem' }}>Renders photorealistic scene keyframe from current line.</p>
            {generatedImg ? (
              <div>
                <img src={generatedImg} alt="AI Scene Concept" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px' }} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button className="btn" onClick={generateConceptArt} style={{ flex: 1, justifyContent: 'center' }}><RefreshCw size={14} /> New</button>
                  <button className="btn btn-primary" onClick={() => downloadImage(generatedImg)} style={{ flex: 1, justifyContent: 'center' }}><Download size={14} /> Save</button>
                </div>
              </div>
            ) : (
              <button className="btn" onClick={generateConceptArt} disabled={isGeneratingImg} style={{ width: '100%', justifyContent: 'center' }}>
                {isGeneratingImg ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                {isGeneratingImg ? "Synthesizing AI Art..." : "Visualize Current Scene"}
              </button>
            )}
          </div>
        </div>

        {/* 4. Voice-to-Text Dictation Assistant */}
        <div className="ai-card">
          <div className="ai-card-title flex items-center gap-2">
            <Mic size={16} /> Voice-to-Text Dictation
          </div>
          <div className="ai-card-content">
            <p style={{ marginBottom: '8px', fontSize: '0.8rem' }}>Speak your scene ideas out loud.</p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button 
                className={`btn ${isRecording ? 'btn-primary' : ''}`} 
                onClick={toggleVoiceRecording}
                style={{ flex: 1, justifyContent: 'center', background: isRecording ? '#ef4444' : undefined }}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                {isRecording ? "Listening..." : "Start Dictation"}
              </button>
            </div>

            {speechText && (
              <div style={{ marginTop: '8px', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', fontSize: '0.8rem' }}>
                <div>"{speechText}"</div>
                <button className="btn btn-primary" onClick={handleInsertVoiceText} style={{ marginTop: '6px', width: '100%', justifyContent: 'center', padding: '4px' }}>
                  Insert Structured Action
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 5. Runway Gen-2 Video Pre-vis */}
        <div className="ai-card">
          <div className="ai-card-title flex items-center gap-2">
            <Video size={16} /> Runway Gen-2 Pre-vis
          </div>
          <div className="ai-card-content">
            {generatedVideo ? (
              <div>
                <video src={generatedVideo} controls autoPlay loop muted style={{ width: '100%', borderRadius: '6px' }} />
                <button className="btn" onClick={generateVideoPreVis} style={{ marginTop: '6px', width: '100%', justifyContent: 'center' }}><RefreshCw size={14} /> Re-render</button>
              </div>
            ) : (
              <div>
                <button className="btn" onClick={generateVideoPreVis} disabled={isGeneratingVideo} style={{ width: '100%', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {isGeneratingVideo && (
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${renderProgress}%`, background: 'rgba(99, 102, 241, 0.2)', transition: 'width 0.5s', zIndex: 0 }} />
                  )}
                  <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isGeneratingVideo ? <Loader2 className="animate-spin" size={14} /> : <Video size={14} />} 
                    {isGeneratingVideo ? `Rendering... ${Math.min(renderProgress, 100)}%` : "Render Video Pre-vis"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </aside>
  );
}
