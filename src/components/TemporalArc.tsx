import { useState, useEffect } from 'react';

/**
 * 太阳轨迹动态动效组件
 * 根据当前时间显示太阳在天空中的位置轨迹
 */
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

export default TemporalArc;