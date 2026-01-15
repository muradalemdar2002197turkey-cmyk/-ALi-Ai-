import React, { useState, useMemo } from 'react';
import { GitRepo, ProjectFile, GitFileStatus } from '../types';
import { computeStatus } from '../services/git';
import { Icons } from './Icon';

interface GitPanelProps {
  repo: GitRepo | null;
  currentFiles: ProjectFile[];
  onInit: () => void;
  onStage: (fileNames: string[]) => void;
  onUnstage: (fileNames: string[]) => void;
  onCommit: (message: string) => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({ 
  repo, 
  currentFiles, 
  onInit, 
  onStage, 
  onUnstage, 
  onCommit 
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'changes' | 'history'>('changes');

  // Compute status only when files or repo changes
  const statusList = useMemo(() => {
    if (!repo) return [];
    return computeStatus(currentFiles, repo);
  }, [repo, currentFiles]);

  const stagedItems = statusList.filter(s => repo?.stagedFiles.includes(s.fileName));
  const changesItems = statusList.filter(s => !repo?.stagedFiles.includes(s.fileName));

  if (!repo || !repo.isInitialized) {
    return (
      <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800 items-center justify-center p-6 text-center">
        <Icons.GitBranch size={48} className="text-gray-600 mb-4" />
        <h3 className="font-bold text-lg mb-2">التحكم في المصدر</h3>
        <p className="text-sm text-gray-500 mb-6">
          لم يتم تهيئة مستودع Git لهذا المشروع بعد.
        </p>
        <button 
          onClick={onInit}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors w-full"
        >
          تهيئة المستودع
        </button>
      </div>
    );
  }

  const handleCommit = () => {
    if (!commitMessage.trim()) return;
    onCommit(commitMessage);
    setCommitMessage('');
  };

  const StatusIcon = ({ status }: { status: string }) => {
    switch(status) {
      case 'modified': return <span className="text-yellow-500 font-bold text-xs" title="تعديل">M</span>;
      case 'added': return <span className="text-green-500 font-bold text-xs" title="إضافة">A</span>;
      case 'deleted': return <span className="text-red-500 font-bold text-xs" title="حذف">D</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="font-semibold flex items-center gap-2 text-indigo-400">
          <Icons.GitBranch size={18} />
          <span>Source Control</span>
        </div>
        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded text-gray-400">{repo.branch}</span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-800">
        <button 
          onClick={() => setActiveTab('changes')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'changes' ? 'bg-gray-800 text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          التغييرات
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${activeTab === 'history' ? 'bg-gray-800 text-white border-b-2 border-indigo-500' : 'text-gray-500 hover:text-gray-300'}`}
        >
          السجل ({repo.commits.length})
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'changes' ? (
          <div className="p-3 space-y-4">
            
            {/* Commit Input */}
            <div className="space-y-2">
              <textarea 
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                placeholder="رسالة التثبيت (Commit message)..."
                className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none resize-none h-20"
              />
              <button 
                onClick={handleCommit}
                disabled={stagedItems.length === 0 || !commitMessage.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-1.5 rounded-md text-sm font-medium flex items-center justify-center gap-2"
              >
                <Icons.Success size={14} />
                تثبيت (Commit)
              </button>
            </div>

            {/* Staged Changes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Staged Changes</span>
                <button 
                  onClick={() => onUnstage(stagedItems.map(i => i.fileName))}
                  className="text-[10px] text-gray-500 hover:text-white"
                  disabled={stagedItems.length === 0}
                >
                  إلغاء الكل
                </button>
              </div>
              <ul className="space-y-1">
                {stagedItems.length === 0 && <li className="text-xs text-gray-600 italic">لا توجد ملفات جاهزة</li>}
                {stagedItems.map(item => (
                  <li key={item.fileName} className="group flex items-center justify-between bg-gray-900/50 hover:bg-gray-800 rounded px-2 py-1.5 cursor-default">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <StatusIcon status={item.status} />
                      <span className="text-sm truncate text-gray-300" dir="ltr">{item.fileName}</span>
                    </div>
                    <button 
                      onClick={() => onUnstage([item.fileName])}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400"
                      title="إلغاء الإدراج (Unstage)"
                    >
                      <Icons.MinusCircle size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Changes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Changes</span>
                <button 
                  onClick={() => onStage(changesItems.map(i => i.fileName))}
                  className="text-[10px] text-gray-500 hover:text-white"
                  disabled={changesItems.length === 0}
                >
                  إدراج الكل
                </button>
              </div>
              <ul className="space-y-1">
                {changesItems.length === 0 && <li className="text-xs text-gray-600 italic">ملف العمل نظيف</li>}
                {changesItems.map(item => (
                  <li key={item.fileName} className="group flex items-center justify-between bg-gray-900/50 hover:bg-gray-800 rounded px-2 py-1.5 cursor-default">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <StatusIcon status={item.status} />
                      <span className="text-sm truncate text-gray-300" dir="ltr">{item.fileName}</span>
                    </div>
                    <button 
                      onClick={() => onStage([item.fileName])}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-green-400"
                      title="إدراج (Stage)"
                    >
                      <Icons.PlusCircle size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        ) : (
          <div className="p-2 space-y-2">
             {repo.commits.length === 0 && (
               <div className="text-center text-gray-600 text-xs py-4">لا توجد عمليات تثبيت سابقة</div>
             )}
             {repo.commits.map(commit => (
               <div key={commit.id} className="bg-gray-800/40 rounded-lg p-3 border-l-2 border-indigo-500">
                 <div className="flex justify-between items-start mb-1">
                   <span className="font-bold text-gray-200 text-xs truncate max-w-[120px]">{commit.message}</span>
                   <span className="text-[10px] text-gray-500 font-mono">{commit.id}</span>
                 </div>
                 <div className="flex justify-between items-center text-[10px] text-gray-500">
                   <span className="flex items-center gap-1"><Icons.GitCommit size={10} /> {commit.author}</span>
                   <span className="flex items-center gap-1"><Icons.Clock size={10} /> {new Date(commit.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                 </div>
                 <div className="mt-2 text-[10px] bg-gray-900/50 rounded px-2 py-1 inline-block text-gray-400">
                    {commit.filesSnapshot.length} ملفات
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};