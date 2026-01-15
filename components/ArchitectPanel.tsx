import React, { useState } from 'react';
import { Icons } from './Icon';

interface ArchitectPanelProps {
  onGenerate: (prompt: string) => void;
}

export const ArchitectPanel: React.FC<ArchitectPanelProps> = ({ onGenerate }) => {
  const [platformType, setPlatformType] = useState('lms');
  const [dbStrategy, setDbStrategy] = useState('supabase');
  const [features, setFeatures] = useState('');

  const handleArchitectBuild = () => {
    let typeDesc = "";
    if (platformType === 'lms') typeDesc = "منصة تعليمية (LMS) شاملة للمعلمين والطلاب";
    else if (platformType === 'ecommerce') typeDesc = "متجر إلكتروني متكامل مع سلة تسوق وإدارة منتجات";
    else if (platformType === 'dashboard') typeDesc = "لوحة تحكم إدارية (Admin Dashboard) مع رسوم بيانية وتقارير";
    else if (platformType === 'social') typeDesc = "شبكة تواصل اجتماعي مصغرة مع ملفات شخصية ومنشورات";

    let dbDesc = "";
    if (dbStrategy === 'supabase') dbDesc = "استخدم Supabase (PostgreSQL) كقاعدة بيانات ومصادقة (Auth).";
    else if (dbStrategy === 'firebase') dbDesc = "استخدم Firebase (Firestore + Auth).";
    else if (dbStrategy === 'local-sql') dbDesc = "استخدم AlaSQL لمحاكاة قاعدة بيانات SQL علائقية داخل المتصفح.";

    const prompt = `
    تصرف كمهندس برمجيات خبير (Senior System Architect). المطلوب بناء نظام ضخم ومتكامل.
    
    المشروع: ${typeDesc}
    قاعدة البيانات: ${dbDesc}
    الميزات الإضافية المطلوبة: ${features}

    التعليمات الخاصة (Strict Requirements):
    1. **هيكلية الملفات**: يجب تقسيم المشروع إلى ملفات متعددة ومنظمة جداً (Modular Architecture). لا تضع كل شيء في ملف واحد.
       - index.html (الواجهة الرئيسية)
       - auth.js (إدارة تسجيل الدخول والمستخدمين)
       - database.js (إدارة الاتصال بقاعدة البيانات والعمليات CRUD)
       - app.js (المنطق الرئيسي)
       - styles.css (تنسيق احترافي جداً ومودرن)
       - admin.html / dashboard.html (لوحات تحكم إذا لزم الأمر)

    2. **ربط قاعدة البيانات**: 
       - يجب أن يكون ملف database.js مربوطاً فعلياً بملفات الواجهة.
       - إذا اخترت Supabase/Firebase، ضع إعدادات وهمية (Placeholders) واشرح للمستخدم أين يضع مفاتيحه.
       - يجب أن تعمل وظائف الإضافة والتعديل والقراءة والحذف (CRUD) بشكل كامل في الكود.

    3. **الجودة**:
       - استخدم UI/UX حديث (Tailwind CSS أو CSS مخصص قوي).
       - التعامل مع الأخطاء (Error Handling).
       - تأكد من أن النظام يبدو وكأنه تطبيق حقيقي جاهز للإنتاج.

    ابدأ البناء الآن.
    `;

    onGenerate(prompt);
  };

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      <div className="p-4 border-b border-gray-800 font-semibold flex items-center gap-2 text-indigo-400">
        <Icons.Architect size={18} />
        <span>مهندس الأنظمة</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">نوع النظام الضخم</label>
          <select 
            value={platformType}
            onChange={(e) => setPlatformType(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-md p-2 text-sm focus:border-indigo-500 outline-none"
          >
            <option value="lms">🎓 منصة تعليمية (LMS)</option>
            <option value="ecommerce">🛒 متجر إلكتروني ضخم</option>
            <option value="dashboard">📊 لوحة تحكم وإدارة (ERP)</option>
            <option value="social">👥 شبكة تواصل اجتماعي</option>
          </select>
        </div>

        {/* Database Strategy */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">ربط قاعدة البيانات</label>
          <div className="grid grid-cols-1 gap-2">
            <button 
              onClick={() => setDbStrategy('supabase')}
              className={`flex items-center gap-2 p-2 rounded border text-start transition-all ${dbStrategy === 'supabase' ? 'bg-indigo-900/40 border-indigo-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
            >
              <Icons.Database size={14} className="text-emerald-400" />
              <span className="text-sm font-bold">Supabase (SQL + Auth)</span>
            </button>
            <button 
              onClick={() => setDbStrategy('firebase')}
              className={`flex items-center gap-2 p-2 rounded border text-start transition-all ${dbStrategy === 'firebase' ? 'bg-indigo-900/40 border-indigo-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
            >
              <Icons.Server size={14} className="text-orange-400" />
              <span className="text-sm font-bold">Firebase (NoSQL)</span>
            </button>
            <button 
              onClick={() => setDbStrategy('local-sql')}
              className={`flex items-center gap-2 p-2 rounded border text-start transition-all ${dbStrategy === 'local-sql' ? 'bg-indigo-900/40 border-indigo-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-400'}`}
            >
              <Icons.HardDrive size={14} className="text-blue-400" />
              <span className="text-sm font-bold">Local SQL (AlaSQL)</span>
            </button>
          </div>
        </div>

        {/* Custom Requirements */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-500 uppercase">تفاصيل وميزات إضافية</label>
          <textarea
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
            placeholder="مثال: نظام اختبارات للطلاب، دفع إلكتروني، صلاحيات مستخدمين متعددة..."
            className="w-full h-32 bg-gray-900 border border-gray-700 rounded-md p-3 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none resize-none"
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleArchitectBuild}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20"
        >
          <Icons.Architect size={18} />
          بناء النظام الكامل
        </button>

        <div className="text-[10px] text-gray-500 bg-gray-900 p-2 rounded border border-gray-800">
           <span className="text-indigo-400 font-bold">ملاحظة:</span> سيقوم هذا الوضع بإنشاء عدد كبير من الملفات المترابطة (Front-end + Backend Logic + Database). قد يستغرق التوليد وقتاً أطول قليلاً.
        </div>
      </div>
    </div>
  );
};