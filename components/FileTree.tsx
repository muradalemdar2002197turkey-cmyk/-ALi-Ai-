import React from 'react';
import { ProjectFile } from '../types';
import { Icons, FileIcon } from './Icon';

interface FileTreeProps {
  files: ProjectFile[];
  activeFile: ProjectFile | null;
  onSelectFile: (file: ProjectFile) => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ files, activeFile, onSelectFile }) => {
  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      <div className="p-4 border-b border-gray-800 font-semibold flex items-center gap-2 text-indigo-400">
        <Icons.Code size={18} />
        <span>ملفات المشروع</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {files.length === 0 ? (
          <div className="text-sm text-gray-600 text-center mt-10 italic">
            لا توجد ملفات بعد.<br/>اطلب إنشاء مشروع جديد!
          </div>
        ) : (
          <ul className="space-y-1">
            {files.map((file) => (
              <li key={file.name}>
                <button
                  onClick={() => onSelectFile(file)}
                  className={`w-full text-start px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    activeFile?.name === file.name
                      ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30'
                      : 'hover:bg-gray-800 text-gray-400'
                  }`}
                >
                  <FileIcon fileName={file.name} className="w-4 h-4" />
                  <span className="truncate" dir="ltr">{file.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};