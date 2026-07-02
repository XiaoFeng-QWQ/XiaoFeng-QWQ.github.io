import { GitBranch } from 'lucide-react';
import type { GitHubActivity } from '../types';

/**
 * GitHub 近期活动组件
 * 显示最近的 GitHub 活动记录
 */
const RecentActivityCard = ({ events }: { events: GitHubActivity[] }) => {
    return (
        <div className="flex flex-col p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 w-full h-full select-none transition-all duration-700 min-h-65 justify-between">
            <div className="flex items-center gap-2 mb-4">
                <GitBranch size={13} className="text-neutral-400" />
                <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium">Recent Activity</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 justify-center overflow-y-auto max-h-43.75 scrollbar-none">
                {events.length > 0 ? (
                    events.map((event) => (
                        <div key={event.id} className="flex items-start justify-between gap-3 text-xs border-b border-neutral-200/20 dark:border-neutral-800/20 pb-2 last:border-0 last:pb-0">
                            <div className="flex flex-col min-w-0">
                                <span className="text-neutral-700 dark:text-neutral-300 truncate font-medium">
                                    {event.action}
                                </span>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono mt-0.5 truncate">
                                    {event.repo}
                                </span>
                            </div>
                            <span className="text-[9px] text-neutral-400/80 font-mono shrink-0 pt-0.5">
                                {event.date}
                            </span>
                        </div>
                    ))
                ) : (
                    <div className="text-xs text-neutral-400 italic text-center py-4">No recent activity</div>
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-200/30 dark:border-neutral-800/20 text-right">
                <a
                    href="https://github.com/XiaoFeng-QWQ"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-mono text-neutral-400/80 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                    View all activities
                </a>
            </div>
        </div>
    );
};

export default RecentActivityCard;