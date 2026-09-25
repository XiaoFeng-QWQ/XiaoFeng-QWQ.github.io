import type { TerminalLine } from '../types';

/**
 * 格式化 PowerShell CommandNotFound 红色报错
 * @param lines 终端行数组
 * @param cmd 命令名称
 * @param ts 时间戳
 */
export const formatCommandNotFoundError = (lines: TerminalLine[], cmd: string, ts: string): void => {
    lines.push(
        {
            type: 'error',
            text: `${cmd} : 无法将"${cmd}"项识别为 cmdlet、函数、脚本文件或可运行程序的名称。请检查名称的拼写，如果包括路径，请确保路径正确，然后再试一次。`,
            id: `${ts}-err-msg`
        },
        {
            type: 'error',
            text: `所在位置 行:1 字符: 1`,
            id: `${ts}-err-loc`
        },
        {
            type: 'error',
            text: `+ ${cmd}`,
            id: `${ts}-err-cmd`
        },
        {
            type: 'error',
            text: `+ ${'~'.repeat(Math.max(1, cmd.length))}`,
            id: `${ts}-err-squig`
        },
        {
            type: 'error',
            text: `    + CategoryInfo          : ObjectNotFound: (${cmd}:String) [], CommandNotFoundException`,
            id: `${ts}-err-cat`
        },
        {
            type: 'error',
            text: `    + FullyQualifiedErrorId : CommandNotFoundException`,
            id: `${ts}-err-id`
        }
    );
};

/**
 * 格式化 PowerShell 参数或路径解析错误
 * @param lines 终端行数组（可选，用于向后兼容）
 * @param cmd 命令名称
 * @param reason 错误原因
 * @param ts 时间戳
 * @returns TerminalLine[] 错误行数组
 */
export const formatPSError = (lines: TerminalLine[] | null, cmd: string, reason: string, ts: string): TerminalLine[] => {
    const errorLines: TerminalLine[] = [
        {
            type: 'error',
            text: `${cmd} : ${reason}`,
            id: `${ts}-pserr-msg`
        }
    ];
    if (lines) {
        lines.push(...errorLines);
    }
    return errorLines;
};

/**
 * 解析标准 LRC 歌词格式
 * @param lrcText LRC 格式歌词文本
 * @returns 解析后的歌词行数组
 */
export const parseLRC = (lrcText: string): { time: number; text: string }[] => {
    const lines = lrcText.split('\n');
    const parsed: { time: number; text: string }[] = [];
    const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})\]/;

    lines.forEach(line => {
        const match = timeReg.exec(line);
        if (match) {
            const min = parseInt(match[1], 10);
            const sec = parseInt(match[2], 10);
            const msStr = match[3];
            const ms = parseInt(msStr, 10) / (msStr.length === 3 ? 1000 : 100);
            const time = min * 60 + sec + ms;
            const text = line.replace(timeReg, '').trim();
            parsed.push({ time, text });
        }
    });
    return parsed.sort((a, b) => a.time - b.time);
};

/* ────────────────────────────────────────────────────────────
   终端彩蛋：neofetch / matrix / sudo
   约定：全部只用单字宽字符（半角片假名、制表符、拉丁字符），
   否则等宽字体里列对齐会散掉。
   ──────────────────────────────────────────────────────────── */

/** neofetch 左侧标识，每行固定 12 个字符宽 */
const NEOFETCH_LOGO = [
    '┌──────────┐',
    '│  >_      │',
    '│  · · ·   │',
    '│  · · ·   │',
    '└──────────┘'
];
const NEOFETCH_LOGO_WIDTH = 12;

/** 从 UA 里取浏览器名 + 主次版本 */
const detectBrowser = (ua: string): string => {
    const patterns: [RegExp, string][] = [
        [/Edg\/([\d.]+)/, 'Edge'],
        [/OPR\/([\d.]+)/, 'Opera'],
        [/Firefox\/([\d.]+)/, 'Firefox'],
        [/Chrome\/([\d.]+)/, 'Chrome'],
        [/Version\/([\d.]+).*Safari/, 'Safari']
    ];
    for (const [re, name] of patterns) {
        const match = re.exec(ua);
        if (match) return `${name} ${match[1].split('.').slice(0, 2).join('.')}`;
    }
    return 'Unknown';
};

