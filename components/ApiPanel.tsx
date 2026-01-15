import React, { useState } from 'react';
import { Icons } from './Icon';

interface ApiPanelProps {
  onGenerate: (prompt: string) => void;
}

export const ApiPanel: React.FC<ApiPanelProps> = ({ onGenerate }) => {
  const [techStack, setTechStack] = useState<'express' | 'python' | 'nextjs'>('express');
  const [endpoints, setEndpoints] = useState('');

  const handleGenerate = () => {
    if (!endpoints.trim()) return;

    let prompt = "";
    
    switch (techStack) {
      case 'express':
        prompt = `قم بإنشاء backend API لهذا المشروع باستخدام Node.js و Express.
        1. أنشئ ملف 'server.js' يحتوي على الإعدادات الأساسية وتشغيل السيرفر.
        2. قم بتضمين مكتبات cors و body-parser.
        3. قم بإنشاء الـ Endpoints التالية:
        ${endpoints}
        4. تأكد من كتابة كود نظيف ومعلق عليه.`;
        break;
      case 'python':
        prompt = `قم بإنشاء backend API لهذا المشروع باستخدام Python و مكتبة Flask.
        1. أنشئ ملف 'app.py' يحتوي على إعدادات Flask الأساسية.
        2. قم بتضمين مكتبة flask-cors.
        3. قم بإنشاء الـ Routes التالية:
        ${endpoints}
        4. أضف ملف requirements.txt يحتوي على المكتبات المطلوبة.`;
        break;
      case 'nextjs':
        prompt = `قم بإنشاء Serverless Functions لهذا المشروع لتعمل كـ API (نمط Next.js/Vercel).
        1. أنشئ مجلد 'api' إذا لم يكن موجوداً.
        2. داخل مجلد 'api'، قم بإنشاء ملفات منفصلة لكل وظيفة مطلوبة بناءً على الوصف التالي:
        ${endpoints}
        3. تأكد من تصدير دالة handler بشكل صحيح (req, res).`;
        break;
    }

    onGenerate(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      <div className="p-4 border-b border-gray-800 font-semibold flex items-center gap-2 text-indigo-400">
        <Icons.Network size={18} />
        <span>مولد الـ API</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Tech Stack Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">نوع الخادم (Tech Stack)</label>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => setTechStack('express')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                techStack === 'express' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-green-500"><Icons.Server size={16} /></div>
              <div>
                <div className="text-sm font-bold">Node.js Express</div>
                <div className="text-[10px] opacity-70">المعيار الذهبي لـ Web APIs</div>
              </div>
            </button>

            <button 
              onClick={() => setTechStack('python')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                techStack === 'python' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-yellow-500"><Icons.Code size={16} /></div>
              <div>
                <div className="text-sm font-bold">Python Flask</div>
                <div className="text-[10px] opacity-70">سهل وسريع وقوي</div>
              </div>
            </button>

            <button 
              onClick={() => setTechStack('nextjs')}
              className={`flex items-center gap-3 p-3 rounded-lg border text-start transition-all ${
                techStack === 'nextjs' 
                ? 'bg-indigo-900/40 border-indigo-500 text-white' 
                : 'bg-gray-900 border-gray-800 text-gray-400 hover:border-gray-700'
              }`}
            >
              <div className="p-2 bg-gray-800 rounded text-white"><Icons.Zap size={16} /></div>
              <div>
                <div className="text-sm font-bold">Serverless Functions</div>
                <div className="text-[10px] opacity-70">Vercel / Next.js API Routes</div>
              </div>
            </button>
          </div>
        </div>

        {/* Endpoints Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">وصف الـ Endpoints</label>
          <div className="bg-gray-900/50 p-2 rounded text-[10px] text-gray-500 mb-1">
            مثال: أريد Endpoint لجلب قائمة المستخدمين (GET /users) وآخر لتسجيل الدخول (POST /login) يستقبل بريداً وكلمة مرور.
          </div>
          <textarea
            value={endpoints}
            onChange={(e) => setEndpoints(e.target.value)}
            placeholder="اكتب هنا الوظائف التي تريد أن يقوم بها الـ API..."
            className="w-full h-40 bg-gray-900 border border-gray-700 rounded-md p-3 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none resize-none font-mono"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleGenerate}
          disabled={!endpoints.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-900/20"
        >
          <Icons.Code size={16} />
          توليد ملفات الـ API
        </button>

        <div className="text-[10px] text-gray-600 text-center leading-relaxed">
           ملاحظة: سيتم إنشاء ملفات السيرفر كملفات نصية. لا يمكن تشغيل سيرفر Node/Python حقيقي داخل المتصفح، لكن يمكنك تحميل الملفات وتشغيلها محلياً.
        </div>
      </div>
    </div>
  );
};