
import React, { useState, useEffect, useRef } from 'react';
import { ProjectFile } from '../types';
import { FileIcon, Icons } from './Icon';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';

// Import Prism languages
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';

interface CodeEditorProps {
  file: ProjectFile | null;
  onChange: (content: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ file, onChange }) => {
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (file) {
      setLineCount(file.content.split('\n').length);
    }
  }, [file?.content]);

  // Update cursor position logic (Simplified)
  const handleCursorUpdate = (e: any) => {
    const textarea = e.target;
    const val = textarea.value.substr(0, textarea.selectionStart);
    const lines = val.split('\n');
    setCursorPos({
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    });
  };

  if (!file) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#1a1b26] text-[#787c99] select-none relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-10 left-10 w-64 h-64 bg-purple-600 rounded-full blur-[100px]"></div>
             <div className="absolute bottom-10 right-10 w-64 h-64 bg-blue-600 rounded-full blur-[100px]"></div>
        </div>
        
        <div className="z-10 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-800/50 rounded-2xl flex items-center justify-center mx-auto border border-gray-700 shadow-xl shadow-black/20 backdrop-blur-sm">
             <Icons.Code size={40} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-200 mb-2 tracking-tight" dir="ltr">&lt;/ALi&gt;&lt;Ai&gt; IDE</p>
            <p className="text-sm opacity-70">اختر ملفاً من القائمة لبدء البرمجة</p>
          </div>
        </div>
      </div>
    );
  }

  const highlight = (code: string) => {
    let grammar = Prism.languages.clike;
    let lang = 'clike';

    const ext = file.name.split('.').pop()?.toLowerCase();

    switch (ext) {
      case 'html': grammar = Prism.languages.markup; lang = 'markup'; break;
      case 'css': grammar = Prism.languages.css; lang = 'css'; break;
      case 'js': case 'mjs': grammar = Prism.languages.javascript; lang = 'javascript'; break;
      case 'ts': grammar = Prism.languages.typescript; lang = 'typescript'; break;
      case 'jsx': grammar = Prism.languages.jsx; lang = 'jsx'; break;
      case 'tsx': grammar = Prism.languages.tsx; lang = 'tsx'; break;
      case 'py': grammar = Prism.languages.python; lang = 'python'; break;
      case 'json': grammar = Prism.languages.json; lang = 'json'; break;
      case 'md': grammar = Prism.languages.markdown; lang = 'markdown'; break;
      case 'sql': grammar = Prism.languages.sql; lang = 'sql'; break;
      case 'sh': case 'bash': grammar = Prism.languages.bash; lang = 'bash'; break;
      default:
        if (file.language === 'html') { grammar = Prism.languages.markup; lang = 'markup'; }
        else if (file.language === 'css') { grammar = Prism.languages.css; lang = 'css'; }
        break;
    }

    return Prism.highlight(code, grammar || Prism.languages.clike, lang);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(file.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Custom "Tokyo Night" inspired Theme CSS
  const editorThemeStyles = `
    /* Editor Container */
    .custom-editor-wrapper {
      background-color: #1a1b26; /* Tokyo Night Background */
      color: #a9b1d6;
    }

    /* Prism Syntax Highlighting - Neon/Tokyo Night Style */
    .token.comment,
    .token.prolog,
    .token.doctype,
    .token.cdata {
      color: #565f89;
      font-style: italic;
    }

    .token.punctuation {
      color: #9aa5ce;
    }

    .token.namespace {
      opacity: .7;
    }

    .token.property,
    .token.tag,
    .token.boolean,
    .token.number,
    .token.constant,
    .token.symbol,
    .token.deleted {
      color: #ff9e64; /* Orange */
    }

    .token.selector,
    .token.attr-name,
    .token.string,
    .token.char,
    .token.builtin,
    .token.inserted {
      color: #9ece6a; /* Green */
    }

    .token.operator,
    .token.entity,
    .token.url,
    .language-css .token.string,
    .style .token.string {
      color: #89ddff; /* Cyan */
    }

    .token.atrule,
    .token.attr-value,
    .token.keyword {
      color: #bb9af7; /* Purple */
      font-weight: bold;
    }

    .token.function,
    .token.class-name {
      color: #7aa2f7; /* Blue */
    }

    .token.regex,
    .token.important,
    .token.variable {
      color: #e0af68; /* Yellow */
    }

    /* Editor Overrides */
    .prism-editor textarea {
      outline: none !important;
      padding-left: 3rem !important; /* Space for line numbers */
    }
    
    .prism-editor pre {
      padding-left: 3rem !important;
    }

    /* Selection Color */
    .prism-editor textarea::selection {
      background-color: #515c7e; 
      color: white;
    }
  `;

  return (
    <div className="h-full w-full flex flex-col bg-[#1a1b26] text-[#a9b1d6] relative group">
      <style>{editorThemeStyles}</style>

      {/* Modern Glassy Header */}
      <div className="h-12 bg-[#16161e]/80 backdrop-blur-md border-b border-[#0f0f14] flex items-center justify-between px-4 select-none z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1f2335] rounded-md border border-[#292e42] shadow-sm">
             <FileIcon fileName={file.name} className="w-4 h-4" />
             <span className="text-sm font-semibold text-[#c0caf5] tracking-wide">{file.name}</span>
          </div>
          <span className="text-xs text-[#565f89] font-mono border-l border-[#292e42] pl-3">
             {file.language.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
           <button 
             onClick={handleCopy}
             className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                 copied 
                 ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                 : 'bg-[#24283b] text-[#7aa2f7] border border-[#292e42] hover:bg-[#2f3549] hover:text-white'
             }`}
           >
             {copied ? <Icons.Success size={13} /> : <Icons.Copy size={13} />}
             <span>{copied ? 'تم النسخ' : 'نسخ'}</span>
           </button>
           
           <button 
             onClick={handleDownload}
             className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-[#24283b] text-[#bb9af7] border border-[#292e42] hover:bg-[#2f3549] hover:text-white transition-all duration-200"
           >
             <Icons.Download size={13} />
             <span>تحميل</span>
           </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 relative overflow-hidden custom-editor-wrapper" ref={editorRef}>
        
        {/* Line Numbers Sidebar */}
        <div 
            className="absolute left-0 top-0 bottom-0 w-12 bg-[#16161e] border-r border-[#1f2335] text-right pr-2 pt-4 select-none z-10 pointer-events-none text-[#3b4261] font-mono text-sm leading-[21px]" 
            aria-hidden="true"
        >
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className={i + 1 === cursorPos.line ? 'text-[#c0caf5] font-bold' : ''}>
              {i + 1}
            </div>
          ))}
        </div>

        {/* The Editor */}
        <div className="h-full w-full overflow-auto custom-scrollbar" dir="ltr" onClick={handleCursorUpdate} onKeyUp={handleCursorUpdate}>
          <Editor
            value={file.content}
            onValueChange={onChange}
            highlight={highlight}
            padding={16}
            className="prism-editor font-mono text-sm"
            style={{
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              fontSize: 14,
              lineHeight: '21px', // Fixed line height for alignment
              minHeight: '100%',
              backgroundColor: 'transparent'
            }}
            textareaClassName="focus:outline-none"
          />
        </div>
      </div>

      {/* Modern Status Bar */}
      <div className="h-7 bg-[#16161e] border-t border-[#0f0f14] flex items-center justify-between px-4 text-[10px] text-[#565f89] select-none font-medium">
         <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 hover:text-[#7aa2f7] transition-colors">
               <Icons.GitBranch size={10} />
               main
            </span>
            <span className="hover:text-[#bb9af7] transition-colors">
               Ln {cursorPos.line}, Col {cursorPos.col}
            </span>
         </div>
         <div className="flex items-center gap-4">
            <span className="hover:text-[#9ece6a] transition-colors">UTF-8</span>
            <span className="hover:text-[#e0af68] transition-colors">{file.content.length} chars</span>
            <span className="flex items-center gap-1 text-[#7aa2f7]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#7aa2f7] animate-pulse"></div>
                Ready
            </span>
         </div>
      </div>
    </div>
  );
};
