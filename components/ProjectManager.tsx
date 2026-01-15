import React, { useState, useEffect } from 'react';
import { ProjectFile, SavedProject } from '../types';
import { getSavedProjects, saveProjectToStorage, deleteProjectFromStorage } from '../services/storage';
import { Icons } from './Icon';

interface ProjectManagerProps {
  currentFiles: ProjectFile[];
  onLoadProject: (files: ProjectFile[]) => void;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ currentFiles, onLoadProject, onClose }) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setProjects(getSavedProjects());
  }, []);

  const handleSave = () => {
    if (!newProjectName.trim()) {
      setError('يرجى إدخال اسم المشروع');
      return;
    }
    if (currentFiles.length === 0) {
      setError('لا توجد ملفات لحفظها');
      return;
    }

    try {
      saveProjectToStorage(newProjectName, currentFiles);
      setProjects(getSavedProjects());
      setNewProjectName('');
      setError('');
    } catch (e) {
      setError('فشل حفظ المشروع');
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('هل أنت متأكد من حذف هذا المشروع؟')) {
      const updated = deleteProjectFromStorage(id);
      setProjects(updated);
    }
  };

  const handleLoad = (project: SavedProject) => {
    if (window.confirm(`هل تريد تحميل المشروع "${project.name}"؟ سيتم استبدال الملفات الحالية.`)) {
      onLoadProject(project.files);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800 rounded-t-xl">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Icons.Folder size={20} className="text-indigo-400" />
            <span>إدارة المشاريع</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <Icons.Close size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* Save Section */}
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700/50">
            <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
              <Icons.Save size={16} /> حفظ المشروع الحالي
            </h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="اسم المشروع..."
                className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none"
              />
              <button 
                onClick={handleSave}
                disabled={currentFiles.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                حفظ
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          </div>

          {/* List Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">المشاريع المحفوظة</h3>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-800 rounded-lg">
                لا توجد مشاريع محفوظة
              </div>
            ) : (
              <ul className="space-y-2">
                {projects.map((project) => (
                  <li 
                    key={project.id} 
                    className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded-lg p-3 flex justify-between items-center transition-all cursor-pointer"
                    onClick={() => handleLoad(project)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-200 group-hover:text-indigo-300 transition-colors">
                        {project.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(project.lastModified).toLocaleDateString('ar-EG', {
                          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })} • {project.files.length} ملفات
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleDelete(project.id, e)}
                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                        title="حذف"
                      >
                        <Icons.Trash size={16} />
                      </button>
                      <button 
                         className="px-3 py-1 bg-gray-700 group-hover:bg-indigo-600 text-gray-300 group-hover:text-white rounded text-xs transition-colors"
                      >
                        تحميل
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};