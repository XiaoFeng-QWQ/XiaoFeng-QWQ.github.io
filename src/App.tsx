import { useState, useEffect, useRef, type FormEvent } from 'react';
import { HashRouter, useLocation, useNavigate } from 'react-router-dom';
import {
    Globe, Sun, Moon, Command, ArrowRight, Disc3, User, ArrowUpRight, Compass, SkipForward, SkipBack, ListMusic
} from 'lucide-react';

// 导入常量配置
import { SEARCH_ENGINES, DOCK_PAGES, TECH_STACK } from './constants';

// 导入工具函数
import { createRootDir } from './utils/vfs';

// 导入自定义 Hooks
import { useTheme } from './hooks/useTheme';
import { useTasks } from './hooks/useTasks';
import { useWeather } from './hooks/useWeather';
import { useGithub } from './hooks/useGithub';
import { useMusicPlayer } from './hooks/useMusicPlayer';
import { useTerminal } from './hooks/useTerminal';

// 导入组件
import TemporalArc from './components/TemporalArc';
import PixelGrid from './components/PixelGrid';
import RecentActivityCard from './components/RecentActivityCard';
import Pomodoro from './components/Pomodoro';
import AgendaList from './components/AgendaList';

// 应用核心逻辑组件
function AppContent() {
    const [time, setTime] = useState(new Date());
    const [query, setQuery] = useState('');
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [isMounted, setIsMounted] = useState(false);
    
    // 自定义鼠标指针状态
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [cursorVisible, setCursorVisible] = useState(true);

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

    const [dockWidth, setDockWidth] = useState(240);
    const [dockMouseX, setDockMouseX] = useState<number | null>(null);

    // 使用自定义 Hooks
    const { isDark, toggleTheme } = useTheme();
    const { tasks, newTaskText, setNewTaskText, toggleTask, addTask, deleteTask } = useTasks();
    const weather = useWeather();
    const { githubProfile, githubProjects, activityGrid, recentEvents } = useGithub();

    // 路由相关状态
    const location = useLocation();
    const navigate = useNavigate();

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

    // 音乐播放器 Hook
    const musicPlayer = useMusicPlayer(currentPage);

    // 虚拟文件系统和终端 Hook
    const [rootDir] = useState(() => createRootDir(githubProfile));
    const terminal = useTerminal(rootDir);

    // 自定义鼠标指针事件监听
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setCursorPos({ x: e.clientX, y: e.clientY });
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.matches('a, button, input, [role="button"], .clickable')) {
                setIsHovering(true);
            } else {
                setIsHovering(false);
            }
        };

        // 触摸设备隐藏自定义指针
        const handleTouchStart = () => setCursorVisible(false);
        const handleTouchEnd = () => setCursorVisible(true);

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('mouseover', handleMouseOver);
        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    // DOM 元素引用
    const dockRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement | null>(null);

    // 频谱动画条引用
    const bar1Ref = useRef<HTMLDivElement>(null);
    const bar2Ref = useRef<HTMLDivElement>(null);
    const bar3Ref = useRef<HTMLDivElement>(null);
    const bar4Ref = useRef<HTMLDivElement>(null);

    // 状态变化同步至本地存储
    useEffect(() => {
        localStorage.setItem('workspace_search_engine', String(engineIndex));
    }, [engineIndex]);

    useEffect(() => {
        localStorage.setItem('workspace_clock_12h', String(isTwelveHour));
    }, [isTwelveHour]);

    // 动效频谱实时渲染逻辑
    const updateSpectrum = () => {
        if (!musicPlayer.isMusicPlaying) {
            if (bar1Ref.current) bar1Ref.current.style.transform = 'scaleY(0.1)';
            if (bar2Ref.current) bar2Ref.current.style.transform = 'scaleY(0.1)';
            if (bar3Ref.current) bar3Ref.current.style.transform = 'scaleY(0.1)';
            if (bar4Ref.current) bar4Ref.current.style.transform = 'scaleY(0.1)';
            return;
        }

        let h1 = 2, h2 = 2, h3 = 2, h4 = 2;

        if (musicPlayer.analyserRef.current) {
            const dataArray = new Uint8Array(musicPlayer.analyserRef.current.frequencyBinCount);
            musicPlayer.analyserRef.current.getByteFrequencyData(dataArray);

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

        if (bar1Ref.current) bar1Ref.current.style.transform = `scaleY(${h1 / 24})`;
        if (bar2Ref.current) bar2Ref.current.style.transform = `scaleY(${h2 / 24})`;
        if (bar3Ref.current) bar3Ref.current.style.transform = `scaleY(${h3 / 24})`;
        if (bar4Ref.current) bar4Ref.current.style.transform = `scaleY(${h4 / 24})`;

        musicPlayer.animationFrameRef.current = requestAnimationFrame(updateSpectrum);
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (musicPlayer.isMusicPlaying) {
            if (musicPlayer.animationFrameRef.current) {
                cancelAnimationFrame(musicPlayer.animationFrameRef.current);
            }
            updateSpectrum();
        } else {
            if (musicPlayer.animationFrameRef.current) {
                cancelAnimationFrame(musicPlayer.animationFrameRef.current);
                musicPlayer.animationFrameRef.current = null;
            }
            if (bar1Ref.current) bar1Ref.current.style.transform = 'scaleY(0.1)';
            if (bar2Ref.current) bar2Ref.current.style.transform = 'scaleY(0.1)';
            if (bar3Ref.current) bar3Ref.current.style.transform = 'scaleY(0.1)';
            if (bar4Ref.current) bar4Ref.current.style.transform = 'scaleY(0.1)';
        }

        return () => {
            if (musicPlayer.animationFrameRef.current) {
                cancelAnimationFrame(musicPlayer.animationFrameRef.current);
            }
        };
    }, [musicPlayer.isMusicPlaying]);

    // 画中画歌词同步
    useEffect(() => {
        if (!musicPlayer.isPiPActive || !musicPlayer.pipRootRef.current) return;

        const root = musicPlayer.pipRootRef.current;
        root.className = `w-full h-full flex flex-col justify-center items-center overflow-hidden p-3 select-none text-center ${isDark ? 'bg-[#060606] text-white' : 'bg-[#fafafa] text-neutral-900'
            }`;

        const currentLine = musicPlayer.lyrics[musicPlayer.currentLyricIndex]?.text || ' ';
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
    }, [musicPlayer.currentLyricIndex, musicPlayer.lyrics, isDark, musicPlayer.isPiPActive]);

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
            musicPlayer.setIsPiPActive(false);
            musicPlayer.pipRootRef.current = null;
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

            musicPlayer.pipRootRef.current = pipDiv;
            musicPlayer.setIsPiPActive(true);

            const currentLine = musicPlayer.lyrics[musicPlayer.currentLyricIndex]?.text || ' ';
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
                musicPlayer.setIsPiPActive(false);
                musicPlayer.pipRootRef.current = null;
            });
        } catch (err) {
            console.error("Document Picture-in-Picture failed", err);
        }
    };

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

    const currentEngine = SEARCH_ENGINES[engineIndex];

    return (
        <div
            onMouseMove={handleMouseMove}
            className="min-h-screen w-full relative flex flex-col items-center justify-between pt-12 pb-28 px-6 lg:px-12 overflow-hidden bg-[#fafafa] dark:bg-[#060606] text-neutral-900 dark:text-white transition-colors duration-1000 selection:bg-neutral-200 dark:selection:bg-neutral-800"
        >
            {/* 自定义鼠标指针 */}
            {cursorVisible && (
                <>
                    <div
                        className={`cursor-ring ${isHovering ? 'hover' : ''} ${isClicking ? 'click' : ''}`}
                        style={{ left: cursorPos.x, top: cursorPos.y }}
                    />
                    <div
                        className={`cursor-dot ${isHovering ? 'hover' : ''} ${isClicking ? 'click' : ''}`}
                        style={{ left: cursorPos.x, top: cursorPos.y }}
                    />
                </>
            )}

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
                <div className={`${getPageClass(0)} grid-cols-1`}>
                    <div className={`flex flex-col justify-between p-8 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 w-full select-none transition-all duration-700 ease-out delay-75 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>

                        {/* 内部双栏布局 */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">

                            {/* 左侧：个人信息栏 */}
                            <div className="lg:col-span-5 flex flex-col justify-between min-h-75">
                                <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
                                    <div>
                                        <span className="text-[10px] tracking-widest uppercase text-neutral-400 font-medium">Digital Identity</span>
                                        <h2 className="text-3xl font-light text-neutral-800 dark:text-neutral-100 mt-4 tracking-tight leading-none">
                                            XiaoFeng_QWQ
                                        </h2>
                                        <p className="text-sm font-light text-neutral-500 dark:text-neutral-400 mt-1">
                                            Full-Stack Developer & Designer
                                        </p>
                                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-6 leading-relaxed max-w-sm">
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

                                <div className="flex flex-wrap gap-3 mt-8 lg:mt-auto">
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
                                        className="flex items-center gap-2 px-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/40 hover:border-neutral-400 dark:hover:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                                    >
                                        <Compass size={12} />
                                        <span>QZone</span>
                                    </a>
                                    <a
                                        href="https://www.travellings.cn/go.html"
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-24 h-8 rounded-xl border border-neutral-200/20 dark:border-neutral-800/20 bg-neutral-100/30 dark:bg-neutral-900/30 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all bg-no-repeat bg-center"
                                        style={{
                                            backgroundImage: `url(${isDark ? 'https://www.travellings.cn/assets/b.png' : 'https://www.travellings.cn/assets/w.png'})`,
                                            backgroundSize: '80% auto'
                                        }}
                                        title="开往 - 友情链接"
                                    />
                                </div>
                            </div>

                            {/* 右侧：终端 */}
                            <div
                                onClick={() => terminal.terminalInputRef.current?.focus()}
                                className="lg:col-span-7 flex flex-col p-6 rounded-2xl bg-neutral-100/20 dark:bg-neutral-950/20 border border-neutral-200/40 dark:border-neutral-800/30 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-700 cursor-text w-full min-h-75 select-none font-mono text-[11px]"
                            >
                                <div className="flex justify-between items-center border-b border-neutral-200/50 dark:border-neutral-800/30 pb-2.5 mb-3.5 shrink-0 select-none">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300/80 dark:bg-neutral-700/80 bg-red-400/90 transition-colors"></span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300/80 dark:bg-neutral-700/80 bg-yellow-400/90 transition-colors"></span>
                                        <span className="w-2.5 h-2.5 rounded-full bg-neutral-300/80 dark:bg-neutral-700/80 bg-emerald-400/90 transition-colors"></span>
                                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-1.5 font-sans">Windows PowerShell 7.6.3</span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto scrollbar-none pr-1 space-y-2 text-neutral-600 dark:text-neutral-300 font-mono text-[11px] max-h-55 leading-relaxed">
                                    {terminal.terminalHistory.map((line) => {
                                        if (line.type === 'input') {
                                            return (
                                                <div key={line.id} className="flex items-start gap-1 text-blue-600 dark:text-blue-400 group/input">
                                                    <span className="shrink-0 select-none opacity-80">PS </span>
                                                    <span className="wrap-break-word font-semibold select-text">{line.text}</span>
                                                </div>
                                            );
                                        }
                                        if (line.type === 'system') {
                                            return (
                                                <p key={line.id} className="text-neutral-400 dark:text-neutral-500 italic select-none">
                                                    {line.text}
                                                </p>
                                            );
                                        }
                                        if (line.type === 'error') {
                                            return (
                                                <pre key={line.id} className="wrap-break-word pl-2 text-red-500 dark:text-red-400 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text selection:bg-red-500/30">
                                                    {line.text}
                                                </pre>
                                            );
                                        }
                                        return (
                                            <pre key={line.id} className="wrap-break-word pl-2 text-neutral-600 dark:text-neutral-300 font-mono text-[11px] leading-relaxed whitespace-pre-wrap select-text">
                                                {line.text}
                                            </pre>
                                        );
                                    })}
                                    <div ref={terminal.terminalBottomRef} />
                                </div>

                                <form onSubmit={terminal.handleTerminalSubmit} className="mt-3 pt-2.5 border-t border-neutral-200/40 dark:border-neutral-800/20 flex items-center gap-1.5 shrink-0">
                                    <span className="text-blue-600 dark:text-blue-400 select-none font-bold">
                                        {terminal.promptState ? `Path[${terminal.promptState.step}]:` : `PS ${terminal.currentPath.join('\\')}>`}
                                    </span>
                                    <div className="flex-1 flex items-center relative overflow-hidden">
                                        {/* 补全提示 - 显示在光标后面 */}
                                        {terminal.completionSuggestion && (
                                            <span className="text-neutral-400/50 dark:text-neutral-500/50 font-mono text-[11px] italic absolute select-none pointer-events-none whitespace-pre ml-1" style={{ left: `${(terminal.terminalInput.length + 1) * 6.6}px` }}>
                                                {terminal.completionSuggestion}
                                            </span>
                                        )}
                                        <input
                                            ref={terminal.terminalInputRef}
                                            type="text"
                                            value={terminal.terminalInput}
                                            onChange={(e) => terminal.setTerminalInput(e.target.value)}
                                            onKeyDown={terminal.handleKeyDown}
                                            placeholder={terminal.promptState ? 'Enter path...' : 'Type command (e.g. ls, cd documents, cat about.txt)...'}
                                            className="w-full bg-transparent border-none outline-none text-neutral-800 dark:text-neutral-100 font-mono text-[11px] p-0 focus:ring-0 placeholder:text-neutral-400/50 caret-transparent"
                                            autoComplete="off"
                                        />
                                        {/* 光标 */}
                                        <span className="w-1 h-3.5 bg-neutral-500 dark:bg-neutral-400 animate-pulse absolute left-0 top-px pointer-events-none" style={{ transform: `translateX(${terminal.terminalInput.length * 6.6}px)` }} />
                                    </div>
                                </form>
                            </div>

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
                            <AgendaList
                                tasks={tasks}
                                toggleTask={toggleTask}
                                deleteTask={deleteTask}
                                addTask={addTask}
                                newTaskText={newTaskText}
                                setNewTaskText={setNewTaskText}
                            />
                        </div>
                    </section>

                    {/* 右一栏：环境状态面板 */}
                    <section className={`lg:col-span-7 flex flex-col gap-4 w-full transition-[opacity,transform] duration-700 ease-out delay-150 ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 天气小组件 */}
                            <div className="flex flex-col justify-between p-6 rounded-3xl bg-white/40 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/50 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-700 select-none h-32">
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
                                className={`flex flex-col p-6 rounded-3xl bg-white/2 dark:bg-neutral-900/15 border border-neutral-200/50 dark:border-neutral-800/40 hover:border-neutral-300 dark:hover:border-neutral-700 w-full select-none transition-all duration-700 overflow-hidden ${musicPlayer.isPlaylistOpen ? 'h-67.5' : 'h-32'
                                    }`}
                            >
                                <div className="flex items-center gap-4 w-full">
                                    <div
                                        onClick={() => {
                                            if (musicPlayer.playlist.length > 0) {
                                                musicPlayer.setIsMusicPlaying(!musicPlayer.isMusicPlaying);
                                            }
                                        }}
                                        className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center transition-all duration-1000 shrink-0 overflow-hidden cursor-pointer hover:scale-105"
                                        style={{
                                            animation: 'spin 10s linear infinite',
                                            animationPlayState: (musicPlayer.isMusicPlaying && currentPage === 1) ? 'running' : 'paused'
                                        }}
                                        title={musicPlayer.isMusicPlaying ? '点击暂停' : '点击播放'}
                                    >
                                        {musicPlayer.musicInfo.pic ? (
                                            <img src={musicPlayer.musicInfo.pic} alt="Album" className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <Disc3 size={24} className="text-neutral-500 dark:text-neutral-400" />
                                        )}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                            {musicPlayer.playlist.length > 0 && (
                                                <span className="text-neutral-300 dark:text-neutral-700 font-mono">
                                                    {musicPlayer.playlistIndex + 1}/{musicPlayer.playlist.length}
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate transition-colors duration-700">{musicPlayer.musicInfo.name}</span>
                                        <span className="text-xs text-neutral-500 dark:text-neutral-500 truncate transition-colors duration-700">{musicPlayer.musicInfo.artist}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={musicPlayer.handlePrevTrack}
                                                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                                title="上一首"
                                            >
                                                <SkipBack size={13} />
                                            </button>
                                            <button
                                                onClick={musicPlayer.handleNextTrack}
                                                className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                                                title="下一首"
                                            >
                                                <SkipForward size={13} />
                                            </button>
                                            <button
                                                onClick={togglePiP}
                                                className={`p-1 rounded-md transition-colors ${musicPlayer.isPiPActive
                                                    ? 'text-neutral-900 dark:text-white bg-neutral-200/50 dark:bg-neutral-800'
                                                    : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                                                    }`}
                                                title="开启桌面原生画中画歌词"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 9V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4" /><rect width="10" height="7" x="12" y="13" rx="1" /></svg>
                                            </button>
                                            <button
                                                onClick={() => musicPlayer.setIsPlaylistOpen(!musicPlayer.isPlaylistOpen)}
                                                className={`p-1 rounded-md transition-colors ${musicPlayer.isPlaylistOpen
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

                                {musicPlayer.isPlaylistOpen && (
                                    <div className="flex-1 mt-4 border-t border-neutral-200/50 dark:border-neutral-800/50 pt-3 flex flex-col min-h-0">
                                        <div className="flex gap-4 items-center border-b border-neutral-200/10 pb-1.5 shrink-0">
                                            <div className="flex gap-4 text-[10px] uppercase tracking-wider font-semibold text-neutral-400 dark:text-neutral-500">
                                                <button
                                                    onClick={() => musicPlayer.setExpandedTab('playlist')}
                                                    className={`transition-colors duration-200 ${musicPlayer.expandedTab === 'playlist' ? 'text-neutral-800 dark:text-neutral-200 border-b border-neutral-800 dark:border-neutral-200 pb-1.5' : 'hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                                >
                                                    Playlist
                                                </button>
                                                <button
                                                    onClick={() => musicPlayer.setExpandedTab('lyrics')}
                                                    className={`transition-colors duration-200 ${musicPlayer.expandedTab === 'lyrics' ? 'text-neutral-800 dark:text-neutral-200 border-b border-neutral-800 dark:border-neutral-200 pb-1.5' : 'hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                                >
                                                    Lyrics
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 pt-2">
                                            {musicPlayer.expandedTab === 'playlist' ? (
                                                <div className="space-y-1.5">
                                                    {musicPlayer.playlist.map((song, idx) => (
                                                        <div
                                                            key={song.id || idx}
                                                            onClick={() => musicPlayer.selectSong(idx)}
                                                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl cursor-pointer text-xs transition-all ${idx === musicPlayer.playlistIndex
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
                                                    ref={musicPlayer.lyricsContainerRef}
                                                    className="h-full overflow-y-auto scrollbar-none space-y-3.5 text-center py-10"
                                                >
                                                    {musicPlayer.lyrics.length > 0 ? (
                                                        musicPlayer.lyrics.map((lyric, idx) => {
                                                            const isActive = idx === musicPlayer.currentLyricIndex;
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
                        githubProjects.map((project) => (
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
                    {TECH_STACK.map((tech, idx) => (
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