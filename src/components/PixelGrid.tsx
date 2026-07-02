import { User, Globe } from 'lucide-react';
import type { DayContribution } from '../types';

/**
 * GitHub 贡献日历组件
 * 显示一年的 GitHub 贡献热力图
 */
const PixelGrid = ({ gridData }: { gridData: DayContribution[] }) => {
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
        <div className="flex flex-col p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 w-full select-none transition-all duration-700 h-full justify-between">
            <div>
                <div className="flex justify-between items-center mb-4 text-xs select-none">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">
                        {totalContributions} Github contributions in the last year
                    </span>
                </div>

                <div className="w-full overflow-x-auto scrollbar-none pb-2">
                    <div className="min-w-185 p-4 rounded-2xl border border-neutral-200/40 dark:border-neutral-800/30 bg-neutral-50/20 dark:bg-neutral-950/20 flex flex-col">
                        <div className="relative h-4 w-full text-[9px] text-neutral-400 select-none mb-1.5 font-mono">
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
                            <div className="grid grid-rows-7 gap-[2.5px] text-[9px] text-neutral-400 font-mono select-none pr-3 leading-2.5 w-8 shrink-0">
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
            </div>

            <div>
                <div className="flex justify-between items-center text-[10px] text-neutral-400/80 mt-4 select-none font-mono">
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

                <div className="mt-5 pt-4 border-t border-neutral-200/30 dark:border-neutral-800/20 flex flex-wrap gap-2">
                    <a
                        href="https://github.com/WiiRTwilight"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-100/30 dark:bg-neutral-900/30 text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all font-mono"
                    >
                        <User size={10} />
                        <span>@WiiRTwilight</span>
                    </a>
                    <a
                        href="https://www.travellings.cn/go.html"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-100/30 dark:bg-neutral-900/30 text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all font-mono"
                    >
                        <Globe size={10} />
                        <span>@travellings-link</span>
                    </a>
                    <a
                        href="https://github.com/dfggmc"
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-100/30 dark:bg-neutral-900/30 text-[10px] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all font-mono"
                    >
                        <User size={10} />
                        <span>@dfggmc</span>
                    </a>
                    <button
                        type="button"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-neutral-100/30 dark:bg-neutral-900/30 text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all font-mono"
                    >
                        <span>More</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PixelGrid;