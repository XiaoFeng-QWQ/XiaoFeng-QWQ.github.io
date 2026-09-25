import { User, Globe } from 'lucide-react';
import type { DayContribution, LoadState } from '../types';
import CardState from './CardState';

interface PixelGridProps {
    gridData: DayContribution[];
    /** 贡献数据加载状态 */
    status: LoadState;
    /** 接口失败时展示的是模拟数据，需要如实标注 */
    isSample: boolean;
    onRetry: () => void;
}

/**
 * GitHub 贡献日历组件
 * 显示一年的 GitHub 贡献热力图，并区分「加载中 / 真实数据 / 模拟数据」
 */
const PixelGrid = ({ gridData, status, isSample, onRetry }: PixelGridProps) => {
    const totalContributions = gridData.reduce((sum, item) => sum + (item.count || 0), 0) || 134;

    const monthLabels: { index: number; label: string }[] = [];
    let lastMonth = -1;
    let lastMonthIndex = -10;

    for (let i = 0; i < 53; i++) {
        const dayIndex = i * 7;
        const date = new Date();
        date.setDate(date.getDate() - (370 - dayIndex));
        const currentMonth = date.getMonth();

        if (currentMonth !== lastMonth && i - lastMonthIndex >= 3 && i < 51) {
            const monthName = date.toLocaleString('en-US', { month: 'short' });
            monthLabels.push({ index: i, label: monthName });
            lastMonth = currentMonth;
            lastMonthIndex = i;
        }
    }

    const getContributionColor = (level: number) => {
        const colors = [
            'bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200/20 dark:border-neutral-800/20',
            'bg-[#9be9a8] dark:bg-[#0e4429]',
            'bg-[#40c463] dark:bg-[#006d32]',
            'bg-[#30a14e] dark:bg-[#26a641]',
            'bg-[#216e39] dark:bg-[#39d353]'
        ];
        return colors[Math.min(level, 4)];
    };

    const safeGridData = gridData.length === 371 ? gridData : Array.from({ length: 371 }).map(() => ({ level: 0, count: 0 }));

    return (
        <div className="flex flex-col p-6 surface w-full transition-all duration-700 h-full justify-between">
            <div>
                <div className="flex items-center justify-between gap-3 mb-4 text-xs">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {totalContributions} Github contributions in the last year
                    </span>
                    {status === 'error' && (
                        <span className="flex shrink-0 items-center gap-2 font-mono text-label text-tertiary">
                            sample data
                            <button
                                type="button"
                                onClick={onRetry}
                                className="surface-chip px-1.5 py-0.5 transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                            >
                                retry
                            </button>
                        </span>
                    )}
                </div>

                {status === 'loading' ? (
                    <div className="w-full pb-2">
                        <div className="p-4 surface-inset">
                            <CardState variant="loading" rows={6} />
                        </div>
                    </div>
                ) : (
                    <div className="w-full overflow-x-auto scrollbar-none pb-2">
                        <div className="min-w-185 p-4 surface-inset flex flex-col">
                            <div className="relative h-4 w-full text-label text-secondary select-none mb-1.5 font-mono">
                                {monthLabels.map((item, idx) => (
                                    <span
                                        key={idx}
                                        className="absolute transition-all"
                                        style={{ left: `calc(${item.index} * 12.5px + 32px)` }}
                                    >
                                        {item.label}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-start">
                                <div className="grid grid-rows-7 gap-[2.5px] text-label text-secondary font-mono select-none pr-3 leading-2.5 w-8 shrink-0">
                                    <div className="h-2.5" />
                                    <div className="h-2.5 flex items-center">Mon</div>
                                    <div className="h-2.5" />
                                    <div className="h-2.5 flex items-center">Wed</div>
                                    <div className="h-2.5" />
                                    <div className="h-2.5 flex items-center">Fri</div>
                                    <div className="h-2.5" />
                                </div>

                                <div className="flex gap-[2.5px]">
                                    {Array.from({ length: 53 }).map((_, colIndex) => (
                                        <div key={colIndex} className="flex flex-col gap-[2.5px] shrink-0">
                                            {Array.from({ length: 7 }).map((_, rowIndex) => {
                                                const dayIndex = colIndex * 7 + rowIndex;
                                                const level = safeGridData[dayIndex]?.level || 0;
                                                return (
                                                    <div
                                                        key={rowIndex}
                                                        className={`w-2.5 h-2.5 rounded-[1.5px] transition-all duration-500 ${getContributionColor(level)}`}
                                                        title={`Day ${dayIndex + 1}: Level ${level}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div>
                <div className="flex justify-between items-center text-label text-tertiary mt-4 select-none font-mono">
                    <a
                        href="https://github.com/XiaoFeng-QWQ"
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                    >
                        Learn how we count contributions
                    </a>
                    <div className="flex items-center gap-1">
                        <span>Less</span>
                        <div className="w-2.5 h-2.5 rounded-[1.5px] bg-neutral-100 dark:bg-neutral-900/60 border border-neutral-200/20 dark:border-neutral-800/20" />
                        <div className="w-2.5 h-2.5 rounded-[1.5px] bg-[#9be9a8] dark:bg-[#0e4429]" />
                        <div className="w-2.5 h-2.5 rounded-[1.5px] bg-[#40c463] dark:bg-[#006d32]" />
                        <div className="w-2.5 h-2.5 rounded-[1.5px] bg-[#30a14e] dark:bg-[#26a641]" />
                        <div className="w-2.5 h-2.5 rounded-[1.5px] bg-[#216e39] dark:bg-[#39d353]" />
                        <span>More</span>
                    </div>
                </div>

                {isSample && (
                    <p className="mt-2 font-mono text-label text-tertiary">
                        接口不可用，以上为本地生成的示例数据
                    </p>
                )}

                <div className="mt-5 pt-4 border-t border-neutral-200/30 dark:border-neutral-800/20 flex flex-wrap gap-2">
                    <a
                        href="https://github.com/WiiRTwilight"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 surface-chip text-label text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-all font-mono"
                    >
                        <User size={10} />
                        <span>@WiiRTwilight</span>
                    </a>
                    <a
                        href="https://www.travellings.cn/go.html"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 surface-chip text-label text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-all font-mono"
                    >
                        <Globe size={10} />
                        <span>@travellings-link</span>
                    </a>
                    <a
                        href="https://github.com/dfggmc"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 surface-chip text-label text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 transition-all font-mono"
                    >
                        <User size={10} />
                        <span>@dfggmc</span>
                    </a>
                    <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 surface-chip text-label text-secondary hover:text-neutral-900 dark:hover:text-neutral-200 transition-all font-mono"
                    >
                        <span>More</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PixelGrid;
