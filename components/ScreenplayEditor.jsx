"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Paragraph from '@tiptap/extension-paragraph';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import CharacterCount from '@tiptap/extension-character-count';
import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';
import { ScreenplayExtension } from './ScreenplayExtension';
import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Type, AlignLeft, User, MessageSquare, AlertCircle, Printer } from 'lucide-react';

const initialContent = `
  <p class="scene-heading">EXT. NEON CITY - NIGHT</p>
  <p class="action">Rain slicks the glowing pavement. Hover-cars streak by, leaving trails of light in the smog.</p>
  <p class="character">DETECTIVE REED</p>
  <p class="parenthetical">(adjusting his coat)</p>
  <p class="dialogue">This city has a way of washing away everything. Even the truth.</p>
  <p class="action">He pulls a crushed photo from his pocket, staring at it intently.</p>
`;

const InnerEditor = forwardRef(function InnerEditor({ ydoc, provider, awareness, readOnly, onInsertAiText }, ref) {
  const editor = useEditor({
    editable: !readOnly,
    extensions: [
      StarterKit.configure({
        paragraph: false,
        history: false,
      }),
      Paragraph.extend({
        addAttributes() {
          return {
            class: {
              default: 'action',
              parseHTML: element => element.getAttribute('class'),
              renderHTML: attributes => {
                if (!attributes.class) return {};
                return { class: attributes.class };
              },
            },
          };
        },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your screenplay... (Press Tab or use Toolbar to set element type)',
      }),
      CharacterCount,
      ScreenplayExtension,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: provider,
        awareness: awareness,
        user: {
          name: 'Writer (You)',
          color: '#818cf8',
        },
      }),
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none',
      },
    },
  });

  useImperativeHandle(ref, () => ({
    insertText: (text, formatClass = 'dialogue') => {
      if (editor) {
        editor.chain().focus().insertContent(`<p class="${formatClass}">${text}</p>`).run();
      }
    },
    getContent: () => editor?.getHTML() || '',
    getText: () => editor?.getText() || '',
    getSelectedText: () => {
      if (!editor) return '';
      const { from, to } = editor.state.selection;
      return editor.state.doc.textBetween(from, to, ' ') || '';
    },
    getCurrentNodeText: () => {
      if (!editor) return '';
      const { $from } = editor.state.selection;
      return $from.parent.textContent || '';
    },
    setContent: (content) => editor?.commands.setContent(content),
    printPdf: () => window.print(),
  }));

  if (!editor) return null;

  const setFormat = (fmt) => {
    editor.chain().focus().setScreenplayFormat(fmt).run();
  };

  const currentClass = editor.getAttributes('paragraph').class || 'action';

  return (
    <div className="editor-wrapper" style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Formatting Toolbar */}
      <div className="formatting-toolbar glass-panel" style={{
        display: 'flex',
        gap: '8px',
        padding: '8px 16px',
        marginBottom: '20px',
        borderRadius: '30px',
        background: 'rgba(20, 22, 28, 0.85)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(16px)',
        zIndex: 20
      }}>
        <button 
          className={`btn-fmt ${currentClass === 'scene-heading' ? 'active' : ''}`}
          onClick={() => setFormat('scene-heading')}
          title="Scene Heading (EXT./INT.)"
        >
          <Type size={14} /> SCENE HEADING
        </button>
        <button 
          className={`btn-fmt ${currentClass === 'action' ? 'active' : ''}`}
          onClick={() => setFormat('action')}
          title="Action Description"
        >
          <AlignLeft size={14} /> ACTION
        </button>
        <button 
          className={`btn-fmt ${currentClass === 'character' ? 'active' : ''}`}
          onClick={() => setFormat('character')}
          title="Character Name"
        >
          <User size={14} /> CHARACTER
        </button>
        <button 
          className={`btn-fmt ${currentClass === 'parenthetical' ? 'active' : ''}`}
          onClick={() => setFormat('parenthetical')}
          title="Parenthetical (direction)"
        >
          <AlertCircle size={14} /> PARENTHETICAL
        </button>
        <button 
          className={`btn-fmt ${currentClass === 'dialogue' ? 'active' : ''}`}
          onClick={() => setFormat('dialogue')}
          title="Character Dialogue"
        >
          <MessageSquare size={14} /> DIALOGUE
        </button>

        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

        <button className="btn-fmt" onClick={() => window.print()} title="Print / Save PDF">
          <Printer size={14} /> PRINT / PDF
        </button>
      </div>

      {/* Screenplay Page Document */}
      <div className="screenplay-page">
        <EditorContent editor={editor} />
      </div>

      {/* Footer Word Counter */}
      <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        Words: {editor.storage.characterCount.words()} | Characters: {editor.storage.characterCount.characters()}
      </div>
    </div>
  );
});

export default forwardRef(function ScreenplayEditor({ readOnly = false }, ref) {
  const [ydoc, setYdoc] = useState(null);
  const [provider, setProvider] = useState(null);
  const [awareness, setAwareness] = useState(null);

  useEffect(() => {
    const doc = new Y.Doc();
    const idbProvider = new IndexeddbPersistence('aurascript-local-doc', doc);
    const awarenessInstance = new Awareness(doc);

    idbProvider.awareness = awarenessInstance;

    setYdoc(doc);
    setProvider(idbProvider);
    setAwareness(awarenessInstance);

    return () => {
      awarenessInstance.destroy();
      idbProvider.destroy();
      doc.destroy();
    };
  }, []);

  if (!ydoc || !provider || !awareness) {
    return (
      <div className="screenplay-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
        Loading Editor & Local Storage...
      </div>
    );
  }

  return <InnerEditor ref={ref} ydoc={ydoc} provider={provider} awareness={awareness} readOnly={readOnly} />;
});