/** 从 UA 里取操作系统 */
const detectPlatform = (ua: string): string => {
    const win = /Windows NT ([\d.]+)/.exec(ua);
    if (win) {
        const names: Record<string, string> = {
            '10.0': 'Windows 10/11',
            '6.3': 'Windows 8.1',
            '6.2': 'Windows 8',
            '6.1': 'Windows 7'
        };
        return names[win[1]] ?? `Windows NT ${win[1]}`;
    }
    if (/Mac OS X/.test(ua)) return 'macOS';
    if (/Android/.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
};

/** 页面已存活时长 → hh:mm:ss */
const formatUptime = (ms: number): string => {
    const total = Math.floor(ms / 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
};

/** 采集运行环境信息（全部来自浏览器真实可读的数据，不引入依赖）
 *  注意：终端可视区只有 220px（约 8.5 行），这里的行数刻意压到「标识 + 信息」刚好一屏，
 *  否则自动滚动会把顶部的 logo 和主机名顶出视野。要加行的话它会开始滚动。 */
const collectSystemInfo = (): [string, string][] => {
    const ua = navigator.userAgent;
    const nav = navigator as Navigator & { deviceMemory?: number };
    const engine = /Firefox/.test(ua) ? 'Gecko' : /Chrome|Edg|OPR/.test(ua) ? 'Blink' : 'WebKit';
    const threads = nav.hardwareConcurrency ? `${nav.hardwareConcurrency} threads` : 'unknown';
    const memory = nav.deviceMemory ? `${nav.deviceMemory} GB` : 'n/a';

    return [
        ['OS', detectPlatform(ua)],
        ['Browser', `${detectBrowser(ua)} · ${engine}`],
        ['CPU', `${threads} · ${memory}`],
        ['Display', `${screen.width}×${screen.height} @${window.devicePixelRatio}x`],
        ['Uptime', formatUptime(performance.now())],
        ['Palette', '░▒▓█ ░▒▓█ ░▒▓█ mono']
    ];
};

/** 并排布局所需的最小列数：低于这个宽度就退回只显示信息列，避免折行破坏等宽对齐 */
const NEOFETCH_SIDE_BY_SIDE_MIN_COLUMNS = 56;

/**
 * 构造 neofetch 风格输出：宽屏为「左侧 ASCII 标识 + 右侧系统信息」，窄屏只保留信息列
 * @param ts 时间戳
 * @param columns 终端可视列数（由调用方实测，缺省按宽屏处理）
 */
export const buildNeofetchLines = (ts: string, columns = 80): TerminalLine[] => {
    const infoRows = [
        'XiaoFeng_QWQ@xiaofengqwq.github.io',
        '─'.repeat(35),
        ...collectSystemInfo().map(([label, value]) => `${label.padEnd(9)} ${value}`)
    ];

    if (columns < NEOFETCH_SIDE_BY_SIDE_MIN_COLUMNS) {
        return infoRows.map((text, i) => ({
            type: 'output' as const,
            text,
            id: `${ts}-nf-info-${i}`
        }));
    }

    const totalRows = Math.max(NEOFETCH_LOGO.length, infoRows.length);

    return Array.from({ length: totalRows }, (_, i) => {
        const left = (NEOFETCH_LOGO[i] ?? '').padEnd(NEOFETCH_LOGO_WIDTH);
        const right = infoRows[i] ?? '';
        return {
            type: 'output' as const,
            text: `${left}  ${right}`.trimEnd(),
            id: `${ts}-nf-${i}`
        };
    });
};

/**
 * 构造 sudo 的几种回应
 * @param target sudo 后面的参数
 * @param ts 时间戳
 */
export const buildSudoLines = (target: string, ts: string): TerminalLine[] => {
    const args = target.trim();
    const lines: TerminalLine[] = [
        { type: 'system', text: '[sudo] password for XiaoFeng_QWQ: ', id: `${ts}-sudo-prompt` }
    ];

    if (!args) {
        lines.push({ type: 'error', text: 'usage: sudo <command>', id: `${ts}-sudo-usage` });
        return lines;
    }

    // xkcd 979
    if (/^make me a sandwich\b/i.test(args)) {
        lines.push({ type: 'output', text: 'Okay.', id: `${ts}-sudo-sandwich` });
        return lines;
    }

    // rm -rf /：先摆出正经的 failsafe 报错，再演一段删盘
    if (/^rm\s+(-\w+\s+)*\/(\s|$)/.test(args)) {
        lines.push(
            { type: 'error', text: "rm: it is dangerous to operate recursively on '/'", id: `${ts}-sudo-rm-a` },
            { type: 'error', text: 'rm: use --no-preserve-root to override this failsafe', id: `${ts}-sudo-rm-b` }
        );
        [0, 21, 57, 88].forEach((pct, idx) => {
            lines.push({ type: 'system', text: `正在删除 C:\\ ... ${pct}%`, id: `${ts}-sudo-rm-progress-${idx}` });
        });
        lines.push(
            { type: 'output', text: 'Just kidding.', id: `${ts}-sudo-rm-kid` },
            { type: 'system', text: '这个文件系统是内存里的假货，删不掉的 —— 但这份勇气我记下了。', id: `${ts}-sudo-rm-tail` }
        );
        return lines;
    }

    lines.push({
        type: 'error',
        text: 'XiaoFeng_QWQ is not in the sudoers file.  This incident will be reported.',
        id: `${ts}-sudo-denied`
    });
    return lines;
};

/** 字符雨字符集：半角片假名 + 数字 + 符号，全部单字宽 */
const RAIN_GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎ0123456789<>/\\|=+-*#%@$&';

/** 单列雨的状态 */
export interface RainColumn {
    /** 雨头所在的帧内行号（浮点，逐帧下移） */
    pos: number;
    speed: number;
    tail: number;
}

/**
 * 初始化字符雨的每一列
 * @param count 列数
 */
export const createRainColumns = (count: number): RainColumn[] =>
    Array.from({ length: count }, () => ({
        pos: Math.random() * 5 - 4,
        speed: 0.4 + Math.random() * 0.8,
        tail: 2 + Math.floor(Math.random() * 5)
    }));

/**
 * 推进并渲染一帧字符雨
 * 行数恒定，配合「原地替换上一帧」才能得到持续下落的效果
 * @param columns 列状态（会被就地推进）
 * @param rows 每帧行数
 */
export const advanceRainFrame = (columns: RainColumn[], rows: number): string[] => {
    const grid: string[][] = Array.from({ length: rows }, () => new Array<string>(columns.length).fill(' '));

    columns.forEach((col, c) => {
        col.pos += col.speed;
        // 雨头完全离开画面后，从上方重新生成
        if (col.pos - col.tail > rows) {
            col.pos = -Math.random() * 4;
            col.speed = 0.4 + Math.random() * 0.8;
            col.tail = 2 + Math.floor(Math.random() * 5);
        }
        for (let t = 0; t <= col.tail; t++) {
            const row = Math.round(col.pos) - t;
            if (row < 0 || row >= rows) continue;
            // 越靠尾越稀，雨头最实
            if (t > 0 && Math.random() < t / (col.tail + 1)) continue;
            grid[row][c] = RAIN_GLYPHS[Math.floor(Math.random() * RAIN_GLYPHS.length)];
        }
    });

    return grid.map(row => row.join('').replace(/\s+$/, ''));
};

/**
 * 字符雨结束后的收尾台词
 * @param ts 时间戳
 */
export const buildMatrixFinaleLines = (ts: string): TerminalLine[] => [
    { type: 'output', text: 'Wake up, XiaoFeng_QWQ...', id: `${ts}-mx-1` },
    { type: 'system', text: 'The Matrix has you.', id: `${ts}-mx-2` },
    { type: 'system', text: 'Follow the white rabbit.', id: `${ts}-mx-3` },
    { type: 'system', text: ' ', id: `${ts}-mx-4` },
    { type: 'output', text: 'Knock, knock.', id: `${ts}-mx-5` },
    { type: 'system', text: ' ', id: `${ts}-mx-6` },
    { type: 'system', text: '提示：敲 neofetch 看看这台机器', id: `${ts}-mx-7` }
];
