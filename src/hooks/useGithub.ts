import { useState, useEffect } from 'react';
import type { GithubProfile, GithubProject, DayContribution, GitHubActivity } from '../types';
import { getLangColor } from '../constants';

/**
 * GitHub 数据获取 Hook
 * 获取用户资料、项目列表、贡献日历和活动记录
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

    useEffect(() => {
        // 获取用户资料
        fetch('https://api.github.com/users/XiaoFeng-QWQ')
            .then(r => r.json())
            .then(data => {
                if (data && data.login) {
                    setGithubProfile({
                        avatar: data.avatar_url,
                        bio: data.bio || 'Full-Stack Developer & Designer',
                        publicRepos: data.public_repos || 0,
                        location: 'Hebei, ShiJiaZhang, China'
                    });
                }
            })
            .catch(err => console.error(err));

        // 获取项目列表
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

        // 获取活动记录
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

        // 获取贡献日历
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
                // 生成模拟数据
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

    return {
        githubProfile,
        githubProjects,
        activityGrid,
        recentEvents
    };
};