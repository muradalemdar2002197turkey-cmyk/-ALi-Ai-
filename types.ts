import { Type } from "@google/genai";

export enum FileType {
  HTML = 'html',
  CSS = 'css',
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JSON = 'json',
  MARKDOWN = 'markdown',
  OTHER = 'other'
}

export interface ProjectFile {
  name: string;
  content: string;
  language: FileType;
}

export interface SavedProject {
  id: string;
  name: string;
  lastModified: number;
  files: ProjectFile[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 data URL for display
  timestamp: number;
  isError?: boolean;
  groundingMetadata?: {
    webSources: { uri: string; title: string }[];
  };
}

export enum ViewMode {
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
  BOTH = 'BOTH'
}

export interface LogEntry {
  type: 'log' | 'error' | 'warn' | 'info';
  message: string;
  timestamp: number;
}

// Git Types
export type GitStatusType = 'modified' | 'added' | 'deleted' | 'unmodified';

export interface GitFileStatus {
  fileName: string;
  status: GitStatusType;
}

export interface GitCommit {
  id: string;
  message: string;
  author: string;
  timestamp: number;
  filesSnapshot: ProjectFile[]; // Snapshot of files at this commit
  parent: string | null;
}

export interface GitRepo {
  isInitialized: boolean;
  commits: GitCommit[];
  stagedFiles: string[]; // List of file names
  branch: string;
}

// Gemini Response Schema Types
export const FileSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "File name with extension (e.g., index.html)" },
    content: { type: Type.STRING, description: "Full source code content" },
    language: { type: Type.STRING, description: "Language identifier (html, css, javascript, python, etc.)" }
  },
  required: ["name", "content", "language"]
};

export const ProjectResponseSchema = {
  type: Type.OBJECT,
  properties: {
    explanation: { type: Type.STRING, description: "Brief explanation of what was built" },
    files: {
      type: Type.ARRAY,
      items: FileSchema,
      description: "List of files to generate"
    }
  },
  required: ["files"]
};