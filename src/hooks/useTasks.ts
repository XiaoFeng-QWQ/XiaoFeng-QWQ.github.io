import { useState, useEffect, type FormEvent } from 'react';
import type { Task } from '../types';

/**
 * 任务管理 Hook
 * 提供待办任务的增删改查功能，自动持久化到 localStorage
 */
export const useTasks = () => {
    const [tasks, setTasks] = useState<Task[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('workspace_tasks');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    console.error("Failed to load saved tasks", e);
                }
            }
        }
        return [
            { id: 1, text: 'Polishing macro transitions', done: true },
            { id: 2, text: 'Workspace assets hot-reload scan', done: false }
        ];
    });

    const [newTaskText, setNewTaskText] = useState('');

    // 持久化任务到 localStorage
    useEffect(() => {
        localStorage.setItem('workspace_tasks', JSON.stringify(tasks));
    }, [tasks]);

    // 切换任务完成状态
    const toggleTask = (id: number) => {
        setTasks(tasks.map((t) => t.id === id ? { ...t, done: !t.done } : t));
    };

    // 添加新任务
    const addTask = (e: FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: newTaskText.trim(), done: false }]);
        setNewTaskText('');
    };

    // 删除任务
    const deleteTask = (id: number, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setTasks(tasks.filter((t) => t.id !== id));
    };

    return {
        tasks,
        newTaskText,
        setNewTaskText,
        toggleTask,
        addTask,
        deleteTask
    };
};