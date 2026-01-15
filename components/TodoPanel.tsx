import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export const TodoPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Load tasks from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('omnibuilder_todos');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse todos", e);
      }
    }
  }, []);

  // Save tasks to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('omnibuilder_todos', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task: Task = {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
    };
    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const startEditing = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = () => {
    if (editingId) {
      setTasks(tasks.map(t => t.id === editingId ? { ...t, text: editText } : t));
      setEditingId(null);
      setEditText('');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const progress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 w-64 border-e border-gray-800">
      <div className="p-4 border-b border-gray-800 font-semibold flex items-center gap-2 text-indigo-400">
        <Icons.ListTodo size={18} />
        <span>قائمة المهام</span>
      </div>

      <div className="p-4 flex-1 overflow-hidden flex flex-col">
        
        {/* Progress Bar */}
        {tasks.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>الإنجاز</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Add Task Input */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, addTask)}
            placeholder="أضف مهمة جديدة..."
            className="flex-1 bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:border-indigo-500 focus:outline-none placeholder-gray-600"
          />
          <button
            onClick={addTask}
            disabled={!newTask.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded transition-colors"
          >
            <Icons.Plus size={16} />
          </button>
        </div>

        {/* Tasks List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
          {tasks.length === 0 ? (
            <div className="text-center text-gray-600 text-xs mt-10 italic">
              لا توجد مهام.<br/>قم بإضافة خططك هنا!
            </div>
          ) : (
            tasks.map(task => (
              <div 
                key={task.id} 
                className={`group flex items-center gap-2 p-2 rounded-lg border transition-all ${
                  task.completed 
                    ? 'bg-gray-900/30 border-gray-800/50 opacity-70' 
                    : 'bg-gray-900 border-gray-800 hover:border-indigo-500/30'
                }`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    task.completed 
                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                      : 'border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  {task.completed && <Icons.Success size={12} className="text-white" />}
                </button>

                {editingId === task.id ? (
                  <div className="flex-1 flex gap-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, saveEdit)}
                      autoFocus
                      className="flex-1 bg-gray-950 border border-gray-600 rounded px-2 py-0.5 text-sm focus:outline-none"
                    />
                    <button onClick={saveEdit} className="text-green-400 hover:text-green-300"><Icons.Success size={14} /></button>
                    <button onClick={cancelEdit} className="text-red-400 hover:text-red-300"><Icons.Close size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span 
                      className={`flex-1 text-sm break-all ${
                        task.completed ? 'line-through text-gray-500' : 'text-gray-300'
                      }`}
                      onDoubleClick={() => startEditing(task)}
                    >
                      {task.text}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => startEditing(task)}
                        className="p-1 text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        <Icons.Edit size={14} />
                      </button>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Icons.Trash size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};