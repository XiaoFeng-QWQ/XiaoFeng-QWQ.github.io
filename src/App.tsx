import { useState, useEffect, useRef, type FormEvent } from 'react';
import { flushSync } from 'react-dom';
import { HashRouter, useLocation, useNavigate } from 'react-router-dom';
import {
    Globe, LayoutGrid,
    Sun, Moon, Command, ArrowRight, Disc3, CheckCircle2, Circle, Play, Pause, Trash2,
    FolderOpen, Cpu, User, ArrowUpRight, RotateCcw, Coffee, Compass, GitBranch,
    SkipForward, SkipBack, ListMusic
} from 'lucide-react';

// --- 全局数据接口定义 ---
interface DayContribution {
    level: number;
    count: number;
}

interface GitHubActivity {
    id: string;
    action: string;
    repo: string;
    date: string;
}

interface LyricLine {
    time: number;
    text: string;
}

interface Task {
    id: number;
    text: string;
    done: boolean;
}

// 全局配置常量定义
const SEARCH_ENGINES = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=' },
] as const;

const DOCK_PAGES = [
    { name: 'Identity', icon: User, id: 0, path: '/' },
    { name: 'Workspace', icon: LayoutGrid, id: 1, path: '/workspace' },
    { name: 'Projects', icon: FolderOpen, id: 2, path: '/projects' },
    { name: 'Tech Stack', icon: Cpu, id: 3, path: '/stack' }
];

// 根据技术栈语言匹配高亮色彩
const getLangColor = (lang: string) => {
    const colors: { [key: string]: string } = {
        TypeScript: 'bg-blue-500',
        JavaScript: 'bg-yellow-400',
        HTML: 'bg-orange-500',
        CSS: 'bg-indigo-500',
        Vue: 'bg-emerald-500',
        Python: 'bg-blue-400'
    };
    return colors[lang] || 'bg-neutral-400';
};

