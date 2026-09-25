import { GitBranch } from 'lucide-react';
import type { GitHubActivity, LoadState } from '../types';
import CardState from './CardState';

interface RecentActivityCardProps {
    events: GitHubActivity[];
    status: LoadState;
    onRetry: () => void;
}

/**
 * GitHub 近期活动组件
 * 显示最近的 GitHub 活动记录，并区分加载中 / 失败 / 无记录
 */
const RecentActivityCard = ({ events, status, onRetry }: RecentActivityCardProps) => {
    return (
        <div className="flex flex-col p-6 surface w-full h-full transition-all duration-700 min-h-65 justify-between">
            <div className="flex items-center gap-2 mb-4">
                <GitBranch size={13} className="text-tertiary" />
                <span className="text-label tracking-widest uppercase text-secondary font-medium">Recent Activity</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 justify-center overflow-y-auto max-h-43.75 scrollbar-none">
                {status === 'loading' ? (
                    <CardState variant="loading" rows={3} />
                ) : status === 'error' ? (
                    <CardState variant="error" label="Events unavailable" onRetry={onRetry} />
                ) : events.length === 0 ? (
                    <CardState variant="empty" label="No recent activity" />
                ) : (
                    events.map((event) => (
                        <div key={event.id} className="flex items-start justify-between gap-3 text-xs border-b border-neutral-200/20 dark:border-neutral-800/20 pb-2 last:border-0 last:pb-0">
                            <div className="flex flex-col min-w-0">
                                <span className="text-neutral-700 dark:text-neutral-300 truncate font-medium">
                                    {event.action}
                                </span>
                                <span className="text-label text-secondary font-mono mt-0.5 truncate">
                                    {event.repo}
                                </span>
                            </div>
                            <span className="text-label text-tertiary font-mono shrink-0 pt-0.5">
                                {event.date}
                            </span>
                        </div>
                    ))
                )}
            </div>
            <div className="mt-4 pt-3 border-t border-neutral-200/30 dark:border-neutral-800/20 text-right">
                <a
                    href="https://github.com/XiaoFeng-QWQ"
                    target="_blank"
                    rel="noreferrer"
                    className="text-label font-mono text-tertiary hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                >
                    View all activities
                </a>
            </div>
        </div>
    );
};

export default RecentActivityCard;
