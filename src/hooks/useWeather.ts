import { useState, useEffect } from 'react';
import type { WeatherData } from '../types';

/**
 * 天气数据获取 Hook
 * 自动获取并更新天气信息
 */
export const useWeather = () => {
    const [weather, setWeather] = useState<WeatherData>({
        temp: '-°C',
        city: '-',
        cond: '-'
    });

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

    return weather;
};