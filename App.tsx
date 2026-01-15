
import React, { useState, useRef, useEffect } from 'react';
import { ProjectFile, ChatMessage, ViewMode, LogEntry, GitRepo, FileType } from './types';
import { streamProjectGen } from './services/gemini'; 
import { exportProjectAsZip, generateSingleHtml } from './services/export';
import { createInitialRepo, commitChanges } from './services/git';
import { saveProjectToStorage } from './services/storage';
import { FileTree } from './components/FileTree';
import { GitPanel } from './components/GitPanel';
import { DatabasePanel } from './components/DatabasePanel';
import { DeploymentPanel } from './components/DeploymentPanel';
import { TodoPanel } from './components/TodoPanel';
import { ApiPanel } from './components/ApiPanel';
import { AuditPanel } from './components/AuditPanel';
import { ArchitectPanel } from './components/ArchitectPanel';
import { CodeEditor } from './components/CodeEditor';
import { Preview } from './components/Preview';
import { ProjectManager } from './components/ProjectManager';
import { Console } from './components/Console';
import { Icons } from './components/Icon';

const App: React.FC = () => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [activeFile, setActiveFile] = useState<ProjectFile | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{data: string, mimeType: string, name: string} | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.BOTH);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<'files' | 'git' | 'database' | 'deploy' | 'todo' | 'api' | 'audit' | 'architect'>('files');
  const [showProjectManager, setShowProjectManager] = useState(false);
  
  // New Project Dialog State
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [pendingProjectName, setPendingProjectName] = useState('');
  
  // Git State
  const [gitRepo, setGitRepo] = useState<GitRepo | null>(null);
  
  // Debug & Preview State
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // State for manual refresh
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Extract base64 data and mime type
        const mimeType = result.split(';')[0].split(':')[1];
        const data = result.split(',')[1];
        setSelectedMedia({ data, mimeType, name: file.name });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerAiGeneration = async (prompt: string, media?: {data: string, mimeType: string, name: string}) => {
     if (isGenerating) return;

    const userMsgId = Date.now().toString();
    const aiMsgId = (Date.now() + 1).toString();

    const displayMedia = media?.mimeType.startsWith('image/') 
      ? `data:${media.mimeType};base64,${media.data}` 
      : undefined;
    
    const userMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: prompt + (media && !displayMedia ? `\n[مرفق: ${media.name}]` : ''),
      image: displayMedia, // Only display images in chat bubble for now
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, userMsg]);
    
    const aiMsgPlaceholder: ChatMessage = {
        id: aiMsgId,
        role: 'model',
        text: '', 
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, aiMsgPlaceholder]);
    
    setIsGenerating(true);

    let fullResponseText = '';
    let webSources: { uri: string; title: string }[] = [];

    // Ensure media asset is added to project files for referencing
    let currentContextFiles = [...files];
    if (media) {
       const assetExists = currentContextFiles.some(f => f.name === media.name);
       if (!assetExists) {
           const newAsset: ProjectFile = {
               name: media.name,
               content: media.data, // Store Base64 content
               language: FileType.OTHER
           };
           currentContextFiles = [...currentContextFiles, newAsset];
           setFiles(currentContextFiles);
       }
    }

    try {
      const stream = streamProjectGen(
        prompt, 
        currentContextFiles, 
        useSearch, 
        media ? { mimeType: media.mimeType, data: media.data } : undefined
      ); 
      
      for await (const chunk of stream) {
         const textChunk = chunk.text || '';
         fullResponseText += textChunk;
         
         if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            const chunks = chunk.candidates[0].groundingMetadata.groundingChunks;
            const sources = chunks
              .filter((c: any) => c.web)
              .map((c: any) => ({ uri: c.web.uri, title: c.web.title }));
            if (sources.length > 0) {
                webSources = [...webSources, ...sources];
            }
         }

         setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId 
            ? { ...msg, text: fullResponseText, groundingMetadata: webSources.length > 0 ? { webSources } : undefined } 
            : msg
         ));
      }

      const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = fullResponseText.match(jsonRegex);

      if (match && match[1]) {
          try {
              const parsed = JSON.parse(match[1]);
              
              if (parsed.files && Array.isArray(parsed.files)) {
                  const newFiles = [...currentContextFiles];
                  parsed.files.forEach((generatedFile: any) => {
                    const index = newFiles.findIndex(f => f.name === generatedFile.name);
                    if (index >= 0) {
                      newFiles[index] = generatedFile;
                    } else {
                      newFiles.push(generatedFile);
                    }
                  });
                  
                  setFiles(newFiles);
                  
                  if (!activeFile && newFiles.length > 0) {
                    const main = newFiles.find(f => f.name === 'index.html') || newFiles[0];
                    setActiveFile(main);
                  } else if (activeFile) {
                      const updatedActive = newFiles.find(f => f.name === activeFile.name);
                      if (updatedActive) setActiveFile(updatedActive);
                  }
              }
          } catch (e) {
              console.error("Failed to parse generated JSON code block", e);
          }
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId 
        ? { ...msg, text: msg.text + "\n\n[حدث خطأ أثناء الاتصال بالخادم]", isError: true } 
        : msg
      ));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendMessage = () => {
    if ((!input.trim() && !selectedMedia)) return;
    
    const prompt = input;
    const media = selectedMedia;

    // Reset UI
    setInput('');
    setSelectedMedia(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    triggerAiGeneration(prompt, media || undefined);
  };

  const updateFileContent = (newContent: string) => {
    if (!activeFile) return;
    const updatedFiles = files.map(f => 
      f.name === activeFile.name ? { ...f, content: newContent } : f
    );
    setFiles(updatedFiles);
    setActiveFile({ ...activeFile, content: newContent });
  };

  const handleDownloadFile = () => {
    if (files.length === 0) return;
    
    if (activeFile) {
        const blob = new Blob([activeFile.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.name;
        a.click();
        URL.revokeObjectURL(url);
    } else {
        alert("يرجى اختيار ملف لتحميله.");
    }
  };

  const handleExportZip = async () => {
    if (files.length === 0) return;
    try {
      await exportProjectAsZip(files);
    } catch (e) {
      console.error("Export failed", e);
      alert("فشل تصدير المشروع");
    }
  };

  const handleDownloadSingleHtml = () => {
    const html = generateSingleHtml(files);
    if (!html) {
      alert("لا يوجد ملف HTML لدمجه.");
      return;
    }
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.merged.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadProject = (loadedFiles: ProjectFile[]) => {
    setFiles(loadedFiles);
    setGitRepo(null); // Reset git on new project load
    if (loadedFiles.length > 0) {
      const main = loadedFiles.find(f => f.name === 'index.html') || loadedFiles[0];
      setActiveFile(main);
    } else {
      setActiveFile(null);
    }
    setLogs([]);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      text: `تم تحميل المشروع بنجاح. (${loadedFiles.length} ملفات)`,
      timestamp: Date.now()
    }]);
  };

  // Logic to completely reset workspace
  const resetWorkspace = () => {
    setFiles([]);
    setActiveFile(null);
    setMessages([]); // Clear chat
    setGitRepo(null);
    setLogs([]);
    setInput('');
    setSelectedMedia(null);
    setRefreshTrigger(0);
    
    // Add welcome message
    setMessages([{
      id: Date.now().toString(),
      role: 'model',
      text: 'تم بدء مشروع جديد. ماذا تريد أن نبني اليوم؟',
      timestamp: Date.now()
    }]);
  };

  const handleNewProjectClick = () => {
    if (files.length > 0) {
      setShowNewProjectDialog(true);
    } else {
      resetWorkspace();
    }
  };

  const handleSaveAndNew = () => {
    if (!pendingProjectName.trim()) {
      alert("يرجى إدخال اسم لحفظ المشروع");
      return;
    }
    saveProjectToStorage(pendingProjectName, files);
    setShowNewProjectDialog(false);
    setPendingProjectName('');
    resetWorkspace();
  };

  const handleDiscardAndNew = () => {
    setShowNewProjectDialog(false);
    setPendingProjectName('');
    resetWorkspace();
  };

  const handleRefreshPreview = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAddLog = (log: LogEntry) => {
    setLogs(prev => [...prev, log]);
  };

  const toggleDebugMode = () => {
    setIsDebugMode(!isDebugMode);
    if (!isDebugMode) {
      setShowConsole(true);
    }
  };

  // Git Handlers
  const handleGitInit = () => {
    setGitRepo(createInitialRepo());
  };

  const handleGitStage = (fileNames: string[]) => {
    if (!gitRepo) return;
    // Add only if not already staged
    const uniqueStaged = Array.from(new Set([...gitRepo.stagedFiles, ...fileNames]));
    setGitRepo({ ...gitRepo, stagedFiles: uniqueStaged });
  };

  const handleGitUnstage = (fileNames: string[]) => {
    if (!gitRepo) return;
    const newStaged = gitRepo.stagedFiles.filter(f => !fileNames.includes(f));
    setGitRepo({ ...gitRepo, stagedFiles: newStaged });
  };

  const handleGitCommit = (msg: string) => {
    if (!gitRepo) return;
    try {
      const newRepo = commitChanges(gitRepo, files, msg);
      setGitRepo(newRepo);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-gray-200 font-sans">
      
      {/* Sidebar */}
      {showSidebar && (
        <div className="flex flex-col border-e border-gray-800 bg-gray-950">
          {/* Sidebar Tabs Switcher */}
          <div className="flex border-b border-gray-800 flex-wrap max-w-[256px]">
             <button 
               onClick={() => setSidebarTab('files')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'files' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="مستكشف الملفات"
             >
               <Icons.Folder size={18} />
             </button>
             <button 
               onClick={() => setSidebarTab('architect')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'architect' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="مهندس الأنظمة (Systems Architect)"
             >
               <Icons.Architect size={18} />
             </button>
             <button 
               onClick={() => setSidebarTab('audit')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'audit' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="المدقق الذكي (Code Audit)"
             >
               <Icons.Audit size={18} />
             </button>
             <button 
               onClick={() => setSidebarTab('database')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'database' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="قواعد البيانات"
             >
               <Icons.Database size={18} />
             </button>
             <button 
               onClick={() => setSidebarTab('api')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'api' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="مولد API"
             >
               <Icons.Network size={18} />
             </button>
             <button 
               onClick={() => setSidebarTab('todo')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'todo' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="قائمة المهام"
             >
               <Icons.ListTodo size={18} />
             </button>
             <button 
               onClick={() => setSidebarTab('deploy')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'deploy' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="النشر والتصدير"
             >
               <Icons.Rocket size={18} />
             </button>
             <button 
               onClick={() => setSidebarTab('git')}
               className={`w-1/4 py-2 flex justify-center hover:bg-gray-800 transition-colors ${sidebarTab === 'git' ? 'border-b-2 border-indigo-500 text-white' : 'text-gray-500'}`}
               title="إدارة المصدر (Git)"
             >
               <Icons.GitBranch size={18} />
             </button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-hidden">
             {sidebarTab === 'files' && (
                <FileTree 
                  files={files} 
                  activeFile={activeFile} 
                  onSelectFile={setActiveFile} 
                />
             )}
             {sidebarTab === 'architect' && (
               <ArchitectPanel 
                 onGenerate={(prompt) => triggerAiGeneration(prompt)}
               />
             )}
             {sidebarTab === 'audit' && (
               <AuditPanel 
                 files={files}
                 onGenerate={(prompt) => triggerAiGeneration(prompt)}
               />
             )}
             {sidebarTab === 'database' && (
               <DatabasePanel 
                 onGenerate={(prompt) => triggerAiGeneration(prompt)}
               />
             )}
             {sidebarTab === 'api' && (
               <ApiPanel 
                 onGenerate={(prompt) => triggerAiGeneration(prompt)}
               />
             )}
             {sidebarTab === 'todo' && (
               <TodoPanel />
             )}
             {sidebarTab === 'deploy' && (
               <DeploymentPanel 
                 currentFiles={files}
                 onGenerate={(prompt) => triggerAiGeneration(prompt)}
               />
             )}
             {sidebarTab === 'git' && (
                <GitPanel 
                  repo={gitRepo}
                  currentFiles={files}
                  onInit={handleGitInit}
                  onStage={handleGitStage}
                  onUnstage={handleGitUnstage}
                  onCommit={handleGitCommit}
                />
             )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Toolbar */}
        <header className="h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button 
                onClick={() => setShowSidebar(!showSidebar)}
                className="p-2 hover:bg-gray-800 rounded-md text-gray-400"
            >
                <Icons.Menu size={20} />
            </button>
            <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent" dir="ltr">
              &lt;/ALi&gt;&lt;Ai&gt;
            </h1>
          </div>

          <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
             <button 
               onClick={() => setViewMode(ViewMode.EDITOR)}
               className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${viewMode === ViewMode.EDITOR ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
             >
               <Icons.Code size={14} /> المحرر
             </button>
             <button 
               onClick={() => setViewMode(ViewMode.BOTH)}
               className={`hidden md:flex px-3 py-1.5 text-xs font-medium rounded-md items-center gap-2 transition-all ${viewMode === ViewMode.BOTH ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
             >
               <Icons.Layout size={14} /> تقسيم
             </button>
             <button 
               onClick={() => setViewMode(ViewMode.PREVIEW)}
               className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${viewMode === ViewMode.PREVIEW ? 'bg-gray-700 text-white shadow' : 'text-gray-400 hover:text-white'}`}
             >
               <Icons.Monitor size={14} /> معاينة
             </button>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Refresh Button */}
             <button 
                onClick={handleRefreshPreview}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold rounded-md transition-colors border border-gray-700"
                title="تحديث المعاينة"
            >
                <Icons.Refresh size={14} />
                <span className="hidden sm:inline">تحديث</span>
            </button>

            {/* Mobile Preview Toggle */}
            <button 
                onClick={() => setIsMobilePreview(!isMobilePreview)}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
                    isMobilePreview
                    ? 'bg-indigo-900/50 text-indigo-200 border-indigo-700 hover:bg-indigo-900/70'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                }`}
                title="وضع الجوال"
            >
                <Icons.Mobile size={14} />
                <span className="hidden sm:inline">جوال</span>
            </button>

            <button 
                onClick={toggleDebugMode}
                className={`hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors border ${
                    isDebugMode 
                    ? 'bg-orange-900/50 text-orange-200 border-orange-700 hover:bg-orange-900/70' 
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
                }`}
                title="تفعيل وضع التصحيح"
            >
                <Icons.Bug size={14} />
                <span className="hidden sm:inline">تصحيح</span>
            </button>

            <button 
                onClick={handleNewProjectClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-md transition-colors border border-gray-700"
                title="مشروع جديد"
            >
                <Icons.FilePlus size={14} />
                <span className="hidden sm:inline">جديد</span>
            </button>

            <button 
                onClick={() => setShowProjectManager(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-md transition-colors border border-gray-700"
                title="إدارة المشاريع"
            >
                <Icons.Folder size={14} />
                <span className="hidden sm:inline">المشاريع</span>
            </button>
            
            <div className="h-6 w-px bg-gray-700 mx-1"></div>

             <button 
                onClick={handleDownloadSingleHtml}
                disabled={files.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-md transition-colors"
                title="دمج المشروع في ملف HTML واحد"
            >
                <Icons.File size={14} />
                <span className="hidden sm:inline">دمج HTML</span>
            </button>
            <button 
                onClick={handleExportZip}
                disabled={files.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-md transition-colors"
                title="تصدير المشروع كملف ZIP"
            >
                <Icons.Archive size={14} />
                <span className="hidden sm:inline">تصدير</span>
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div className="flex-1 flex overflow-hidden">
            {/* Editor Pane */}
            {(viewMode === ViewMode.EDITOR || viewMode === ViewMode.BOTH) && (
                <div className={`${viewMode === ViewMode.BOTH ? 'w-1/2 border-e border-gray-800' : 'w-full'} flex flex-col`}>
                    <CodeEditor file={activeFile} onChange={updateFileContent} />
                </div>
            )}

            {/* Preview Pane */}
            {(viewMode === ViewMode.PREVIEW || viewMode === ViewMode.BOTH) && (
                <div className={`${viewMode === ViewMode.BOTH ? 'w-1/2' : 'w-full'} bg-white flex flex-col relative`}>
                    <Preview 
                      files={files} 
                      isDebugMode={isDebugMode} 
                      isMobileView={isMobilePreview}
                      onLog={handleAddLog}
                      refreshTrigger={refreshTrigger}
                    />
                    
                    {/* Console Overlay */}
                    {showConsole && (
                      <div className="absolute bottom-0 left-0 right-0 h-48 z-10 shadow-lg">
                        <Console 
                          logs={logs} 
                          onClear={() => setLogs([])} 
                          onClose={() => setShowConsole(false)} 
                        />
                      </div>
                    )}
                </div>
            )}
        </div>

        {/* Chat Interface */}
        <div className="h-72 bg-gray-900 border-t border-gray-800 flex flex-col">
            {/* Chat History */}
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                        <Icons.MessageSquare size={32} className="mb-2" />
                        <p className="text-sm">قم بوصف التطبيق أو اللعبة أو الموقع الذي تريد إنشاءه.</p>
                        <p className="text-xs mt-1" dir="ltr">"Create a snake game in HTML/JS"</p>
                        <p className="text-xs" dir="ltr">"Build a Python script to sort files"</p>
                        <p className="text-xs mt-2 text-indigo-400">يمكنك أيضاً رفع صورة لتصميم أو ملف صوتي/فيديو لربطه.</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                            msg.role === 'user' 
                                ? 'bg-indigo-600 text-white' 
                                : msg.isError 
                                    ? 'bg-red-900/50 text-red-200 border border-red-800'
                                    : 'bg-gray-800 text-gray-200'
                        }`}>
                            {/* Display Image if present */}
                            {msg.image && (
                              <div className="mb-2 rounded-lg overflow-hidden border border-white/10 max-w-full">
                                <img src={msg.image} alt="User upload" className="max-h-60 object-contain" />
                              </div>
                            )}
                            
                            <p className="whitespace-pre-wrap font-mono text-xs md:text-sm">{msg.text}</p>
                            
                            {/* Display Web Sources */}
                            {msg.groundingMetadata?.webSources && msg.groundingMetadata.webSources.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-gray-700/50">
                                    <p className="text-xs text-gray-400 font-semibold mb-1 flex items-center gap-1">
                                        <Icons.Search size={10} /> المصادر:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {msg.groundingMetadata.webSources.map((source, idx) => (
                                            <a 
                                                key={idx} 
                                                href={source.uri} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-xs text-indigo-400 hover:underline truncate max-w-xs block"
                                            >
                                                {source.title || source.uri}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isGenerating && (
                    <div className="flex justify-start">
                         <div className="bg-gray-800 rounded-lg p-3 flex items-center gap-2">
                             <span className="text-xs text-gray-400">جاري الكتابة...</span>
                             <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-75" />
                                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce delay-150" />
                             </div>
                         </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-gray-850 border-t border-gray-800">
                
                {/* File Preview in Input Area */}
                {selectedMedia && (
                  <div className="mb-2 flex items-center gap-2 bg-gray-900 w-fit p-1.5 rounded-lg border border-gray-700">
                    {selectedMedia.mimeType.startsWith('image/') ? (
                         <img src={`data:${selectedMedia.mimeType};base64,${selectedMedia.data}`} alt="Selected" className="h-10 w-10 object-cover rounded" />
                    ) : (
                         <div className="h-10 w-10 bg-gray-800 rounded flex items-center justify-center text-gray-400">
                             <Icons.File size={20} />
                         </div>
                    )}
                    <span className="text-xs text-gray-300 max-w-[150px] truncate">{selectedMedia.name}</span>
                    <button onClick={() => setSelectedMedia(null)} className="text-gray-400 hover:text-white">
                      <Icons.Close size={14} />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                     <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer hover:text-gray-200 select-none">
                        <input 
                            type="checkbox" 
                            checked={useSearch}
                            onChange={(e) => setUseSearch(e.target.checked)}
                            className="rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-0"
                        />
                        <Icons.Search size={12} />
                        تفعيل البحث في الويب
                     </label>
                </div>
                <div className="flex gap-2 items-center">
                    <input 
                      type="file" 
                      accept="image/*,audio/*,video/*,text/*,application/pdf" 
                      onChange={handleFileSelect}
                      ref={fileInputRef}
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 bg-gray-800 hover:bg-gray-700 rounded-md text-gray-400 transition-colors"
                      title="رفع ملف (صورة، صوت، فيديو، نص)"
                    >
                      <Icons.Upload size={18} />
                    </button>
                    
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="اكتب طلبك أو ارفع ملفاً لإضافته للمشروع..."
                        className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-gray-500"
                        disabled={isGenerating}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={(!input.trim() && !selectedMedia) || isGenerating}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md transition-colors rotate-180"
                    >
                        <Icons.Play size={18} fill="currentColor" className="ml-0.5" />
                    </button>
                </div>
            </div>
        </div>

        {/* Project Manager Modal */}
        {showProjectManager && (
          <ProjectManager 
            currentFiles={files}
            onLoadProject={handleLoadProject}
            onClose={() => setShowProjectManager(false)}
          />
        )}

        {/* New Project Dialog */}
        {showNewProjectDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                 <div className="p-2 bg-indigo-900/30 rounded-full text-indigo-400">
                    <Icons.FilePlus size={20} />
                 </div>
                 <div>
                    <h3 className="text-lg font-bold text-gray-100">مشروع جديد</h3>
                    <p className="text-xs text-gray-400">لديك ملفات غير محفوظة في مساحة العمل الحالية.</p>
                 </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                   <label className="text-xs uppercase font-semibold text-gray-500">اسم المشروع (للحفظ)</label>
                   <input 
                     type="text" 
                     value={pendingProjectName}
                     onChange={(e) => setPendingProjectName(e.target.value)}
                     placeholder="مشروع الويب الخاص بي..."
                     className="w-full bg-gray-950 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                     autoFocus
                   />
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                   <button 
                     onClick={handleSaveAndNew}
                     className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
                   >
                     <Icons.Save size={16} />
                     حفظ وبدء جديد
                   </button>
                   
                   <button 
                     onClick={handleDiscardAndNew}
                     className="w-full bg-gray-800 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900/50 border border-transparent text-gray-300 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                   >
                     <Icons.Trash size={16} />
                     تجاهل وبدء جديد
                   </button>

                   <button 
                     onClick={() => setShowNewProjectDialog(false)}
                     className="w-full mt-2 text-gray-500 hover:text-gray-300 text-xs font-medium transition-colors"
                   >
                     إلغاء الأمر
                   </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
