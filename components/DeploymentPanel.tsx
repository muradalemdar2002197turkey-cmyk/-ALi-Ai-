import React, { useState } from 'react';
import { Icons } from './Icon';
import { ProjectFile } from '../types';
import { exportProjectAsZip } from '../services/export';

interface DeploymentPanelProps {
  currentFiles: ProjectFile[];
  onGenerate: (prompt: string) => void;
}

export const DeploymentPanel: React.FC<DeploymentPanelProps> = ({ currentFiles, onGenerate }) => {
  const [deployTarget, setDeployTarget] = useState<'netlify' | 'vercel' | 'github'>('netlify');

  const handlePrepare = () => {
    let prompt = `Prepare this project for deployment to `;
    switch (deployTarget) {
      case 'netlify':
        prompt += `Netlify. Create a proper 'netlify.toml' configuration file ensuring the build command is empty (static) and publish directory is correct (usually '.'). Check index.html for relative path issues.`;
        break;
      case 'vercel':
        prompt += `Vercel. Create a 'vercel.json' configuration file optimized for a static site.`;
        break;
      case 'github':
        prompt += `GitHub Pages. Ensure there is a valid index.html at the root. If a build step is needed, create a basic README.md explaining how to push to a gh-pages branch.`;
        break;
    }
    onGenerate(prompt);
  };

  const handleDownload = () => {
    exportProjectAsZip(currentFiles);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      <div className="p-4 border-b border-gray-800 font-semibold flex items-center gap-2 text-indigo-400">
        <Icons.Rocket size={18} />
        <span>النشر والتصدير</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Target Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">منصة النشر (Deploy Target)</label>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => setDeployTarget('netlify')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                deployTarget === 'netlify' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-cyan-400"><Icons.CloudUpload size={16} /></div>
              <div>
                <div className="text-sm font-bold">Netlify</div>
                <div className="text-[10px] opacity-70">استضافة ثابتة سريعة</div>
              </div>
            </button>

            <button 
              onClick={() => setDeployTarget('vercel')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                deployTarget === 'vercel' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-white"><Icons.Zap size={16} /></div>
              <div>
                <div className="text-sm font-bold">Vercel</div>
                <div className="text-[10px] opacity-70">الأمثل لـ React/Static</div>
              </div>
            </button>

            <button 
              onClick={() => setDeployTarget('github')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                deployTarget === 'github' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-gray-200"><Icons.Github size={16} /></div>
              <div>
                <div className="text-sm font-bold">GitHub Pages</div>
                <div className="text-[10px] opacity-70">استضافة مجانية للمستودعات</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-gray-900 p-3 rounded-md border border-gray-800 text-xs text-gray-400 leading-relaxed">
          قم بتجهيز الملفات بإضافة ملفات التكوين (Config) المناسبة للمنصة المختارة، ثم حمل المشروع لرفعه يدوياً أو عبر Git.
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
            <button
            onClick={handlePrepare}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors border border-gray-700"
            >
            <Icons.File size={16} />
            تجهيز ملفات الإعدادات
            </button>

            <button
            onClick={handleDownload}
            disabled={currentFiles.length === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
            >
            <Icons.Download size={16} />
            تحميل حزمة النشر (ZIP)
            </button>
        </div>

      </div>
    </div>
  );
};