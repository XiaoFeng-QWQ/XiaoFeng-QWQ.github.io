import { useState, useEffect, useRef } from 'react';
import type { Song, MusicInfo, LyricLine } from '../types';
import { parseLRC } from '../utils/terminalHelpers';

export type PlayMode = 'sequence' | 'single' | 'shuffle';

// 播放器全量状态存储 Key
const MUSIC_STATE_KEY = 'musicPlayerState';

// 播放器持久化状态结构
interface PersistedMusicState {
    playlist: Song[];
    playlistIndex: number;
    isPlaylistOpen: boolean;
    expandedTab: 'playlist' | 'lyrics';
    playMode: PlayMode;
    isMusicPlaying: boolean;
}

// 从 localStorage 读取并校验持久化状态
const loadPersistedState = (): Partial<PersistedMusicState> | null => {
    try {
        const raw = localStorage.getItem(MUSIC_STATE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return null;
        return parsed as Partial<PersistedMusicState>;
    } catch (e) {
        console.error('Failed to load music player state', e);
        return null;
    }
};

/**
 * 音乐播放器 Hook
 * 提供音乐播放控制、歌词同步、播放顺序等功能
 * 支持全量状态持久化到 localStorage，刷新页面后恢复播放现场
 */
export const useMusicPlayer = (_currentPage: number) => {
    // 初始化时优先加载持久化状态
    const [restored] = useState<Partial<PersistedMusicState> | null>(() => loadPersistedState());
    const [playlist, setPlaylist] = useState<Song[]>(restored?.playlist ?? []);
    const [playlistIndex, setPlaylistIndex] = useState(restored?.playlistIndex ?? 0);
    const [isPlaylistOpen, setIsPlaylistOpen] = useState(restored?.isPlaylistOpen ?? false);
    const [expandedTab, setExpandedTab] = useState<'playlist' | 'lyrics'>(restored?.expandedTab ?? 'playlist');
    const [musicInfo, setMusicInfo] = useState<MusicInfo>({
        name: 'Loading...',
        artist: 'Please wait',
        pic: '',
        url: ''
    });
    const [isMusicPlaying, setIsMusicPlaying] = useState(restored?.isMusicPlaying ?? false);
    const [playMode, setPlayMode] = useState<PlayMode>(restored?.playMode ?? 'sequence');

    // 歌词状态
    const [lyrics, setLyrics] = useState<LyricLine[]>([]);
    const [audioCurrentTime, setAudioCurrentTime] = useState(0);
    const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);

    // DOM 元素引用
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    // 音频分析器引用
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const isPlayingRef = useRef(isMusicPlaying);
    useEffect(() => {
        isPlayingRef.current = isMusicPlaying;
    }, [isMusicPlaying]);

    // 全量状态持久化：任意关键状态变化时写入 localStorage
    useEffect(() => {
        if (!playlist || playlist.length === 0) return;
        try {
            const state: PersistedMusicState = {
                playlist,
                playlistIndex,
                isPlaylistOpen,
                expandedTab,
                playMode,
                isMusicPlaying
            };
            localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify(state));
        } catch (e) {
            console.error('Failed to save music player state', e);
        }
    }, [playlist, playlistIndex, isPlaylistOpen, expandedTab, playMode, isMusicPlaying]);

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

    // 获取歌单列表
    useEffect(() => {
        // 已有持久化的歌单状态时，跳过覆盖，以保留播放现场
        if (restored?.playlist && restored.playlist.length > 0) {
            return;
        }
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

    // 切换歌曲时更新信息和歌词
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

    // 音频播放器实例管理
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
            audio.loop = playMode === 'single';

            const handleTimeUpdate = () => {
                setAudioCurrentTime(audio.currentTime);
            };

            const handleEnded = () => {
                if (playMode === 'single') {
                    return;
                }
                if (playMode === 'shuffle') {
                    const randomIndex = Math.floor(Math.random() * playlist.length);
                    setPlaylistIndex(randomIndex);
                } else {
                    setPlaylistIndex(prev => (prev + 1) % playlist.length);
                }
            };

            audio.addEventListener('timeupdate', handleTimeUpdate);
            audio.addEventListener('ended', handleEnded);
            audioRef.current = audio;

            if (isMusicPlaying) {
                initAnalyser();
                audio.play().catch(() => setIsMusicPlaying(false));
            }

            return () => {
                audio.removeEventListener('timeupdate', handleTimeUpdate);
                audio.removeEventListener('ended', handleEnded);
                audio.pause();
            };
        }
    }, [musicInfo.url]);

    // 播放/暂停控制
    useEffect(() => {
        if (!audioRef.current) return;
        if (isMusicPlaying) {
            initAnalyser();
            audioRef.current.play().catch(() => setIsMusicPlaying(false));
        } else {
            audioRef.current.pause();
        }
    }, [isMusicPlaying]);

    // 系统媒体中心集成
    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = isMusicPlaying ? 'playing' : 'paused';
        }
    }, [isMusicPlaying]);

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

    // 计算当前高亮歌词行索引
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

    // 歌词平滑滚动
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

    // 切换上一首/下一首
    const handleNextTrack = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (playlist.length === 0) return;
        setPlaylistIndex(prev => (prev + 1) % playlist.length);
    };

    const handlePrevTrack = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (playlist.length === 0) return;
        setPlaylistIndex(prev => (prev - 1 + playlist.length) % playlist.length);
    };

    // 选择特定歌曲
    const selectSong = (index: number) => {
        setPlaylistIndex(index);
        if (!isMusicPlaying) {
            setIsMusicPlaying(true);
        }
    };

    // 切换播放模式
    const togglePlayMode = () => {
        setPlayMode(prev => {
            if (prev === 'sequence') return 'single';
            if (prev === 'single') return 'shuffle';
            return 'sequence';
        });
    };

    // 返回所有状态和方法
    return {
        playlist,
        playlistIndex,
        isPlaylistOpen,
        setIsPlaylistOpen,
        expandedTab,
        setExpandedTab,
        musicInfo,
        isMusicPlaying,
        setIsMusicPlaying,
        lyrics,
        currentLyricIndex,
        playMode,
        lyricsContainerRef,
        audioRef,
        audioContextRef,
        analyserRef,
        sourceRef,
        animationFrameRef,
        handleNextTrack,
        handlePrevTrack,
        selectSong,
        togglePlayMode,
        initAnalyser
    };
};