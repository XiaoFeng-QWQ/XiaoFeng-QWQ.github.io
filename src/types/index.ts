/**
 * GitHub 贡献日历数据接口
 */
export interface DayContribution {
    level: number;
    count: number;
}

/**
 * GitHub 活动事件接口
 */
export interface GitHubActivity {
    id: string;
    action: string;
    repo: string;
    date: string;
}

/**
 * 歌词行接口
 */
export interface LyricLine {
    time: number;
    text: string;
}

/**
 * 待办任务接口
 */
export interface Task {
    id: number;
    text: string;
    done: boolean;
}

/**
 * 终端行接口
 */
export interface TerminalLine {
    type: 'input' | 'output' | 'system' | 'error';
    text: string;
    id: string;
}

/**
 * 虚拟文件系统 - 文件节点
 */
export interface FSFile {
    type: 'file';
    name: string;
    lastWriteTime: string;
    content: string | (() => string);
}

/**
 * 虚拟文件系统 - 目录节点
 */
export interface FSDir {
    type: 'dir';
    name: string;
    lastWriteTime: string;
    children: { [key: string]: FSNode };
}

/**
 * 分页状态接口
 */
export interface PagerState {
    lines: TerminalLine[];
    currentIndex: number;
    pageSize: number;
}

/**
 * 终端提示状态接口
 * - gc: Get-Content 交互提示状态
 * - pager: 分页显示状态
 */
export interface PromptState {
    type: 'gc' | 'pager';
    step: number;
    paths: string[];
    pager?: PagerState;
}

/**
 * 虚拟文件系统 - 节点联合类型
 */
export type FSNode = FSFile | FSDir;

/**
 * 天气数据接口
 */
export interface WeatherData {
    temp: string;
    city: string;
    cond: string;
}

/**
 * GitHub 用户资料接口
 */
export interface GithubProfile {
    avatar: string;
    bio: string;
    publicRepos: number;
    location: string;
}

/**
 * GitHub 项目接口
 */
export interface GithubProject {
    name: string;
    desc: string;
    lang: string;
    url: string;
    color: string;
}

/**
 * 音乐信息接口
 */
export interface MusicInfo {
    name: string;
    artist: string;
    pic: string;
    url: string;
}

/**
 * 歌曲接口
 */
export interface Song {
    id?: string | number;
    name: string;
    artist: string;
    url: string;
    pic?: string;
    lrc?: string;
}