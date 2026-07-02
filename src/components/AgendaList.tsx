import { type FormEvent } from 'react';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import type { Task } from '../types';

/**
 * 每日待办事项组件
 * 提供任务列表的展示和管理功能
 */
interface AgendaListProps {
    tasks: Task[];
    toggleTask: (id: number) => void;
    deleteTask: (id: number, e: React.MouseEvent) => void;
    addTask: (e: FormEvent) => void;
    newTaskText: string;
    setNewTaskText: (text: string) => void;
}

const AgendaList = ({ tasks, toggleTask, deleteTask, addTask, newTaskText, setNewTaskText }: AgendaListProps) => {
    return (
        <div className="flex flex-col justify-between p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 w-full min-h-44 select-none transition-all duration-700">
            <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium mb-3">Focus Agenda</span>
            <div className="space-y-2.5 my-auto max-h-32 overflow-y-auto">
                {tasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        className="flex items-center justify-between group/item cursor-pointer"
                    >
                        <div className="flex items-start gap-3">
                            {task.done ? (
                                <CheckCircle2 size={15} className="text-neutral-800 dark:text-neutral-200 mt-0.5 transition-colors shrink-0" />
                            ) : (
                                <Circle size={15} className="text-neutral-300 dark:text-neutral-700 group-hover/item:text-neutral-500 mt-0.5 transition-colors shrink-0" />
                            )}
                            <span className={`text-xs transition-all leading-tight ${task.done ? 'line-through text-neutral-400 dark:text-neutral-600' : 'text-neutral-600 dark:text-neutral-400 group-hover/item:text-neutral-800 dark:group-hover/item:text-neutral-200'
                                }`}>
                                {task.text}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={(e) => deleteTask(task.id, e)}
                            className="opacity-0 group-hover/item:opacity-100 p-1 hover:text-red-500 transition-all shrink-0"
                            title="删除任务"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                ))}
            </div>
            <form onSubmit={addTask} className="mt-4 pt-3 border-t border-neutral-200/50 dark:border-neutral-800/30 flex gap-2">
                <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Type task and press Enter..."
                    className="flex-1 bg-transparent text-xs text-neutral-700 dark:text-neutral-300 outline-none placeholder:text-neutral-400"
                />
            </form>
        </div>
    );
};

export default AgendaList;