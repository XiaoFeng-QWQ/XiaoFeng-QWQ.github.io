import { useState, useEffect, useCallback } from 'react';
import type { GithubProfile, GithubProject, DayContribution, GitHubActivity, LoadState } from '../types';
import { getLangColor } from '../constants';

/** 各项 GitHub 数据的加载状态 */
export interface GithubStatus {
    profile: LoadState;
    projects: LoadState;
    activity: LoadState;
    events: LoadState;
}

const INITIAL_STATUS: GithubStatus = {
    profile: 'loading',
    projects: 'loading',
    activity: 'loading',
    events: 'loading'
};

/**
 * GitHub 数据获取 Hook
 * 获取用户资料、项目列表、贡献日历和活动记录。
 * 每项数据都带独立加载状态与来源标记，失败不再只留空白。
 */
export const useGithub = () => {
    const [githubProfile, setGithubProfile] = useState<GithubProfile>({
        avatar: '',
        bio: 'Full-Stack Developer & Designer',
        publicRepos: 0,
        location: 'Hebei, ShiJiaZhang, China'
    });

    const [githubProjects, setGithubProjects] = useState<GithubProject[]>([]);
    const [activityGrid, setActivityGrid] = useState<DayContribution[]>([]);
    const [recentEvents, setRecentEvents] = useState<GitHubActivity[]>([]);
    const [status, setStatus] = useState<GithubStatus>(INITIAL_STATUS);
    /** 贡献图在接口失败时会用模拟数据兜底，界面上需要如实标注 */
    const [activitySource, setActivitySource] = useState<'live' | 'sample'>('live');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const mark = (key: keyof GithubStatus, value: LoadState) =>
            setStatus(prev => ({ ...prev, [key]: value }));

        // 获取用户资料
        fetch('https://api.github.com/users/XiaoFeng-QWQ')
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                if (data && data.login) {
                    setGithubProfile({
                        avatar: data.avatar_url,
                        bio: data.bio || 'Full-Stack Developer & Designer',
                        publicRepos: data.public_repos || 0,
                        location: 'Hebei, ShiJiaZhang, China'
                    });
                    mark('profile', 'ready');
                } else {
                    mark('profile', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                if (!cancelled) mark('profile', 'error');
            });

        // 获取项目列表
        fetch('https://api.github.com/users/XiaoFeng-QWQ/repos?sort=updated&per_page=6')
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
                if (Array.isArray(data)) {
                    setGithubProjects(data.slice(0, 3).map(repo => ({
                        name: repo.name,
                        desc: repo.description || 'No description provided.',
                        lang: repo.language || 'TypeScript',
                        url: repo.html_url,
                        color: getLangColor(repo.language || 'TypeScript')
                    })));
                    mark('projects', 'ready');
                } else {
                    mark('projects', 'error');
                }
            })
            .catch(err => {
                console.error(err);
                if (!cancelled) mark('projects', 'error');
            });

        // 获取活动记录
        fetch('https://api.github.com/users/XiaoFeng-QWQ/events?per_page=10')
            .then(r => r.json())
            .then(data => {
                if (cancelled) return;
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
                    mark('events', 'ready');
                } else {
                    mark('events', 'error');
                }
            })
            .catch(err => {
                console.error("Failed to fetch events:", err);
                if (!cancelled) mark('events', 'error');
            });

        // 获取贡献日历
        fetch('https://github-contributions-api.jogruber.de/v4/XiaoFeng-QWQ?y=last')
            .then(r => r.json())
            .then(res => {
                if (cancelled) return;
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
                    setActivitySource('live');
                    mark('activity', 'ready');
                } else {
                    throw new Error("Invalid format");
                }
            })
            .catch(() => {
                if (cancelled) return;
                // 生成模拟数据兜底（界面上会标注为 sample）
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
                setActivitySource('sample');
                mark('activity', 'error');
            });

        return () => {
            cancelled = true;
        };
    }, [reloadKey]);

    /** 重新拉取全部 GitHub 数据 */
    const reloadGithub = useCallback(() => {
        setStatus(INITIAL_STATUS);
        setReloadKey(key => key + 1);
    }, []);

    return {
        githubProfile,
        githubProjects,
        activityGrid,
        recentEvents,
        status,
        activitySource,
        reloadGithub
    };
};
