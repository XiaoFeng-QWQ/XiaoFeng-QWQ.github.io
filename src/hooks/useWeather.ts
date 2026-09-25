import { useState, useEffect, useCallback } from 'react';
import type { WeatherData, LoadState } from '../types';

/**
 * 天气数据获取 Hook
 * 自动获取并更新天气信息，并带出加载 / 成功 / 失败三态
 */
export const useWeather = () => {
    const [weather, setWeather] = useState<WeatherData>({
        temp: '-°C',
        city: '-',
        cond: '-'
    });
    const [status, setStatus] = useState<LoadState>('loading');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        fetch('https://api.xiaofengqwq.com/api/v1/tools/weather?type=now')
            .then(r => r.json())
            .then(res => {
                if (cancelled) return;
                if (res.code === 200 && res.data) {
                    const d = res.data;
                    const temp = d.now?.temp || d.temp || '24';
                    const city = d.city || d.cityName || 'Taipei';
                    const cond = d.now?.text || d.weather || 'Clear';
                    setWeather({ temp: `${temp}°C`, city, cond });
                    setStatus('ready');
                } else {
                    setStatus('error');
                }
            })
            .catch(err => {
                console.error(err);
                if (!cancelled) setStatus('error');
            });

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    /** 重新拉取天气 */
    const reloadWeather = useCallback(() => {
        setStatus('loading');
        setReloadKey(key => key + 1);
    }, []);

    return { weather, status, reloadWeather };
};
