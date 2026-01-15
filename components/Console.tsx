import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';
import { Icons } from './Icon';

interface ConsoleProps {
  logs: LogEntry[];
  onClear: () => void;
  onClose: () => void;
}

export const Console: React.FC<ConsoleProps> = ({ logs, onClear, onClose }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-[#0d1117] border-t border-gray-800 text-sm font-mono">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800 select-none">
        <div className="flex items-center gap-2 text-gray-300">
          <Icons.Bug size={14} className="text-orange-400" />
          <span className="font-semibold text-xs">وحدة التحكم (Console)</span>
          <span className="bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">{logs.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="p-1 text-gray-400 hover:text-white transition-colors" title="مسح">
            <Icons.Trash size={14} />
          </button>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-colors" title="إغلاق">
            <Icons.Close size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {logs.length === 0 ? (
          <div className="text-gray-600 text-center mt-4 italic text-xs">
            لا توجد سجلات. تفاعل مع المعاينة لرؤية المخرجات.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className={`flex gap-2 py-1 px-2 rounded hover:bg-white/5 border-b border-gray-800/50 ${
              log.type === 'error' ? 'text-red-400 bg-red-900/10' : 
              log.type === 'warn' ? 'text-yellow-400 bg-yellow-900/10' : 
              'text-gray-300'
            }`}>
              <span className="text-gray-600 shrink-0 text-[10px] pt-0.5 w-16 text-right" dir="ltr">
                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className={`break-all ${log.type === 'info' ? 'text-blue-400' : ''}`} dir="ltr">
                {log.type === 'error' && <Icons.Error size={12} className="inline mr-1 mb-0.5" />}
                {log.message}
              </span>
            </div>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
};