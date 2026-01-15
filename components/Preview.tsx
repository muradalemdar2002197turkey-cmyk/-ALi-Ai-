import React, { useEffect, useState, useRef } from 'react';
import { ProjectFile, LogEntry } from '../types';
import { Icons } from './Icon';

interface PreviewProps {
  files: ProjectFile[];
  isDebugMode: boolean;
  isMobileView: boolean;
  onLog: (log: LogEntry) => void;
  refreshTrigger: number;
}

export const Preview: React.FC<PreviewProps> = ({ files, isDebugMode, isMobileView, onLog, refreshTrigger }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [key, setKey] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  // Determine if this is a web project we can actually preview
  const htmlFile = files.find(f => f.name.endsWith('.html'));
  const isWebProject = !!htmlFile;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'omnibuilder-preview') {
        onLog({
          type: event.data.type,
          message: event.data.message,
          timestamp: Date.now()
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLog]);

  useEffect(() => {
    if (!iframeRef.current || !isWebProject || !htmlFile) return;

    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => f.name.endsWith('.js'));

    let finalHtml = htmlFile.content;

    // Inject Assets (Images, Audio, Video)
    const assetExtensions = ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'mp3', 'wav', 'ogg', 'mp4', 'webm'];
    
    files.forEach(f => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (ext && assetExtensions.includes(ext)) {
        // Look up MIME type
        const mimeMap: Record<string, string> = {
            'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'gif': 'image/gif', 
            'svg': 'image/svg+xml', 'webp': 'image/webp',
            'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'ogg': 'audio/ogg',
            'mp4': 'video/mp4', 'webm': 'video/webm'
        };
        const mime = mimeMap[ext] || 'application/octet-stream';
        const dataUri = `data:${mime};base64,${f.content}`;
        
        // Global replace in html: src="filename.ext", href="filename.ext", url('filename.ext')
        // We use a simple replacement for filename appearing in quotes or url()
        // Escaping regex special chars in filename
        const escapedName = f.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // This regex attempts to match the filename inside quotes or parentheses
        const regex = new RegExp(escapedName, 'g');
        finalHtml = finalHtml.replace(regex, dataUri);
      }
    });

    // Inject CSS
    const styles = cssFiles.map(f => `<style>${f.content}</style>`).join('\n');
    finalHtml = finalHtml.replace('</head>', `${styles}</head>`);

    // Inject Debug & Console Capture Script
    const debugScript = `
      <script>
        (function() {
          // Mock User Agent if Mobile View
          if (${isMobileView}) {
             try {
               Object.defineProperty(navigator, 'userAgent', {
                 get: function() { return 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'; }
               });
               Object.defineProperty(navigator, 'platform', { get: function() { return 'iPhone'; } });
               Object.defineProperty(navigator, 'maxTouchPoints', { get: function() { return 5; } });
             } catch(e) {}
          }

          const sendLog = (type, args) => {
            try {
              const message = args.map(arg => {
                if (typeof arg === 'object') {
                  try {
                    return JSON.stringify(arg);
                  } catch(e) {
                    return String(arg);
                  }
                }
                return String(arg);
              }).join(' ');
              
              window.parent.postMessage({
                source: 'omnibuilder-preview',
                type: type,
                message: message
              }, '*');
            } catch (e) {
              // Fallback
            }
          };

          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          const originalInfo = console.info;

          console.log = function(...args) { originalLog.apply(console, args); sendLog('log', args); };
          console.error = function(...args) { originalError.apply(console, args); sendLog('error', args); };
          console.warn = function(...args) { originalWarn.apply(console, args); sendLog('warn', args); };
          console.info = function(...args) { originalInfo.apply(console, args); sendLog('info', args); };

          window.onerror = function(msg, url, line, col, error) {
            sendLog('error', [msg]);
            return false;
          };

          // Element Inspector
          document.addEventListener('click', function(e) {
            if (${isDebugMode}) {
              // e.preventDefault(); // Optional: prevent default action if inspecting
              const el = e.target;
              let info = el.tagName.toLowerCase();
              if (el.id) info += '#' + el.id;
              if (el.className) info += '.' + el.className.split(' ').join('.');
              
              console.info('Element clicked:', info);
              
              // Highlight effect
              const originalOutline = el.style.outline;
              el.style.outline = '2px solid #f97316';
              setTimeout(() => {
                el.style.outline = originalOutline;
              }, 1000);
            }
          }, true);

        })();
      </script>
    `;
    
    // Inject scripts after debug script
    const scripts = jsFiles.map(f => `
      <script>
        try {
          ${f.content}
        } catch(e) {
          console.error("Script Error in ${f.name}:", e);
        }
      </script>
    `).join('\n');

    finalHtml = finalHtml.replace('</body>', `${debugScript}${scripts}</body>`);

    const blob = new Blob([finalHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    iframeRef.current.src = url;

    return () => URL.revokeObjectURL(url);
  }, [files, htmlFile, isWebProject, key, isDebugMode, isMobileView, refreshTrigger]);

  const handleRefresh = () => {
    setKey(prev => prev + 1);
  };

  const handleShare = (platform: 'twitter' | 'linkedin' | 'copy' | 'newtab') => {
    const text = "Check out this amazing project I'm building with OmniBuilder AI!";
    const url = window.location.href; 

    switch (platform) {
        case 'twitter':
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'linkedin':
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
            break;
        case 'copy':
            navigator.clipboard.writeText(url).then(() => {
                 setCopied(true);
                 setTimeout(() => setCopied(false), 2000);
            });
            break;
        case 'newtab':
             if (iframeRef.current?.src) {
                 window.open(iframeRef.current.src, '_blank');
             }
             break;
    }
    if (platform !== 'copy') {
      setShowShareMenu(false);
    }
  };

  if (!isWebProject) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-100 text-gray-800 p-6 text-center">
        <Icons.Code size={48} className="text-gray-400 mb-4" />
        <h3 className="text-lg font-bold mb-2">مشروع غير ويبي</h3>
        <p className="text-sm max-w-md text-gray-600">
          هذا المشروع يحتوي على أكواد (مثل Python أو C++) لا يمكن تشغيلها مباشرة في المتصفح. 
          يرجى مراجعة الكود في المحرر أو تحميل الملفات لتشغيلها محلياً.
        </p>
      </div>
    );
  }

  // Combine internal key and external refreshTrigger to force re-render (reload iframe)
  const combinedKey = key + refreshTrigger;

  return (
    <div className={`h-full flex flex-col ${isMobileView ? 'bg-gray-200/80' : 'bg-white'}`}>
      <div className={`bg-gray-100 border-b border-gray-200 p-2 flex justify-between items-center ${isDebugMode ? 'border-b-2 border-orange-400' : ''}`}>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Icons.Globe size={14} />
          <span className="font-medium">معاينة حية</span>
          {isMobileView && <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Icons.Mobile size={10} /> جوال</span>}
          {isDebugMode && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full font-bold">وضع التصحيح (Debug Mode)</span>}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Share Button Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors flex items-center gap-1"
              title="مشاركة"
            >
              <Icons.Share size={16} />
            </button>
            
            {showShareMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowShareMenu(false)}
                />
                <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50 text-gray-700 animate-in fade-in zoom-in-95 duration-100">
                  <button onClick={() => handleShare('copy')} className="w-full text-start px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                    {copied ? <Icons.Success size={14} className="text-green-500" /> : <Icons.Link size={14} />}
                    {copied ? 'تم نسخ الرابط!' : 'نسخ رابط التطبيق'}
                  </button>
                  <button onClick={() => handleShare('twitter')} className="w-full text-start px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                    <Icons.Twitter size={14} />
                    مشاركة على X
                  </button>
                  <button onClick={() => handleShare('linkedin')} className="w-full text-start px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
                    <Icons.Linkedin size={14} />
                    مشاركة على LinkedIn
                  </button>
                  <div className="h-px bg-gray-100 my-1"></div>
                  <button onClick={() => handleShare('newtab')} className="w-full text-start px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 text-indigo-600 font-medium">
                    <Icons.ExternalLink size={14} />
                    فتح في تبويب جديد
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="w-px h-4 bg-gray-300 mx-1"></div>

          <button 
            onClick={handleRefresh}
            className="p-1.5 hover:bg-gray-200 rounded text-gray-600 transition-colors"
            title="تحديث المعاينة"
          >
            <Icons.Refresh size={16} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 w-full h-full relative overflow-auto flex items-center justify-center p-4">
        <div className={`transition-all duration-300 relative ${
          isMobileView 
            ? 'w-[375px] h-[667px] bg-white border-[10px] border-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden shrink-0' 
            : 'w-full h-full bg-white'
        }`}>
           {/* Mobile Notch Simulation */}
           {isMobileView && (
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20 pointer-events-none" />
           )}
           
           <iframe
            key={combinedKey}
            ref={iframeRef}
            title="App Preview"
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
          />
        </div>
      </div>
    </div>
  );
};