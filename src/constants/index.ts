import { User, LayoutGrid, FolderOpen, Cpu } from 'lucide-react';

// 搜索引擎配置
export const SEARCH_ENGINES = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=' },
    { id: 'baidu', name: 'Baidu', url: 'https://www.baidu.com/s?wd=' },
] as const;

// 底部导航栏页面配置
export const DOCK_PAGES = [
    { name: 'Identity', icon: User, id: 0, path: '/' },
    { name: 'Workspace', icon: LayoutGrid, id: 1, path: '/workspace' },
    { name: 'Projects', icon: FolderOpen, id: 2, path: '/projects' },
    { name: 'Tech Stack', icon: Cpu, id: 3, path: '/stack' }
];

// 根据技术栈语言匹配高亮色彩
export const getLangColor = (lang: string) => {
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

// 技术栈列表
export const TECH_STACK = [
    'React / Next.js',
    'TypeScript',
    'Tailwind v4',
    'Vite',
    'Node.js',
    'Git Engine',
    'MySQL',
    'PHP'
];