import { ProjectFile, SavedProject } from "../types";

const STORAGE_KEY = "omnibuilder_projects";

export const getSavedProjects = (): SavedProject[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load projects from storage", error);
    return [];
  }
};

export const saveProjectToStorage = (name: string, files: ProjectFile[]): SavedProject => {
  const projects = getSavedProjects();
  
  const newProject: SavedProject = {
    id: Date.now().toString(),
    name,
    lastModified: Date.now(),
    files
  };

  // Check if a project with the same name exists, update it if so, otherwise add new
  const existingIndex = projects.findIndex(p => p.name === name);
  if (existingIndex >= 0) {
    projects[existingIndex] = { ...newProject, id: projects[existingIndex].id }; // Keep original ID if updating by name
  } else {
    projects.push(newProject);
  }

  // Sort by newest first
  projects.sort((a, b) => b.lastModified - a.lastModified);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return newProject;
};

export const deleteProjectFromStorage = (id: string): SavedProject[] => {
  const projects = getSavedProjects().filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  return projects;
};

export const loadProjectFromStorage = (id: string): SavedProject | undefined => {
  const projects = getSavedProjects();
  return projects.find(p => p.id === id);
};