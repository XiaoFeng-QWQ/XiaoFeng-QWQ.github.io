import { useState, useEffect, useRef } from 'react';
import { Coffee, Play, Pause, RotateCcw } from 'lucide-react';

/**
 * 番茄工作钟组件
 * 提供工作和休息两种模式的计时器
 */
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

        // 播放提示音
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
        <div className="flex flex-col justify-between p-6 rounded-3xl bg-neutral-950/5 dark:bg-neutral-950/40 border border-neutral-200/30 dark:border-neutral-800/20 hover:border-neutral-300 dark:hover:border-neutral-700 w-full h-44 select-none relative overflow-hidden transition-all duration-700">
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

export default Pomodoro;