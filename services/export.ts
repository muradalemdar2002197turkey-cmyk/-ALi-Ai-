import JSZip from 'jszip';
import { ProjectFile } from '../types';

export const exportProjectAsZip = async (files: ProjectFile[]) => {
  if (files.length === 0) return;

  const zip = new JSZip();

  files.forEach((file) => {
    // Remove any leading slashes to ensure relative paths in zip
    const fileName = file.name.replace(/^\/+/, '');
    zip.file(fileName, file.content);
  });

  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnibuilder-project-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to generate zip", error);
    throw error;
  }
};

export const generateSingleHtml = (files: ProjectFile[]): string | null => {
  const htmlFile = files.find(f => f.name.endsWith('.html'));
  if (!htmlFile) return null;

  let htmlContent = htmlFile.content;

  // Helper to escape filename for regex
  const escapeRegExp = (string: string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  // Embed CSS
  const cssFiles = files.filter(f => f.name.endsWith('.css'));
  let cssStyles = "";
  cssFiles.forEach(f => {
     cssStyles += `\n/* --- ${f.name} --- */\n${f.content}\n`;
     // Remove link tag
     const regex = new RegExp(`<link\\s+[^>]*href=["']${escapeRegExp(f.name)}["'][^>]*>`, 'gi');
     htmlContent = htmlContent.replace(regex, '');
  });
  
  if (cssStyles) {
      const styleTag = `<style>${cssStyles}</style>`;
      if (htmlContent.includes('</head>')) {
          htmlContent = htmlContent.replace('</head>', `${styleTag}\n</head>`);
      } else {
          // If no head, prepend to body or just start
          htmlContent = styleTag + htmlContent;
      }
  }

  // Embed JS
  const jsFiles = files.filter(f => f.name.endsWith('.js'));
  let jsScripts = "";
  jsFiles.forEach(f => {
      jsScripts += `\n/* --- ${f.name} --- */\n${f.content}\n`;
      // Remove script tag (assuming it has src)
      const regex = new RegExp(`<script\\s+[^>]*src=["']${escapeRegExp(f.name)}["'][^>]*>\\s*<\\/script>`, 'gi');
      htmlContent = htmlContent.replace(regex, '');
  });

  if (jsScripts) {
      const scriptTag = `<script>${jsScripts}</script>`;
      if (htmlContent.includes('</body>')) {
          htmlContent = htmlContent.replace('</body>', `${scriptTag}\n</body>`);
      } else {
          htmlContent += scriptTag;
      }
  }

  return htmlContent;
};