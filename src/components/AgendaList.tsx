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
        <div className="flex flex-col justify-between p-6 surface w-full min-h-44 transition-all duration-700">
            <span className="text-label tracking-widest uppercase text-secondary font-medium mb-3">Focus Agenda</span>
            <div className="space-y-2.5 my-auto max-h-32 overflow-y-auto">
                {tasks.length === 0 && (
                    <p className="animate-task-in text-readout font-mono text-tertiary">
                        No tasks yet — type below and press Enter
                    </p>
                )}
                {tasks.map((task, index) => (
                    <div
                        key={task.id}
                        onClick={() => toggleTask(task.id)}
                        /* 入场：新任务浮入；首屏整列按序错峰。backwards 填充让延迟期间保持不可见，不会先闪一下 */
                        style={{ animationDelay: `${Math.min(index, 5) * 35}ms` }}
                        className="animate-task-in flex items-center justify-between group/item cursor-pointer"
                    >
                        <div className="flex items-start gap-3">
                            {task.done ? (
                                <CheckCircle2 size={15} className="animate-check-pop text-neutral-800 dark:text-neutral-200 mt-0.5 transition-colors shrink-0" />
                            ) : (
                                <Circle size={15} className="text-neutral-300 dark:text-neutral-700 group-hover/item:text-neutral-500 mt-0.5 transition-colors shrink-0" />
                            )}
                            {/* 删除线常驻但默认透明，勾选时把颜色渐显出来——
                                这样多行任务也能正确打线，不像单条横线那样只划到第一行 */}
                            <span className={`text-xs leading-tight line-through transition-all duration-300 ${task.done
                                ? '[text-decoration-color:currentColor] text-neutral-400 dark:text-neutral-600'
                                : '[text-decoration-color:transparent] text-neutral-600 dark:text-neutral-400 group-hover/item:text-neutral-800 dark:group-hover/item:text-neutral-200'
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
