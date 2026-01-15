import React from 'react';
import { Icons } from './Icon';
import { ProjectFile } from '../types';

interface AuditPanelProps {
  files: ProjectFile[];
  onGenerate: (prompt: string) => void;
}

export const AuditPanel: React.FC<AuditPanelProps> = ({ files, onGenerate }) => {
  
  const handleAudit = (type: 'security' | 'performance' | 'best-practices') => {
    if (files.length === 0) return;

    let prompt = "";
    switch(type) {
      case 'security':
        prompt = `قم بإجراء تدقيق أمني شامل (Security Audit) على ملفات المشروع الحالية.
        1. ابحث عن ثغرات XSS, Injection, أو مشاكل في التعامل مع البيانات الحساسة.
        2. إذا وجدت مشاكل، قم بإصلاح الكود مباشرة في ردك (أعد كتابة الملفات المصابة).
        3. أضف تعليقات تشرح الإصلاح الأمني.`;
        break;
      case 'performance':
        prompt = `قم بتحليل أداء (Performance Check) الكود الحالي.
        1. ابحث عن حلقات تكرار غير ضرورية، عمليات DOM مكلفة، أو استخدام غير فعال للذاكرة.
        2. اقترح تحسينات أو أعد كتابة الدوال لتكون أسرع.
        3. إذا كان المشروع ويب، تأكد من تحسين تحميل الصور والمكتبات.`;
        break;
      case 'best-practices':
        prompt = `قم بمراجعة الكود لتحسين الجودة (Refactoring & Best Practices).
        1. تأكد من تسمية المتغيرات بشكل صحيح، تقسيم الكود إلى دوال صغيرة، وإزالة الكود الميت.
        2. قم بإعادة كتابة الملفات لتكون أكثر نظافة وقابلية للقراءة (Clean Code).
        3. أضف تعليقات توضيحية (Documentation) للدوال الرئيسية.`;
        break;
    }

    onGenerate(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      <div className="p-4 border-b border-gray-800 font-semibold flex items-center gap-2 text-indigo-400">
        <Icons.Audit size={18} />
        <span>المدقق الذكي</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded-lg">
          <h3 className="text-sm font-bold text-indigo-300 mb-1">حالة المشروع</h3>
          <div className="text-xs text-gray-400">
             عدد الملفات: {files.length}<br/>
             اللغات: {Array.from(new Set(files.map(f => f.language))).join(', ')}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase">أدوات الفحص</label>
          
          <button 
            onClick={() => handleAudit('security')}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-red-500/50 hover:bg-red-900/10 transition-all group"
          >
            <div className="p-2 bg-gray-800 rounded text-red-500 group-hover:text-red-400"><Icons.Audit size={16} /></div>
            <div className="text-start">
              <div className="text-sm font-bold group-hover:text-red-300">فحص أمني</div>
              <div className="text-[10px] opacity-70">كشف الثغرات والمخاطر</div>
            </div>
          </button>

          <button 
            onClick={() => handleAudit('performance')}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-yellow-500/50 hover:bg-yellow-900/10 transition-all group"
          >
            <div className="p-2 bg-gray-800 rounded text-yellow-500 group-hover:text-yellow-400"><Icons.Zap size={16} /></div>
            <div className="text-start">
              <div className="text-sm font-bold group-hover:text-yellow-300">تحليل الأداء</div>
              <div className="text-[10px] opacity-70">تسريع وتحسين الكفاءة</div>
            </div>
          </button>

          <button 
            onClick={() => handleAudit('best-practices')}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-900 border border-gray-800 hover:border-green-500/50 hover:bg-green-900/10 transition-all group"
          >
            <div className="p-2 bg-gray-800 rounded text-green-500 group-hover:text-green-400"><Icons.Code size={16} /></div>
            <div className="text-start">
              <div className="text-sm font-bold group-hover:text-green-300">جودة الكود</div>
              <div className="text-[10px] opacity-70">تنظيف وترتيب وتوثيق</div>
            </div>
          </button>
        </div>

        <div className="text-[10px] text-gray-600 text-center leading-relaxed mt-4">
           سيقوم الذكاء الاصطناعي بقراءة جميع الملفات الحالية واقتراح تعديلات مباشرة عليها. يرجى مراجعة التغييرات قبل اعتمادها.
        </div>
      </div>
    </div>
  );
};