// 太阳轨迹动态动效组件
const TemporalArc = () => {
    const [coords, setCoords] = useState({ x: 14, y: 35, isDay: true });

    useEffect(() => {
        const now = new Date();
        const hours = now.getHours() + now.getMinutes() / 60;
        const sunrise = 5.2; // 预设日出时间
        const sunset = 18.8;  // 预设日落时间

        if (hours >= sunrise && hours <= sunset) {
            const targetPct = (hours - sunrise) / (sunset - sunrise);
            let startTimestamp: number | null = null;
            const duration = 1500;

            const animate = (timestamp: number) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const elapsed = timestamp - startTimestamp;
                const progress = Math.min(elapsed / duration, 1);
                const easeOutProgress = 1 - Math.pow(1 - progress, 3);
                const currentPct = easeOutProgress * targetPct;
                const angle = Math.PI - currentPct * Math.PI;
                const r = 26;
                const cx = 40;
                const cy = 35;

                setCoords({
                    x: cx + r * Math.cos(angle),
                    y: cy - r * Math.sin(angle),
                    isDay: true
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };
            requestAnimationFrame(animate);
        } else {
            setCoords({ x: 40, y: 35, isDay: false });
        }
    }, []);

    return (
        <div className="flex flex-col items-center justify-center select-none transition-colors duration-700">
            <svg viewBox="0 0 80 45" className="w-20 h-11 text-neutral-400 dark:text-neutral-600">
                <path d="M 14 35 A 26 26 0 0 1 66 35" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="8" y1="35" x2="72" y2="35" stroke="currentColor" strokeWidth="0.5" />
                {coords.isDay ? (
                    <circle cx={coords.x} cy={coords.y} r="3" className="fill-neutral-800 dark:fill-neutral-200" />
                ) : (
                    <circle cx="40" cy="35" r="3" className="fill-neutral-400 dark:fill-neutral-700" />
                )}
            </svg>
            <span className="text-[9px] tracking-[0.2em] uppercase text-neutral-400/80 mt-1.5 font-medium">
                {coords.isDay ? "Sun Transit" : "Night Cycle"}
            </span>
        </div>
    );
};

// GitHub 贡献日历组件
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
        <div className="flex flex-col p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 w-full select-none transition-all duration-700 h-full justify-between">
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

// GitHub 近期动态组件
const RecentActivityCard = ({ events }: { events: GitHubActivity[] }) => {
    return (
        <div className="flex flex-col p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 w-full h-full select-none transition-all duration-700 min-h-65 justify-between">
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

// 番茄工作钟组件
const Pomodoro = () => {
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isWorkMode, setIsWorkMode] = useState(true);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (isActive) {
            timerRef.current = setInterval(() => {
                if (seconds > 0) {
                    setSeconds(prev => prev - 1);
                } else if (seconds === 0) {
                    if (minutes === 0) {
                        handleTimerComplete();
                    } else {
                        setMinutes(prev => prev - 1);
                        setSeconds(59);
                    }
                }
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [isActive, minutes, seconds]);

    const handleTimerComplete = () => {
        setIsActive(false);
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(523.25, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 1.2);
        } catch (e) {
            console.error("Audio chime synthesis failed:", e);
        }

        const nextModeIsWork = !isWorkMode;
        setIsWorkMode(nextModeIsWork);
        setMinutes(nextModeIsWork ? 25 : 5);
        setSeconds(0);
    };

    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setMinutes(isWorkMode ? 25 : 5);
        setSeconds(0);
    };

    const switchMode = (isWork: boolean) => {
        setIsActive(false);
        setIsWorkMode(isWork);
        setMinutes(isWork ? 25 : 5);
        setSeconds(0);
    };

    const totalDurationSeconds = (isWorkMode ? 25 : 5) * 60;
    const currentRemainingSeconds = minutes * 60 + seconds;
    const progress = ((totalDurationSeconds - currentRemainingSeconds) / totalDurationSeconds) * 100;

    return (
        <div className="flex flex-col justify-between p-6 rounded-3xl bg-neutral-950/5 dark:bg-neutral-950/40 border border-neutral-200/30 dark:border-neutral-800/20 w-full h-44 select-none relative overflow-hidden transition-all duration-700">
            <div className="flex justify-between items-center z-10">
                <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium flex items-center gap-1.5">
                    <Coffee size={10} className={isWorkMode ? 'text-neutral-400' : 'text-emerald-500 animate-pulse'} />
                    {isWorkMode ? 'Focus Session' : 'Short Break'}
                </span>
                <div className="flex gap-1.5">
                    <button
                        onClick={() => switchMode(true)}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-mono transition-all ${isWorkMode
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                            }`}
                    >
                        WORK
                    </button>
                    <button
                        onClick={() => switchMode(false)}
                        className={`px-2 py-0.5 rounded-lg text-[9px] font-mono transition-all ${!isWorkMode
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 font-semibold'
                            : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                            }`}
                    >
                        BREAK
                    </button>
                </div>
            </div>

            <div className="flex items-center justify-between my-auto z-10 pr-1">
                <div className="flex items-baseline gap-2 font-mono">
                    <span className="text-4.5xl md:text-5xl font-extralight tracking-tighter text-neutral-800 dark:text-neutral-50 leading-none">
                        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[9px] tracking-widest uppercase text-neutral-400/80 font-medium font-sans">
                        {isActive ? 'Running' : 'Paused'}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleTimer}
                        className={`p-2.5 rounded-full transition-all ${isActive
                            ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                            }`}
                        title={isActive ? 'Pause' : 'Start'}
                    >
                        {isActive ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
                    </button>
                    <button
                        onClick={resetTimer}
                        className="p-2.5 rounded-full bg-neutral-200/50 dark:bg-neutral-950/50 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-50 transition-colors"
                        title="Reset"
                    >
                        <RotateCcw size={13} />
                    </button>
                </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 h-0.75 bg-neutral-200/20 dark:bg-neutral-800/10">
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${isWorkMode ? 'bg-red-500/70 dark:bg-red-400/70' : 'bg-emerald-500/70 dark:bg-emerald-400/70'
                        }`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};

// 每日待办事项组件
const AgendaList = ({ tasks, toggleTask, deleteTask, addTask, newTaskText, setNewTaskText }: any) => {
    return (
        <div className="flex flex-col justify-between p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 w-full min-h-44 select-none transition-colors duration-700">
            <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium mb-3">Focus Agenda</span>
            <div className="space-y-2.5 my-auto max-h-32 overflow-y-auto">
                {tasks.map((task: any) => (
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

// 应用核心逻辑组件
function AppContent() {
    const [time, setTime] = useState(new Date());
    const [query, setQuery] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);

    // 初始化主题配置，从本地存储中恢复状态
    const [isDark, setIsDark] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('theme') !== 'light';
        }
        return true;
    });

    // 从本地存储中读取搜索引擎设置
    const [engineIndex, setEngineIndex] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('workspace_search_engine');
            if (saved) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 0 && parsed < SEARCH_ENGINES.length) {
                    return parsed;
                }
            }
        }
        return 0;
    });

    // 从本地存储中读取时间格式设置
    const [isTwelveHour, setIsTwelveHour] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('workspace_clock_12h') === 'true';
        }
        return false;
    });

    // 从本地存储中读取待办任务列表数据
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

    const [dockWidth, setDockWidth] = useState(240);
    const [dockMouseX, setDockMouseX] = useState<number | null>(null);

    const [weather, setWeather] = useState({ temp: '-°C', city: '-', cond: '-' });

    // 音乐播放器和歌单相关状态
    const [playlist, setPlaylist] = useState<any[]>([]);
    const [playlistIndex, setPlaylistIndex] = useState(0);
    const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
    const [expandedTab, setExpandedTab] = useState<'playlist' | 'lyrics'>('playlist');
    const [musicInfo, setMusicInfo] = useState({ name: 'Loading...', artist: 'Please wait', pic: '', url: '' });
    const [isMusicPlaying, setIsMusicPlaying] = useState(false);

    // 歌词及浏览器原生画中画（PiP）状态
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
    const [isPiPActive, setIsPiPActive] = useState(false);

    const [githubProjects, setGithubProjects] = useState<any[]>([]);
    const [githubProfile, setGithubProfile] = useState({ avatar: '', bio: 'Full-Stack Developer & Designer', publicRepos: 0 });
    const [activityGrid, setActivityGrid] = useState<DayContribution[]>([]);
    const [recentEvents, setRecentEvents] = useState<GitHubActivity[]>([]);

    const [newTaskText, setNewTaskText] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    // DOM 元素引用句柄
    const lyricsContainerRef = useRef<HTMLDivElement>(null);
    const pipRootRef = useRef<HTMLDivElement | null>(null);

    const getPageId = (path: string) => {
        if (path === '/workspace') return 1;
        if (path === '/projects') return 2;
        if (path === '/stack') return 3;
        return 0;
    };

    const resolvedPage = getPageId(location.pathname);

    const [currentPage, setCurrentPage] = useState(resolvedPage);
    const [prevPage, setPrevPage] = useState(resolvedPage);

    if (resolvedPage !== currentPage) {
        setPrevPage(currentPage);
        setCurrentPage(resolvedPage);
    }

    const dockRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);
    const isTransitioningRef = useRef(false);

    const bar1Ref = useRef<HTMLDivElement>(null);
    const bar2Ref = useRef<HTMLDivElement>(null);
    const bar3Ref = useRef<HTMLDivElement>(null);
    const bar4Ref = useRef<HTMLDivElement>(null);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const isPlayingRef = useRef(isMusicPlaying);
    useEffect(() => {
        isPlayingRef.current = isMusicPlaying;
    }, [isMusicPlaying]);

    // 状态变化同步至本地存储
    useEffect(() => {
        localStorage.setItem('workspace_search_engine', String(engineIndex));
    }, [engineIndex]);

    useEffect(() => {
        localStorage.setItem('workspace_clock_12h', String(isTwelveHour));
    }, [isTwelveHour]);

    useEffect(() => {
        localStorage.setItem('workspace_tasks', JSON.stringify(tasks));
    }, [tasks]);

    // 初始化音频频谱分析器
    const initAnalyser = () => {
        if (!audioRef.current) return;
        audioRef.current.crossOrigin = "anonymous";

        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;

            const ctx = new AudioContextClass();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 32;

            try {
                const source = ctx.createMediaElementSource(audioRef.current);
                source.connect(analyser);
                analyser.connect(ctx.destination);

                audioContextRef.current = ctx;
                analyserRef.current = analyser;
                sourceRef.current = source;
            } catch (e) {
                console.error("Failed to initialize Web Audio source:", e);
            }
        } else if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    // 动效频谱实时渲染逻辑（重构为修改 transform scaleY 避开重排）
    const updateSpectrum = () => {
        if (!isPlayingRef.current) {
            if (bar1Ref.current) bar1Ref.current.style.transform = 'scaleY(0.1)';
            if (bar2Ref.current) bar2Ref.current.style.transform = 'scaleY(0.1)';
            if (bar3Ref.current) bar3Ref.current.style.transform = 'scaleY(0.1)';
            if (bar4Ref.current) bar4Ref.current.style.transform = 'scaleY(0.1)';
            return;
        }

        let h1 = 2, h2 = 2, h3 = 2, h4 = 2;

        if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            const val1 = dataArray[2] || 0;
            const val2 = dataArray[5] || 0;
            const val3 = dataArray[8] || 0;
            const val4 = dataArray[11] || 0;

            const totalSum = val1 + val2 + val3 + val4;

            if (totalSum > 0) {
                h1 = Math.max(2, (val1 / 255) * 24);
                h2 = Math.max(2, (val2 / 255) * 24);
                h3 = Math.max(2, (val3 / 255) * 24);
                h4 = Math.max(2, (val4 / 255) * 24);
            } else {
                const t = Date.now() / 150;
                h1 = Math.max(2, (Math.sin(t) * 0.4 + 0.6) * 16 + Math.random() * 3);
                h2 = Math.max(2, (Math.sin(t * 1.3 + 1) * 0.4 + 0.6) * 24 + Math.random() * 2);
                h3 = Math.max(2, (Math.sin(t * 0.8 + 2) * 0.4 + 0.6) * 18 + Math.random() * 3);
                h4 = Math.max(2, (Math.sin(t * 1.7 + 3) * 0.4 + 0.6) * 12 + Math.random() * 2);
            }
        } else {
            const t = Date.now() / 150;
            h1 = Math.max(2, (Math.sin(t) * 0.4 + 0.6) * 16 + Math.random() * 3);
            h2 = Math.max(2, (Math.sin(t * 1.3 + 1) * 0.4 + 0.6) * 24 + Math.random() * 2);
            h3 = Math.max(2, (Math.sin(t * 0.8 + 2) * 0.4 + 0.6) * 18 + Math.random() * 3);
            h4 = Math.max(2, (Math.sin(t * 1.7 + 3) * 0.4 + 0.6) * 12 + Math.random() * 2);
        }

        // 仅通过合成器控制縮放，性能损耗接近于零
        if (bar1Ref.current) bar1Ref.current.style.transform = `scaleY(${h1 / 24})`;
        if (bar2Ref.current) bar2Ref.current.style.transform = `scaleY(${h2 / 24})`;
        if (bar3Ref.current) bar3Ref.current.style.transform = `scaleY(${h3 / 24})`;
        if (bar4Ref.current) bar4Ref.current.style.transform = `scaleY(${h4 / 24})`;

        animationFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleDockMouseEnter = () => {
        if (dockRef.current) {
            setDockWidth(dockRef.current.getBoundingClientRect().width);
        }
    };

    const handleDockMouseMove = (e: React.MouseEvent) => {
        if (!dockRef.current) return;
        const rect = dockRef.current.getBoundingClientRect();
        setDockMouseX(e.clientX - rect.left);
    };

    // 底部浮动坞图标大小自适应缩放样式
    const getDynamicScaleStyle = (index: number) => {
        if (dockMouseX === null) return {};
        const itemCenter = (index + 0.5) * (dockWidth / DOCK_PAGES.length);
        const distance = Math.abs(dockMouseX - itemCenter);
        const maxScale = 0.12;
        const stdDev = 35;
        const scale = 1 + maxScale * Math.exp(-Math.pow(distance, 2) / (2 * Math.pow(stdDev, 2)));
        const translateY = (scale - 1) * -22;
        return {
            transform: `scale(${scale}) translateY(${translateY}px)`
        };
    };

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        window.open(`${SEARCH_ENGINES[engineIndex].url}${encodeURIComponent(query)}`, '_blank');
        setQuery('');
    };

    // 切换卡片容器过渡动画类分配
    const getPageClass = (pageId: number) => {
        const isActive = currentPage === pageId;
        const baseClass = "grid gap-6 will-change-[opacity,transform]";

        if (currentPage === prevPage) {
            return isActive ? `${baseClass} relative z-10` : 'hidden';
        }

        const isPrevPage = prevPage === pageId;
        if (!isActive && !isPrevPage) {
            return 'hidden';
        }

        if (isActive) {
            const isForward = currentPage > prevPage;
            return `${baseClass} relative z-10 ${isForward ? 'animate-slide-up' : 'animate-slide-down'}`;
        }

        const isForward = currentPage > prevPage;
        if (isForward) {
            return `${baseClass} opacity-0 absolute inset-x-0 top-0 pointer-events-none z-0 animate-slide-out-up`;
        } else {
            return `${baseClass} opacity-0 absolute inset-x-0 top-0 pointer-events-none z-0 animate-slide-out-down`;
        }
    };

    // 优雅的主题转场平滑动画触发逻辑
    const toggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (isTransitioningRef.current) return;

        const doc = document as any;
        if (!doc.startViewTransition) {
            setIsDark(!isDark);
            return;
        }

        isTransitioningRef.current = true;

        document.documentElement.getAnimations().forEach(anim => {
            if ((anim as any).pseudoElement?.includes('view-transition')) {
                anim.cancel();
            }
        });

        document.documentElement.classList.add('theme-transitioning');

        const x = e.clientX || window.innerWidth / 2;
        const y = e.clientY || window.innerHeight / 2;
        const endRadius = Math.hypot(
            Math.max(x, window.innerWidth - x),
            Math.max(y, window.innerHeight - y)
        );

        const transition = doc.startViewTransition(() => {
            flushSync(() => {
                setIsDark(prev => !prev);
            });
        });

        transition.ready.then(() => {
            const anim = document.documentElement.animate(
                {
                    clipPath: [
                        `circle(0px at ${x}px ${y}px)`,
                        `circle(${endRadius}px at ${x}px ${y}px)`,
                    ],
                },
                {
                    duration: 400,
                    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
                    pseudoElement: '::view-transition-new(root)',
                }
            );

            anim.onfinish = () => {
                document.documentElement.classList.remove('theme-transitioning');
                isTransitioningRef.current = false;
            };
        });

        transition.finished.then(() => {
            document.documentElement.classList.remove('theme-transitioning');
            isTransitioningRef.current = false;
        }).catch(() => {
            document.documentElement.classList.remove('theme-transitioning');
            isTransitioningRef.current = false;
        });
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    // 初始化天气获取
    useEffect(() => {
        fetch('https://api.xiaofengqwq.com/api/v1/tools/weather?type=now')
            .then(r => r.json())
            .then(res => {
                if (res.code === 200 && res.data) {
                    const d = res.data;
                    const temp = d.now?.temp || d.temp || '24';
                    const city = d.city || d.cityName || 'Taipei';
                    const cond = d.now?.text || d.weather || 'Clear';
                    setWeather({ temp: `${temp}°C`, city, cond });
                }
            })
            .catch(err => console.error(err));
    }, []);

    // 解析标准 LRC 歌词格式
    const parseLRC = (lrcText: string): LyricLine[] => {
        const lines = lrcText.split('\n');
        const parsed: LyricLine[] = [];
        const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

        lines.forEach(line => {
            const match = timeReg.exec(line);
            if (match) {
                const min = parseInt(match[1], 10);
                const sec = parseInt(match[2], 10);
                const msStr = match[3];
                const ms = parseInt(msStr, 10) / (msStr.length === 3 ? 1000 : 100);
                const time = min * 60 + sec + ms;
                const text = line.replace(timeReg, '').trim();
                parsed.push({ time, text });
            }
        });
        return parsed.sort((a, b) => a.time - b.time);
    };

    // 初始化获取网易云歌单列表
    useEffect(() => {
        fetch('https://api.xiaofengqwq.com/api/v1/music/playlist?server=netease&id=6634356386')
            .then(r => r.json())
            .then(res => {
                if (res.code === 200 && Array.isArray(res.data) && res.data.length > 0) {
                    setPlaylist(res.data);
                    const firstSong = res.data[0];
                    setMusicInfo({
                        name: firstSong.name || 'Unknown',
                        artist: firstSong.artist || 'Unknown',
                        pic: firstSong.pic || '',
                        url: firstSong.url || ''
                    });
                }
            })
            .catch(err => {
                console.error("Failed to fetch playlist", err);
                const fallback = [
                    {
                        name: 'Solar Echoes',
                        artist: 'John Stanford',
                        url: 'https://api.xiaofengqwq.com/api/v1/music/url?server=netease&id=29753363',
                        pic: 'https://api.xiaofengqwq.com/api/v1/music/pic?server=netease&id=6620159511974252',
                        lrc: ''
                    }
                ];
                setPlaylist(fallback);
                setMusicInfo(fallback[0]);
            });
    }, []);

    // 切换歌曲时更新当前播放信息及获取对应歌词
    useEffect(() => {
        if (playlist.length > 0 && playlist[playlistIndex]) {
            const currentSong = playlist[playlistIndex];
            setMusicInfo({
                name: currentSong.name || 'Unknown',
                artist: currentSong.artist || 'Unknown',
                pic: currentSong.pic || '',
                url: currentSong.url || ''
            });

            if (currentSong.lrc) {
                fetch(currentSong.lrc)
                    .then(r => r.text())
                    .then(text => {
                        setLyrics(parseLRC(text));
                    })
                    .catch(err => {
                        console.error("Failed to fetch lyrics", err);
                        setLyrics([]);
                    });
            } else {
                setLyrics([]);
            }
        }
    }, [playlistIndex, playlist]);

    // 音频播放器实例管理与状态监听
    useEffect(() => {
        if (musicInfo.url) {
            if (audioRef.current) {
                audioRef.current.pause();
                if (audioContextRef.current) {
                    audioContextRef.current.close().catch(() => { });
                    audioContextRef.current = null;
                    analyserRef.current = null;
                    sourceRef.current = null;
                }
            }

            const audio = new Audio(musicInfo.url);
            audio.crossOrigin = "anonymous";
            audio.loop = true;

            const handleTimeUpdate = () => {
                setAudioCurrentTime(audio.currentTime);
            };

            audio.addEventListener('timeupdate', handleTimeUpdate);
            audioRef.current = audio;

            if (isMusicPlaying) {
                initAnalyser();
                audio.play().catch(() => setIsMusicPlaying(false));
            }

            return () => {
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.pause();
            };
        }
    }, [musicInfo.url]);

    useEffect(() => {
        if (!audioRef.current) return;
        if (isMusicPlaying) {
            initAnalyser();
            audioRef.current.play().catch(() => setIsMusicPlaying(false));
        } else {
            audioRef.current.pause();
        }
    }, [isMusicPlaying]);

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isMusicPlaying ? 'playing' : 'paused';
        }
    }, [isMusicPlaying]);

    // 同步系统媒体中心元数据并注册全局控制事件
    useEffect(() => {
        if ('mediaSession' in navigator && playlist.length > 0) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: musicInfo.name,
                artist: musicInfo.artist,
                album: 'Workspace Playlist',
                artwork: musicInfo.pic ? [
                    { src: musicInfo.pic, sizes: '512x512', type: 'image/jpeg' }
                ] : []
            });

            navigator.mediaSession.setActionHandler('play', () => {
                setIsMusicPlaying(true);
            });
            navigator.mediaSession.setActionHandler('pause', () => {
                setIsMusicPlaying(false);
            });
            navigator.mediaSession.setActionHandler('previoustrack', () => {
                setPlaylistIndex(prev => (prev - 1 + playlist.length) % playlist.length);
            });
            navigator.mediaSession.setActionHandler('nexttrack', () => {
                setPlaylistIndex(prev => (prev + 1) % playlist.length);
            });
        }
    }, [musicInfo, playlist, playlistIndex]);

    useEffect(() => {
        if (isMusicPlaying) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            updateSpectrum();
        } else {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
            if (bar1Ref.current) bar1Ref.current.style.transform = 'scaleY(0.1)';
            if (bar2Ref.current) bar2Ref.current.style.transform = 'scaleY(0.1)';
            if (bar3Ref.current) bar3Ref.current.style.transform = 'scaleY(0.1)';
            if (bar4Ref.current) bar4Ref.current.style.transform = 'scaleY(0.1)';
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isMusicPlaying]);

    // 计算当前高亮的歌词行索引
    useEffect(() => {
        if (lyrics.length === 0) {
            setCurrentLyricIndex(-1);
            return;
        }
        let activeIdx = -1;
        for (let i = 0; i < lyrics.length; i++) {
            if (audioCurrentTime >= lyrics[i].time) {
                activeIdx = i;
            } else {
                break;
            }
        }
        setCurrentLyricIndex(activeIdx);
    }, [audioCurrentTime, lyrics]);

    // 歌词平滑滚动逻辑
    useEffect(() => {
        if (currentLyricIndex !== -1 && lyricsContainerRef.current) {
            const activeEl = lyricsContainerRef.current.querySelector(`[data-index="${currentLyricIndex}"]`);
            if (activeEl) {
                activeEl.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [currentLyricIndex]);

    // 在文档画中画窗口中高保真同步渲染双语歌词
    useEffect(() => {
        if (!isPiPActive || !pipRootRef.current) return;

        const root = pipRootRef.current;
        root.className = `w-full h-full flex flex-col justify-center items-center overflow-hidden p-3 select-none text-center ${isDark ? 'bg-[#060606] text-white' : 'bg-[#fafafa] text-neutral-900'
            }`;

        const currentLine = lyrics[currentLyricIndex]?.text || ' ';
        const parts = currentLine.split(/[（(]/);
        const originText = parts[0]?.trim() || '';
        const transText = parts[1]?.replace(/[)）]/g, '')?.trim() || '';

        if (transText) {
            root.innerHTML = `
                <p style="font-family: sans-serif; font-weight: bold; font-size: 13px; letter-spacing: 0.05em; margin: 0; padding: 0 10px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 100%; line-height: 1.3;">${originText}</p>
                <p style="font-family: sans-serif; font-size: 10px; margin-top: 4px; margin-bottom: 0; opacity: 0.6; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 100%; line-height: 1.2;">${transText}</p>
            `;
        } else {
            root.innerHTML = `
                <p style="font-family: sans-serif; font-weight: bold; font-size: 14px; letter-spacing: 0.05em; margin: 0; padding: 0 10px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 100%;">${currentLine}</p>
            `;
        }
    }, [currentLyricIndex, lyrics, isDark, isPiPActive]);

    // 开启或关闭文档画中画歌词悬浮窗
    const togglePiP = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const pip = (window as any).documentPictureInPicture;
        if (!pip) {
            alert("您的浏览器不支持现代的 Document Picture-in-Picture API，请尝试使用 Chrome 或 Edge 浏览器。");
            return;
        }

        if (pip.window) {
            pip.window.close();
            setIsPiPActive(false);
            pipRootRef.current = null;
            return;
        }

        try {
            const pipWindow = await pip.requestWindow({
                width: 320,
                height: 75
            });

            const allStyles = Array.from(document.styleSheets);
            allStyles.forEach((styleSheet) => {
                try {
                    const cssRules = Array.from(styleSheet.cssRules)
                        .map((rule) => rule.cssText)
                        .join('');
                    const style = pipWindow.document.createElement('style');
                    style.textContent = cssRules;
                    pipWindow.document.head.appendChild(style);
                } catch {
                    if (styleSheet.href) {
                        const link = pipWindow.document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        pipWindow.document.head.appendChild(link);
                    }
                }
            });

            pipWindow.document.body.style.margin = '0';
            pipWindow.document.body.style.padding = '0';
            pipWindow.document.body.style.overflow = 'hidden';

            const pipDiv = pipWindow.document.createElement('div');
            pipDiv.className = `w-full h-full flex flex-col justify-center items-center overflow-hidden p-3 select-none text-center ${isDark ? 'bg-[#060606] text-white' : 'bg-[#fafafa] text-neutral-900'
                }`;
            pipWindow.document.body.appendChild(pipDiv);

            pipRootRef.current = pipDiv;
            setIsPiPActive(true);

            const currentLine = lyrics[currentLyricIndex]?.text || ' ';
            const parts = currentLine.split(/[（(]/);
            const originText = parts[0]?.trim() || '';
            const transText = parts[1]?.replace(/[)）]/g, '')?.trim() || '';
            if (transText) {
                pipDiv.innerHTML = `
                    <p style="font-family: sans-serif; font-weight: bold; font-size: 13px; letter-spacing: 0.05em; margin: 0; padding: 0 10px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 100%; line-height: 1.3;">${originText}</p>
                    <p style="font-family: sans-serif; font-size: 10px; margin-top: 4px; margin-bottom: 0; opacity: 0.6; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 100%; line-height: 1.2;">${transText}</p>
                `;
            } else {
                pipDiv.innerHTML = `
                    <p style="font-family: sans-serif; font-weight: bold; font-size: 14px; letter-spacing: 0.05em; margin: 0; padding: 0 10px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 100%;">${currentLine}</p>
                `;
            }

            pipWindow.addEventListener('pagehide', () => {
                setIsPiPActive(false);
                pipRootRef.current = null;
            });
        } catch (err) {
            console.error("Document Picture-in-Picture failed", err);
        }
    };

    // 获取并解析 GitHub 仓库与活跃数据
    useEffect(() => {
        fetch('https://api.github.com/users/XiaoFeng-QWQ')
            .then(r => r.json())
            .then(data => {
                if (data && data.login) {
                    setGithubProfile({
                        avatar: data.avatar_url,
                        bio: data.bio || 'Full-Stack Developer & Designer',
                        publicRepos: data.public_repos
                    });
                }
            })
            .catch(err => console.error(err));

        fetch('https://api.github.com/users/XiaoFeng-QWQ/repos?sort=updated&per_page=6')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const mapped = data.slice(0, 3).map(repo => ({
                        name: repo.name,
                        desc: repo.description || 'No description provided.',
                        lang: repo.language || 'TypeScript',
                        url: repo.html_url,
                        color: getLangColor(repo.language || 'TypeScript')
                    }));
                    setGithubProjects(mapped);
                }
            })
            .catch(err => console.error(err));

        fetch('https://api.github.com/users/XiaoFeng-QWQ/events?per_page=10')
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const parsed = data.slice(0, 4).map((event: any) => {
                        let action = '';
                        switch (event.type) {
                            case 'PushEvent':
                                const commitMsg = event.payload.commits?.[0]?.message || 'commit';
                                action = `Pushed: "${commitMsg}"`;
                                break;
                            case 'CreateEvent':
                                action = `Created ${event.payload.ref_type || 'ref'} ${event.payload.ref || ''}`;
                                break;
                            case 'WatchEvent':
                                action = `Starred repository`;
                                break;
                            case 'ForkEvent':
                                action = `Forked repository`;
                                break;
                            case 'IssuesEvent':
                                action = `${event.payload.action.charAt(0).toUpperCase() + event.payload.action.slice(1)} issue`;
                                break;
                            default:
                                action = `Updated repository`;
                        }
                        return {
                            id: event.id,
                            action,
                            repo: event.repo.name.replace('XiaoFeng-QWQ/', ''),
                            date: new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        };
                    });
                    setRecentEvents(parsed);
                }
            })
            .catch(err => console.error("Failed to fetch events:", err));

        fetch('https://github-contributions-api.jogruber.de/v4/XiaoFeng-QWQ?y=last')
            .then(r => r.json())
            .then(res => {
                if (res && Array.isArray(res.contributions)) {
                    const rawContributions = res.contributions;
                    const targetLength = 371;
                    const mappedGrid = Array.from({ length: targetLength }).map((_, i) => {
                        const offset = rawContributions.length - targetLength;
                        const dataItem = rawContributions[i + offset];
                        return {
                            level: dataItem ? dataItem.level : 0,
                            count: dataItem ? dataItem.count : 0
                        };
                    });
                    setActivityGrid(mappedGrid);
                } else {
                    throw new Error("Invalid format");
                }
            })
            .catch(() => {
                const fallbackGrid = Array.from({ length: 371 }).map((_, i) => {
                    const dayOfWeek = i % 7;
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const rand = Math.random();
                    const probability = isWeekend ? 0.94 : 0.73;
                    if (rand > probability) {
                        const level = Math.floor(Math.random() * 4) + 1;
                        const count = level * (Math.floor(Math.random() * 3) + 1);
                        return { level, count };
                    }
                    return { level: 0, count: 0 };
                });
                setActivityGrid(fallbackGrid);
            });
    }, []);

    // 快捷键监听
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }

            if (e.key === 'Tab' && document.activeElement === searchInputRef.current) {
                e.preventDefault();
                setEngineIndex((prev) => (prev + 1) % SEARCH_ENGINES.length);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 时间刷新时钟
    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleTask = (id: number) => {
        setTasks(tasks.map((t: Task) => t.id === id ? { ...t, done: !t.done } : t));
    };

    const addTask = (e: FormEvent) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;
        setTasks([...tasks, { id: Date.now(), text: newTaskText.trim(), done: false }]);
        setNewTaskText('');
    };

    const deleteTask = (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(tasks.filter((t: Task) => t.id !== id));
    };

    const handleNextTrack = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (playlist.length === 0) return;
        setPlaylistIndex(prev => (prev + 1) % playlist.length);
    };

    const handlePrevTrack = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (playlist.length === 0) return;
        setPlaylistIndex(prev => (prev - 1 + playlist.length) % playlist.length);
    };

    const currentEngine = SEARCH_ENGINES[engineIndex];

    return (
        <div
            onMouseMove={handleMouseMove}
            className="min-h-screen w-full relative flex flex-col items-center justify-between pt-12 pb-28 px-6 lg:px-12 overflow-hidden bg-[#fafafa] dark:bg-[#060606] text-neutral-900 dark:text-white transition-colors duration-1000 selection:bg-neutral-200 dark:selection:bg-neutral-800"
        >
            <div className={`absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-size-[40px_40px] mask-[radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none transition-opacity duration-1500 ${isMounted ? 'opacity-100' : 'opacity-0'
                }`} />

            <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-1000 opacity-100 dark:opacity-80"
                style={{
                    background: `radial-gradient(500px circle at ${mousePos.x}px ${mousePos.y}px, ${isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.012)'}, transparent 80%)`
                }}
            />

            <header className={`relative z-10 w-full max-w-6xl flex justify-between items-center select-none transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}>
                <a
                    href="https://xiaofengqwq.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 group/logo outline-none"
                    title="访问个人域名: xiaofengqwq.com"
                >
                    <Command size={14} className="text-neutral-400 group-hover/logo:text-neutral-900 dark:group-hover/logo:text-white transition-colors" />
                    <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-neutral-400 group-hover/logo:text-neutral-900 dark:group-hover/logo:text-white transition-colors">
                        xiaofengqwq.com
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-neutral-200/50 dark:bg-neutral-900/60 text-neutral-500 font-mono scale-90 transition-colors">
                        枫
                    </span>
                </a>

                <button
                    onClick={toggleTheme}
                    className="p-2.5 rounded-full hover:bg-neutral-200/50 dark:hover:bg-neutral-900/50 text-neutral-400 dark:text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-all duration-500"
                >
                    {isDark ? <Moon size={16} /> : <Sun size={16} />}
                </button>
            </header>

            <div className="relative w-full max-w-6xl my-auto py-12 min-h-120">

                {/* 第一页：个人主页 (Identity) */}
                <div className={`${getPageClass(0)} grid-cols-1 md:grid-cols-3 gap-6`}>
                    <div className={`col-span-1 md:col-span-2 flex flex-col justify-between p-8 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 w-full min-h-75 select-none transition-[opacity,transform] duration-700 ease-out delay-75 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                            <div>
                                <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium">Digital Identity</span>
                                <h2 className="text-3xl font-light text-neutral-800 dark:text-neutral-100 mt-4 tracking-tight leading-none">
                                    XiaoFeng_QWQ
                                </h2>
                                <p className="text-sm font-light text-neutral-500 dark:text-neutral-400 mt-1">
                                    Full-Stack Developer & Designer
                                </p>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-6 leading-relaxed max-w-md">
                                    {githubProfile.bio}
                                </p>
                            </div>

                            {githubProfile.avatar ? (
                                <img src={githubProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-full border border-neutral-200 dark:border-neutral-800 grayscale hover:grayscale-0 transition-all duration-700 shrink-0" />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 shrink-0">
                                    <User size={24} />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 mt-8">
                            <a
                                href="https://blog.xiaofengqwq.com/"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                            >
                                <Globe size={12} />
                                <span>Blog</span>
                            </a>
                            <a
                                href="https://user.qzone.qq.com/1432777209/main"
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors group/qzone"
                            >
                                <Compass size={12} />
                                <span>QZone</span>
                            </a>
                            <a
                                href="https://www.travellings.cn/go.html"
                                target="_blank"
                                rel="noreferrer"
                                className="w-24 h-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/30 dark:bg-neutral-900/30 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all bg-no-repeat bg-center"
                                style={{
                                    backgroundImage: `url(${isDark ? 'https://www.travellings.cn/assets/b.png' : 'https://www.travellings.cn/assets/w.png'})`,
                                    backgroundSize: '80% auto'
                                }}
                                title="开往 - 友情链接"
                            />
                        </div>
                    </div>

                    <div className={`flex flex-col justify-between p-6 rounded-3xl bg-neutral-950/5 dark:bg-neutral-950/40 border border-neutral-200/30 dark:border-neutral-800/20 w-full min-h-75 select-none font-mono text-[11px] text-neutral-400 dark:text-neutral-500 transition-[opacity,transform] duration-700 ease-out delay-150 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                        <div className="flex justify-between items-center border-b border-neutral-200/50 dark:border-neutral-800/30 pb-2 mb-3">
                            <span className="text-neutral-500">identity.yml</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div className="space-y-3 leading-relaxed">
                            <p><span className="text-neutral-500">location:</span> Taipei, Taiwan</p>
                            <p><span className="text-neutral-500">domain:</span> https://xiaofengqwq.com/</p>
                            <p><span className="text-neutral-500">github:</span> XiaoFeng-QWQ</p>
                            <p><span className="text-neutral-500">repositories:</span> {githubProfile.publicRepos} public</p>
                            <p><span className="text-neutral-500">status:</span> Stay Focused.</p>
                        </div>
                    </div>
                </div>

                {/* 第二页：工作空间 (Workspace) */}
                <div className={`${getPageClass(1)} grid-cols-1 lg:grid-cols-12 gap-8`}>

                    <div className={`lg:col-span-12 w-full flex justify-center transition-[opacity,transform] duration-700 ease-out delay-50 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <form onSubmit={handleSearch} className="flex items-center w-full max-w-4xl gap-3 p-2.5 rounded-2xl border border-neutral-200/50 dark:border-neutral-800/40 bg-white/40 dark:bg-neutral-900/10 hover:bg-white/70 dark:hover:bg-neutral-900/20 focus-within:border-neutral-400 dark:focus-within:border-neutral-600 focus-within:bg-white/80 dark:focus-within:bg-neutral-900/30 shadow-sm hover:shadow focus-within:shadow-md transition-all duration-500 group outline-none">
                            <button
                                type="button"
                                onClick={() => setEngineIndex((prev) => (prev + 1) % SEARCH_ENGINES.length)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-100/80 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-all outline-none text-xs font-semibold shrink-0"
                                title="Click to switch search engine, or press Tab while focused"
                            >
                                <Globe size={13} />
                                <span>{currentEngine.name}</span>
                            </button>

                            <input
                                ref={searchInputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Search on ${currentEngine.name}...`}
                                className="flex-1 bg-transparent text-sm text-neutral-800 dark:text-neutral-100 px-2 outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-light"
                            />

                            <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono pr-2 select-none shrink-0">
                                <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/50 dark:border-neutral-800">Ctrl + K</kbd>
                                <span>to focus</span>
                            </span>

                            <button
                                type="submit"
                                className="p-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-white transition-colors outline-none shrink-0"
                            >
                                <ArrowRight size={14} />
                            </button>
                        </form>
                    </div>

                    {/* 左一栏：核心时间与备忘待办 */}
                    <section className={`lg:col-span-5 flex flex-col justify-center items-center lg:items-start select-none transition-[opacity,transform] duration-700 ease-out delay-100 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                        <span className="text-xs tracking-[0.3em] font-medium text-neutral-400 uppercase mb-4">
                            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>

                        <div className="flex flex-col sm:flex-row items-center lg:items-end gap-6 w-full mb-6">
                            <div onClick={() => setIsTwelveHour(!isTwelveHour)} className="flex items-baseline gap-2 cursor-pointer group/time shrink-0">
                                <h1 className="text-7xl md:text-8xl font-light tracking-tight text-neutral-800 dark:text-neutral-50 font-sans leading-none transition-colors group-hover/time:text-neutral-900 dark:group-hover/time:text-white">
                                    {time.toLocaleTimeString('en-US', {
                                        hour12: false,
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        ...(isTwelveHour ? { hour: 'numeric', hour12: true } : {})
                                    }).replace(/\s[A-Z]{2}/, '')}
                                </h1>
                                {isTwelveHour && (
                                    <span className="text-xl font-light font-serif text-neutral-400 group-hover/time:text-neutral-600 transition-colors uppercase">
                                        {time.getHours() >= 12 ? 'pm' : 'am'}
                                    </span>
                                )}
                            </div>
                            <div className="sm:mb-2 md:mb-3 opacity-85 hover:opacity-100 transition-opacity duration-300">
                                <TemporalArc />
                            </div>
                        </div>

                        <div className="w-full">
                            <AgendaList tasks={tasks} toggleTask={toggleTask} deleteTask={deleteTask} addTask={addTask} newTaskText={newTaskText} setNewTaskText={setNewTaskText} />
                        </div>
                    </section>

                    {/* 右一栏：环境状态面板 */}
                    <section className={`lg:col-span-7 flex flex-col gap-4 w-full transition-[opacity,transform] duration-700 ease-out delay-150 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 天气小组件 */}
                            <div className="flex flex-col justify-between p-6 rounded-3xl bg-white/40 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-700/50 transition-colors duration-700 select-none h-32">
                                <div className="flex justify-between items-start text-neutral-500 dark:text-neutral-400">
                                    <Globe size={20} />
                                    <Sun size={24} className="text-neutral-400 dark:text-neutral-300" />
                                </div>
                                <div>
                                    <p className="text-2xl font-light text-neutral-800 dark:text-neutral-200 transition-colors duration-700">
                                        {weather.temp} / {weather.cond}
                                    </p>
                                    <p className="text-xs text-neutral-500 mt-1 transition-colors duration-700">
                                        {weather.city} (IP Located)
                                    </p>
                                </div>
                            </div>

                            {/* 音乐播放器 */}
                            <div
                                className={`flex flex-col p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 w-full select-none transition-all duration-700 overflow-hidden ${isPlaylistOpen ? 'h-67.5' : 'h-32'
                                    }`}
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <div
                                        onClick={() => {
                                            if (playlist.length > 0) {
                                                setIsMusicPlaying(!isMusicPlaying);
                                            }
                                        }}
                                        className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center transition-all duration-1000 shrink-0 overflow-hidden cursor-pointer hover:scale-105"
                                        style={{
                                            animation: 'spin 10s linear infinite',
                                            animationPlayState: (isMusicPlaying && currentPage === 1) ? 'running' : 'paused'
                                        }}
                                        title={isMusicPlaying ? '点击暂停' : '点击播放'}
                                    >
                                        {musicInfo.pic ? (
                                            <img src={musicInfo.pic} alt="Album" className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <Disc3 size={24} className="text-neutral-500 dark:text-neutral-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                            {playlist.length > 0 && (
                                                <span className="text-neutral-300 dark:text-neutral-700 font-mono">
                                                    {playlistIndex + 1}/{playlist.length}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate transition-colors duration-700">{musicInfo.name}</span>
                                        <span className="text-xs text-neutral-500 dark:text-neutral-500 truncate transition-colors duration-700">{musicInfo.artist}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={handlePrevTrack}
                                                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                                title="上一首"
                                            >
                                                <SkipBack size={13} />
                                            </button>
                                            <button
                                                onClick={handleNextTrack}
                                                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                                title="下一首"
                                            >
                                                <SkipForward size={13} />
                                            </button>
                                            <button
                                                onClick={togglePiP}
                                                className={`p-1 rounded-md transition-colors ${isPiPActive
                                                    ? 'text-neutral-900 dark:text-white bg-neutral-200/50 dark:bg-neutral-800'
                                                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                                                    }`}
                                                title="开启桌面原生画中画歌词"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /><rect width="10" height="7" x="12" y="13" rx="1" /></svg>
                                            </button>
                                            <button
                                                onClick={() => setIsPlaylistOpen(!isPlaylistOpen)}
                                                className={`p-1 rounded-md transition-colors ${isPlaylistOpen
                                                    ? 'text-neutral-900 dark:text-white bg-neutral-200/50 dark:bg-neutral-800'
                                                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                                                    }`}
                                                title="歌单与歌词"
                                            >
                                                <ListMusic size={13} />
                                            </button>
                                        </div>
                                        {/* 音频频谱 */}
                                        <div className="flex items-end gap-1 h-6 opacity-50 pr-1 mt-1">
                                            <div ref={bar1Ref} className="w-0.75 h-full bg-neutral-400 dark:bg-neutral-500 origin-bottom transition-transform duration-100 ease-out" style={{ transform: 'scaleY(0.1)' }} />
                                            <div ref={bar2Ref} className="w-0.75 h-full bg-neutral-400 dark:bg-neutral-500 origin-bottom transition-transform duration-100 ease-out" style={{ transform: 'scaleY(0.1)' }} />
                                            <div ref={bar3Ref} className="w-0.75 h-full bg-neutral-400 dark:bg-neutral-500 origin-bottom transition-transform duration-100 ease-out" style={{ transform: 'scaleY(0.1)' }} />
                                            <div ref={bar4Ref} className="w-0.75 h-full bg-neutral-400 dark:bg-neutral-500 origin-bottom transition-transform duration-100 ease-out" style={{ transform: 'scaleY(0.1)' }} />
                                        </div>
                                    </div>
                                </div>

                                {isPlaylistOpen && (
                                    <div className="flex-1 mt-4 border-t border-neutral-200/50 dark:border-neutral-800/50 pt-3 flex flex-col min-h-0">
                                        <div className="flex gap-4 items-center border-b border-neutral-200/10 pb-1.5 shrink-0">
                                            <div className="flex gap-4 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                                                <button
                                                    onClick={() => setExpandedTab('playlist')}
                                                    className={`transition-colors duration-200 ${expandedTab === 'playlist' ? 'text-neutral-800 dark:text-neutral-200 border-b border-neutral-800 dark:border-neutral-200 pb-1.5' : 'hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                                >
                                                    Playlist
                                                </button>
                                                <button
                                                    onClick={() => setExpandedTab('lyrics')}
                                                    className={`transition-colors duration-200 ${expandedTab === 'lyrics' ? 'text-neutral-800 dark:text-neutral-200 border-b border-neutral-800 dark:border-neutral-200 pb-1.5' : 'hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                                >
                                                    Lyrics
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 pt-2">
                                            {expandedTab === 'playlist' ? (
                                                <div className="space-y-1.5">
                                                    {playlist.map((song, idx) => (
                                                        <div
                                                            key={song.id || idx}
                                                            onClick={() => {
                                                                setPlaylistIndex(idx);
                                                                if (!isMusicPlaying) {
                                                                    setIsMusicPlaying(true);
                                                                }
                                                            }}
                                                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-all ${idx === playlistIndex
                                                                ? 'bg-neutral-200/55 dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium'
                                                                : 'hover:bg-neutral-100/50 dark:hover:bg-neutral-900/30 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-2 truncate">
                                                                <span className="font-mono text-[9px] w-4 opacity-60">
                                                                    {String(idx + 1).padStart(2, '0')}
                                                                </span>
                                                                <span className="truncate">{song.name}</span>
                                                            </div>
                                                            <span className="text-[10px] opacity-60 shrink-0 ml-2">{song.artist}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div
                                                    ref={lyricsContainerRef}
                                                    className="h-full overflow-y-auto scrollbar-none space-y-3.5 text-center py-10"
                                                >
                                                    {lyrics.length > 0 ? (
                                                        lyrics.map((lyric, idx) => {
                                                            const isActive = idx === currentLyricIndex;
                                                            return (
                                                                <p
                                                                    key={idx}
                                                                    data-index={idx}
                                                                    className={`text-[11px] transition-all duration-300 px-4 leading-relaxed ${isActive
                                                                        ? 'text-neutral-900 dark:text-white font-semibold scale-105'
                                                                        : 'text-neutral-400/50 dark:text-neutral-600/50 hover:text-neutral-600 dark:hover:text-neutral-400'
                                                                        }`}
                                                                >
                                                                    {lyric.text}
                                                                </p>
                                                            );
                                                        })
                                                    ) : (
                                                        <p className="text-[11px] text-neutral-400/50 dark:text-neutral-600/50 italic py-6">
                                                            No lyrics found or loading...
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full">
                            <Pomodoro />
                        </div>

                    </section>
                </div>

                {/* 第三页：项目履历 (Projects) */}
                <div className={`${getPageClass(2)} grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}>
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <PixelGrid gridData={activityGrid} />
                    </div>

                    <div className="col-span-1 md:col-span-2 lg:col-span-1">
                        <RecentActivityCard events={recentEvents} />
                    </div>

                    {githubProjects.length > 0 ? (
                        githubProjects.map((project: any) => (
                            <a
                                key={project.name}
                                href={project.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex flex-col justify-between p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-700 transition-colors duration-300 group"
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium">Repository</span>
                                        <ArrowUpRight size={16} className="text-neutral-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                    </div>
                                    <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-100 transition-colors">{project.name}</h3>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-2 leading-relaxed">
                                        {project.desc}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-6 text-[10px] font-mono text-neutral-500">
                                    <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${project.color}`}></span>{project.lang}</span>
                                </div>
                            </a>
                        ))
                    ) : (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="animate-pulse flex flex-col justify-between p-6 rounded-3xl bg-neutral-200/20 dark:bg-neutral-800/10 border border-neutral-200/50 dark:border-neutral-800/40 h-44" />
                        ))
                    )}
                </div>

                {/* 第四页：技术栈架构 (Tech Stack) */}
                <div className={`${getPageClass(3)} grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`}>
                    {['React / Next.js', 'TypeScript', 'Tailwind v4', 'Vite', 'Node.js', 'Git Engine', 'MySQL', 'PHP'].map((tech, idx) => (
                        <div
                            key={tech}
                            style={{ transitionDelay: `${idx * 60}ms` }}
                            className={`flex flex-col justify-between p-6 rounded-2xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 hover:border-neutral-400 dark:hover:border-neutral-700 transition-[opacity,transform] duration-500 ease-out select-none group ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                                }`}
                        >
                            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-900/50 flex items-center justify-center text-neutral-400 dark:text-semibold group-hover:text-neutral-900 dark:group-hover:text-neutral-100 transition-all">
                                <Command size={14} />
                            </div>
                            <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 mt-6 group-hover:text-neutral-800 dark:group-hover:text-neutral-200 transition-colors">
                                {tech}
                            </span>
                        </div>
                    ))}
                </div>

            </div>

            {/* 底部悬浮固定行动坞 */}
            <footer className={`fixed bottom-8 inset-x-0 flex justify-center z-30 select-none pointer-events-none transition-all duration-1200 ease-[cubic-bezier(0.16,1,0.3,1)] delay-500 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}>
                <div
                    ref={dockRef}
                    onMouseEnter={handleDockMouseEnter}
                    onMouseMove={handleDockMouseMove}
                    onMouseLeave={() => setDockMouseX(null)}
                    className="pointer-events-auto flex items-end gap-3 px-4 py-2.5 rounded-3xl bg-white/30 dark:bg-neutral-900/20 backdrop-blur-2xl border border-neutral-200/50 dark:border-neutral-800/50 shadow-2xl transition-all duration-700 hover:py-3"
                >
                    {DOCK_PAGES.map((item, i) => {
                        const isActive = currentPage === item.id;

                        return (
                            <div
                                key={item.name}
                                style={getDynamicScaleStyle(i)}
                                className="group flex flex-col items-center justify-end origin-bottom transition-all duration-200 ease-out"
                            >
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (currentPage !== item.id) {
                                            navigate(item.path);
                                        }
                                    }}
                                    className={`p-3.5 rounded-2xl relative transition-all duration-300 ${isActive
                                        ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50 shadow-lg shadow-neutral-200/50 dark:shadow-neutral-950/50 border border-neutral-200/60 dark:border-neutral-700/60'
                                        : 'bg-white/10 dark:bg-neutral-950/20 text-neutral-400 dark:text-neutral-500 hover:bg-white/40 dark:hover:bg-neutral-800/40 hover:text-neutral-950 dark:hover:text-neutral-100 border border-transparent hover:border-neutral-200/30 dark:hover:border-neutral-800/30'
                                        }`}
                                    title={item.name}
                                >
                                    <item.icon size={18} className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />

                                    <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-neutral-900/90 dark:bg-neutral-100/90 text-[10px] text-white dark:text-neutral-900 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 shadow-md font-medium whitespace-nowrap scale-75 group-hover:scale-100 z-20">
                                        {item.name}
                                    </span>
                                </button>
                            </div>
                        );
                    })}
                </div>
            </footer>

        </div>
    );
}

export default function App() {
    return (
        <HashRouter>
            <AppContent />
        </HashRouter>
    );
}