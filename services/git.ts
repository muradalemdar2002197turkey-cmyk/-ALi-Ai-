import { GitRepo, GitCommit, GitFileStatus, ProjectFile } from '../types';

export const createInitialRepo = (): GitRepo => {
  return {
    isInitialized: true,
    commits: [],
    stagedFiles: [],
    branch: 'main'
  };
};

export const computeStatus = (currentFiles: ProjectFile[], repo: GitRepo): GitFileStatus[] => {
  const headCommit = repo.commits.length > 0 ? repo.commits[0] : null;
  const headFiles = headCommit ? headCommit.filesSnapshot : [];
  
  const statusList: GitFileStatus[] = [];

  // Check for Modified and Added
  currentFiles.forEach(file => {
    const headFile = headFiles.find(hf => hf.name === file.name);
    if (!headFile) {
      statusList.push({ fileName: file.name, status: 'added' });
    } else if (headFile.content !== file.content) {
      statusList.push({ fileName: file.name, status: 'modified' });
    }
  });

  // Check for Deleted
  headFiles.forEach(headFile => {
    const currentFile = currentFiles.find(f => f.name === headFile.name);
    if (!currentFile) {
      statusList.push({ fileName: headFile.name, status: 'deleted' });
    }
  });

  return statusList;
};

export const commitChanges = (
  repo: GitRepo, 
  currentFiles: ProjectFile[], 
  message: string, 
  author: string = 'User'
): GitRepo => {
  if (repo.stagedFiles.length === 0) {
    throw new Error("No files staged for commit");
  }

  const headCommit = repo.commits.length > 0 ? repo.commits[0] : null;
  const headFiles = headCommit ? headCommit.filesSnapshot : [];

  // Create new snapshot based on staged files
  // Start with HEAD files
  let newSnapshot = [...headFiles];

  repo.stagedFiles.forEach(stagedFileName => {
    const currentFile = currentFiles.find(f => f.name === stagedFileName);
    
    // Remove old version if exists
    newSnapshot = newSnapshot.filter(f => f.name !== stagedFileName);
    
    // Add new version if it exists in current (it might be a delete operation if not found)
    if (currentFile) {
      newSnapshot.push(currentFile);
    }
  });

  const newCommit: GitCommit = {
    id: generateShortId(),
    message,
    author,
    timestamp: Date.now(),
    filesSnapshot: newSnapshot,
    parent: headCommit ? headCommit.id : null
  };

  return {
    ...repo,
    commits: [newCommit, ...repo.commits],
    stagedFiles: [] // Clear staged after commit
  };
};

const generateShortId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};