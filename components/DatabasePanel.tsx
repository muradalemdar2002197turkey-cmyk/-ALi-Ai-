import React, { useState } from 'react';
import { Icons } from './Icon';

interface DatabasePanelProps {
  onGenerate: (prompt: string) => void;
}

export const DatabasePanel: React.FC<DatabasePanelProps> = ({ onGenerate }) => {
  const [dbType, setDbType] = useState<'internal-sql' | 'internal-nosql' | 'firebase' | 'supabase'>('internal-sql');
  const [description, setDescription] = useState('');

  const handleBuild = () => {
    if (!description.trim()) return;

    let techPrompt = "";
    switch (dbType) {
      case 'internal-sql':
        techPrompt = "Use AlaSQL (in-browser SQL).";
        break;
      case 'internal-nosql':
        techPrompt = "Use Dexie.js (IndexedDB wrapper).";
        break;
      case 'firebase':
        techPrompt = "Use Firebase Firestore (CDN). setup with dummy keys.";
        break;
      case 'supabase':
        techPrompt = "Use Supabase (CDN). setup with dummy keys.";
        break;
    }

    const fullPrompt = `Create a database structure for a web application.
    Technology: ${techPrompt}
    Requirements: ${description}
    
    Please create a separate 'database.js' (or similar) file that handles initialization and provides helper functions (CRUD) for these data requirements. Also update 'index.html' to include necessary CDNs and 'app.js' to demonstrate usage.`;

    onGenerate(fullPrompt);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      <div className="p-4 border-b border-gray-800 font-semibold flex items-center gap-2 text-indigo-400">
        <Icons.Database size={18} />
        <span>بناء قاعدة البيانات</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Database Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">نوع قاعدة البيانات</label>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => setDbType('internal-sql')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                dbType === 'internal-sql' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-blue-400"><Icons.Database size={16} /></div>
              <div>
                <div className="text-sm font-bold">SQL داخلية</div>
                <div className="text-[10px] opacity-70">AlaSQL (في المتصفح)</div>
              </div>
            </button>

            <button 
              onClick={() => setDbType('internal-nosql')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                dbType === 'internal-nosql' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-green-400"><Icons.HardDrive size={16} /></div>
              <div>
                <div className="text-sm font-bold">NoSQL داخلية</div>
                <div className="text-[10px] opacity-70">IndexedDB (Dexie.js)</div>
              </div>
            </button>

            <button 
              onClick={() => setDbType('firebase')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                dbType === 'firebase' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-orange-400"><Icons.Server size={16} /></div>
              <div>
                <div className="text-sm font-bold">Firebase</div>
                <div className="text-[10px] opacity-70">سحابية (Google)</div>
              </div>
            </button>

             <button 
              onClick={() => setDbType('supabase')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                dbType === 'supabase' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-emerald-400"><Icons.Server size={16} /></div>
              <div>
                <div className="text-sm font-bold">Supabase</div>
                <div className="text-[10px] opacity-70">SQL سحابية (Postgres)</div>
              </div>
            </button>
          </div>
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">هيكل البيانات</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="صف الجداول والحقول المطلوبة. مثال: جدول المستخدمين (الاسم، البريد)، جدول المهام (العنوان، الحالة)..."
            className="w-full h-32 bg-gray-900 border border-gray-700 rounded-md p-3 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleBuild}
          disabled={!description.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
        >
          <Icons.Code size={16} />
          توليد كود القاعدة
        </button>

        <div className="text-[10px] text-gray-600 text-center leading-relaxed">
           سيقوم المطور الذكي بإنشاء ملفات الربط والتهيئة وإضافة المكتبات اللازمة تلقائياً.
        </div>
      </div>
    </div>
  );
};