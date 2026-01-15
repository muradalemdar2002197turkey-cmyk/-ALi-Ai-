
import { GoogleGenAI } from "@google/genai";
import { ProjectFile } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamProjectGen = async function* (
  prompt: string, 
  currentFiles: ProjectFile[], // Context of current files with content
  useSearch: boolean,
  media?: { mimeType: string; data: string }
) {
  const modelName = 'gemini-3-pro-preview';
  
  // Helper to identify binary assets to avoid dumping large base64 strings into context
  const isBinaryAsset = (name: string) => /\.(png|jpg|jpeg|gif|webp|mp3|wav|ogg|mp4|webm|pdf)$/i.test(name);

  // Format current files for context so the AI can edit them
  const filesContext = currentFiles.length > 0 
    ? `
      THE USER HAS AN EXISTING PROJECT. YOU MUST EDIT OR ADD TO THESE FILES.
      DO NOT DELETE EXISTING LOGIC UNLESS REQUESTED.
      
      CURRENT FILES:
      ${currentFiles.map(f => `
      --- START OF FILE: ${f.name} ---
      ${isBinaryAsset(f.name) ? '[Binary Data Asset Available]' : f.content}
      --- END OF FILE: ${f.name} ---
      `).join('\n')}
      ` 
    : "This is a new project.";

  const systemInstruction = `
    You are </ALi><Ai> (المطور الذكي), an expert full-stack developer.
    Your goal is to build, edit, and enhance applications/games step-by-step.
    
    LANGUAGE:
    - Respond in Arabic (اللغة العربية) for the explanation.
    
    RESPONSE FORMAT (STRICT):
    You must provide a response in two parts:
    1. **Explanation:** A step-by-step explanation of what you are building or changing.
    2. **Code Block:** A single JSON object wrapped in a markdown code block containing the file updates.
    
    Example format:
    
    سأقوم الآن بإنشاء لعبة الثعبان...
    1. سأقوم بإنشاء ملف HTML...
    2. سأضيف التنسيقات...
    
    \`\`\`json
    {
      "files": [
        { "name": "index.html", "content": "...", "language": "html" },
        { "name": "style.css", "content": "...", "language": "css" }
      ]
    }
    \`\`\`

    RULES:
    1. Support ANY language (Python, JS, C++, etc.).
    2. For Web Apps: 
       - Default to separating concerns (index.html, style.css, script.js) for better maintainability.
       - HOWEVER, if the user explicitly asks for a single file (e.g., "HTML مدمج", "single file"), you MUST merge everything into one index.html file containing <style> and <script> tags.
    3. **EDITING:** If the user asks to change something (e.g., "Make the button red"), return the FULL updated content of the affected file(s).
    4. **Web Search:** If enabled, use it to find modern libraries or solutions and mention them in the explanation.
    5. **Assets:** If the user uploaded a file (image, audio, video), it is now available in the project files (see CURRENT FILES). You can reference it in your code using its filename (e.g., <img src="myimage.png"> or <audio src="song.mp3">).
    6. **Images/Vision:** If the user provides an image for design, analyze it to understand the UI, colors, and layout, then replicate it in code.
    7. **DATABASES:** If the user asks for a database:
       - **Internal SQL:** Use \`alasql\` (via CDN: https://cdn.jsdelivr.net/npm/alasql@4.0.0/dist/alasql.min.js) for browser-based SQL. It is easier than WASM. Create a \`db.js\` wrapper.
       - **Internal NoSQL:** Use \`Dexie.js\` (IndexedDB wrapper) or \`localStorage\` for simple needs.
       - **External:** Use Firebase (via CDN) or Supabase (@supabase/supabase-js via CDN). Provide placeholder API keys and instruct the user where to find them.
       - Always create a helper file (e.g., \`database.js\`) to manage the connection and CRUD operations.
    8. **DEPLOYMENT:** If the user asks to prepare for deployment:
       - **Netlify:** Create a \`netlify.toml\` file. Typically set command="" and publish="." (or current dir).
       - **Vercel:** Create a \`vercel.json\` file.
       - **GitHub Pages:** Ensure \`index.html\` is in the root.
       - **General:** Check if \`index.html\` links relative assets correctly (remove leading slash if needed for sub-path deployment).
    9. The JSON structure must match: { "files": [ { "name": "...", "content": "...", "language": "..." } ] }
    
    ${filesContext}
  `;

  const tools = useSearch ? [{ googleSearch: {} }] : [];

  // Construct content with media if present
  const contentParts: any[] = [{ text: prompt }];
  if (media) {
    contentParts.push({ inlineData: media });
  }

  try {
    const responseStream = await ai.models.generateContentStream({
      model: modelName,
      contents: [{ role: 'user', parts: contentParts }],
      config: {
        systemInstruction: systemInstruction,
        tools: tools,
      }
    });

    for await (const chunk of responseStream) {
       yield chunk;
    }

  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    throw error;
  }
};
