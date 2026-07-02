import { useState, useEffect, useRef, useCallback, type FormEvent, type KeyboardEvent } from 'react';
import type { TerminalLine, FSDir, PromptState, PagerState } from '../types';
import { navigateTo } from '../utils/vfs';
import { formatCommandNotFoundError, formatPSError } from '../utils/terminalHelpers';

/**
 * 命令执行上下文接口
 */
interface CommandContext {
    args: string[];
    target: string;
    resolvedTarget: string;
    currentPath: string[];
    rootDir: FSDir;
    timestamp: string;
    setCurrentPath: (path: string[]) => void;
    setPromptState: (state: PromptState | null) => void;
    getVariableValue: (name: string) => string;
}

/**
 * 命令处理器接口
 */
interface CommandHandler {
    aliases: string[];
    execute: (ctx: CommandContext) => TerminalLine[] | null;
}

/**
 * 命令注册表
 * 支持 PowerShell 风格的命令和别名
 */
const commandRegistry: Record<string, CommandHandler> = {
    'Get-Help': {
        aliases: ['help'],
        execute: () => []
    },

    'Get-ChildItem': {
        aliases: ['gci', 'ls', 'dir'],
        execute: (ctx) => {
            const node = navigateTo(ctx.currentPath, ctx.rootDir);
            if (!node || node.type !== 'dir') return [];

            const activeDirStr = ctx.currentPath.join('\\');
            const lines: TerminalLine[] = [
                { type: 'system', text: ' ', id: `${ctx.timestamp}-ls-space` },
                { type: 'output', text: `    目录: ${activeDirStr}`, id: `${ctx.timestamp}-ls-dir` },
                { type: 'system', text: ' ', id: `${ctx.timestamp}-ls-space2` },
                { type: 'system', text: 'Mode                 LastWriteTime         Length Name', id: `${ctx.timestamp}-ls-mode` },
                { type: 'system', text: '----                 -------------         ------ ----', id: `${ctx.timestamp}-ls-sep` }
            ];

            Object.values(node.children).forEach((child, idx) => {
                const isDir = child.type === 'dir';
                const mode = isDir ? 'd----' : '-a---';
                const size = isDir ? '' : (typeof child.content === 'function' ? child.content().length : child.content.length).toString();
                lines.push({
                    type: 'output',
                    text: `${mode.padEnd(20)}${child.lastWriteTime.padEnd(22)}${size.padStart(6)} ${child.name}`,
                    id: `${ctx.timestamp}-ls-item-${idx}`
                });
            });

            return lines;
        }
    },

    'Set-Location': {
        aliases: ['sl', 'cd', 'chdir'],
        execute: (ctx): TerminalLine[] | null => {
            const target = ctx.resolvedTarget || ctx.target;

            if (!target || target === '~' || target === '$HOME' || target === 'C:\\Users\\XiaoFeng_QWQ') {
                ctx.setCurrentPath(['C:', 'Users', 'XiaoFeng_QWQ']);
                return [];
            }

            if (target === '..') {
                if (ctx.currentPath.length > 1) {
                    ctx.setCurrentPath(ctx.currentPath.slice(0, -1));
                }
                return [];
            }

            if (target === '.') return [];

            if (target === '\\' || target === '/') {
                ctx.setCurrentPath(['C:']);
                return [];
            }

            const isAbsolutePath = /^[A-Za-z]:/.test(target);
            const targetSegments = target.replace(/\\/g, '/').split('/');
            let tempPath = isAbsolutePath ? [targetSegments[0]] : [...ctx.currentPath];
            const segmentsToProcess = isAbsolutePath ? targetSegments.slice(1) : targetSegments;

            for (const segment of segmentsToProcess) {
                if (!segment || segment === '.') continue;
                if (segment === '..') {
                    if (tempPath.length > 1) tempPath.pop();
                } else {
                    const nextNode = navigateTo([...tempPath, segment], ctx.rootDir);
                    if (nextNode && nextNode.type === 'dir') {
                        tempPath.push(segment);
                    } else {
                        return formatPSError([], 'Set-Location', `Cannot find path '${target}' because it does not exist.`, ctx.timestamp);
                    }
                }
            }

            ctx.setCurrentPath(tempPath);
            return [];
        }
    },

    'Get-Content': {
        aliases: ['gc', 'cat', 'type'],
        execute: (ctx): TerminalLine[] | null => {
            const target = ctx.resolvedTarget || ctx.target;

            if (!target) {
                ctx.setPromptState({ type: 'gc', step: 0, paths: [] });
                return [
                    { type: 'output', text: `位于命令管道位置 1 的 cmdlet Get-Content`, id: `${ctx.timestamp}-gc-pipe` },
                    { type: 'output', text: `请为以下参数提供值:`, id: `${ctx.timestamp}-gc-prompt` }
                ];
            }

            const currentDirNode = navigateTo(ctx.currentPath, ctx.rootDir) as FSDir;
            const fileNode = currentDirNode?.children?.[target];

            if (fileNode && fileNode.type === 'file') {
                const fileText = typeof fileNode.content === 'function' ? fileNode.content() : fileNode.content;
                return fileText.split('\n').map((line, idx) => ({
                    type: 'output' as const,
                    text: line,
                    id: `${ctx.timestamp}-gc-line-${idx}`
                }));
            }

            return formatPSError([], 'Get-Content', `Cannot find path "${target}" because it does not exist in the current directory.`, ctx.timestamp);
        }
    },

    'Get-Location': {
        aliases: ['gl', 'pwd'],
        execute: (ctx) => [
            { type: 'output', text: `Path`, id: `${ctx.timestamp}-pwd-1` },
            { type: 'output', text: `----`, id: `${ctx.timestamp}-pwd-2` },
            { type: 'output', text: ctx.currentPath.join('\\'), id: `${ctx.timestamp}-pwd-3` }
        ]
    },

    'Clear-Host': {
        aliases: ['clear', 'cls'],
        execute: () => null
    },

    'Write-Output': {
        aliases: ['write', 'echo'],
        execute: (ctx) => {
            if (!ctx.target) return [];
            const outputText = (ctx.resolvedTarget || ctx.target).replace(/^["']|["']$/g, '');
            return [{ type: 'output', text: outputText, id: `${ctx.timestamp}-echo` }];
        }
    },

    'Get-Process': {
        aliases: ['gps', 'ps'],
        execute: (ctx) => [
            { type: 'system', text: ' ', id: `${ctx.timestamp}-ps-space` },
            { type: 'system', text: 'Handles  NPM(K)    PM(K)      WS(K)     CPU(s)     Id  SI ProcessName', id: `${ctx.timestamp}-ps-header` },
            { type: 'system', text: '-------  ------    -----      -----     ------     --  -- -----------', id: `${ctx.timestamp}-ps-sep` },
            { type: 'output', text: '    245      15    12345      23456       0.12   1234   1 chrome', id: `${ctx.timestamp}-ps-1` },
            { type: 'output', text: '    180      12     8765      12345       0.08   5678   1 node', id: `${ctx.timestamp}-ps-2` },
            { type: 'output', text: '     95       8     5432       8765       0.05   9012   1 powershell', id: `${ctx.timestamp}-ps-3` }
        ]
    },

    'Get-Date': {
        aliases: ['date'],
        execute: (ctx) => [
            { type: 'output', text: new Date().toLocaleString(), id: `${ctx.timestamp}-date` }
        ]
    },

    'Get-Command': {
        aliases: ['gcm'],
        execute: (ctx) => {
            const cmds = Object.keys(commandRegistry);
            return [
                { type: 'system', text: ' ', id: `${ctx.timestamp}-gcm-space` },
                { type: 'system', text: 'CommandType     Name                                               Version    Source', id: `${ctx.timestamp}-gcm-header` },
                { type: 'system', text: '-----------     ----                                               -------    ------', id: `${ctx.timestamp}-gcm-sep` },
                ...cmds.map((cmd, idx) => ({
                    type: 'output' as const,
                    text: `Cmdlet          ${cmd.padEnd(48)} 7.6.3      Microsoft.PowerShell`,
                    id: `${ctx.timestamp}-gcm-${idx}`
                }))
            ] as TerminalLine[];
        }
    },

    'Get-Alias': {
        aliases: ['gal'],
        execute: (ctx) => {
            const aliases = Object.entries(commandRegistry)
                .flatMap(([cmd, handler]) => handler.aliases.map(alias => [alias, cmd]));
            return [
                { type: 'system', text: ' ', id: `${ctx.timestamp}-gal-space` },
                { type: 'system', text: 'CommandType     Name                                               Definition', id: `${ctx.timestamp}-gal-header` },
                { type: 'system', text: '-----------     ----                                               ----------', id: `${ctx.timestamp}-gal-sep` },
                ...aliases.map(([alias, cmd], idx) => ({
                    type: 'output' as const,
                    text: `Alias           ${alias.padEnd(48)} ${cmd}`,
                    id: `${ctx.timestamp}-gal-${idx}`
                }))
            ] as TerminalLine[];
        }
    },

    'Get-Variable': {
        aliases: ['gv'],
        execute: (ctx) => {
            const vars: Record<string, string> = {
                '$HOME': 'C:\\Users\\XiaoFeng_QWQ',
                '$PWD': ctx.currentPath.join('\\'),
                '$PATH': 'C:\\Windows\\System32;C:\\Windows;C:\\Program Files',
                '$PSHOME': 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0',
                '$True': 'True',
                '$False': 'False',
                '$Null': ''
            };
            return [
                { type: 'system', text: ' ', id: `${ctx.timestamp}-gv-space` },
                { type: 'system', text: 'Name                           Value', id: `${ctx.timestamp}-gv-header` },
                { type: 'system', text: '----                           -----', id: `${ctx.timestamp}-gv-sep` },
                ...Object.entries(vars).map(([name, value], idx) => ({
                    type: 'output' as const,
                    text: `${name.padEnd(30)} ${value}`,
                    id: `${ctx.timestamp}-gv-${idx}`
                }))
            ] as TerminalLine[];
        }
    },

    'Get-History': {
        aliases: ['h', 'history'],
        execute: (ctx) => [
            { type: 'system', text: ' ', id: `${ctx.timestamp}-h-space` },
            { type: 'system', text: 'Id CommandLine', id: `${ctx.timestamp}-h-header` },
            { type: 'system', text: '-- -----------', id: `${ctx.timestamp}-h-sep` }
        ]
    },

    'Get-Host': {
        aliases: ['host'],
        execute: (ctx) => [
            { type: 'output', text: 'Name             : ConsoleHost', id: `${ctx.timestamp}-host-1` },
            { type: 'output', text: 'Version          : 7.6.3', id: `${ctx.timestamp}-host-2` },
            { type: 'output', text: `InstanceId       : ${Date.now().toString(16)}`, id: `${ctx.timestamp}-host-3` },
            { type: 'output', text: 'UI               : System.Management.Automation.Internal.Host.InternalHostUserInterface', id: `${ctx.timestamp}-host-4` },
            { type: 'output', text: 'CurrentCulture   : zh-CN', id: `${ctx.timestamp}-host-5` },
            { type: 'output', text: 'CurrentUICulture : zh-CN', id: `${ctx.timestamp}-host-6` }
        ]
    }
};

/**
 * 解析命令（支持别名）
 * @param cmd 输入的命令字符串
 * @returns 解析后的主命令名或 null
 */
const resolveCommand = (cmd: string): string | null => {
    if (commandRegistry[cmd]) return cmd;
    for (const [mainCmd, handler] of Object.entries(commandRegistry)) {
        if (handler.aliases.some(a => a.toLowerCase() === cmd.toLowerCase())) {
            return mainCmd;
        }
    }
    return null;
};

/**
 * 获取所有可用命令（用于补全）
 * @returns 命令和别名列表
 */
const getAllCommands = (): string[] => {
    const commands: string[] = [];
    Object.entries(commandRegistry).forEach(([cmd, handler]) => {
        commands.push(cmd);
        handler.aliases.forEach(alias => commands.push(alias));
    });
    return commands;
};

const AVAILABLE_COMMANDS = getAllCommands();

/**
 * PowerShell 常用参数列表（用于补全）
 */
const COMMON_PARAMS = [
    '-Path', '-Name', '-Force', '-Recurse', '-Filter', '-Include', '-Exclude',
    '-ErrorAction', '-WarningAction', '-InformationAction', '-Verbose', '-Debug',
    '-WhatIf', '-Confirm', '-Value', '-Destination', '-Source', '-Type', '-Content'
];

/**
 * PowerShell 内置变量映射
 */
const POWERSHELL_VARS: Record<string, string> = {
    '$HOME': 'C:\\Users\\XiaoFeng_QWQ',
    '$PWD': '~current~',
    '$PATH': 'C:\\Windows\\System32;C:\\Windows;C:\\Program Files',
    '$PSHOME': 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0'
};

/**
 * 终端模拟器 Hook
 * 提供终端交互逻辑，包括虚拟文件系统导航、命令历史、自动补全和分页功能
 */
export const useTerminal = (rootDir: FSDir) => {
    const [currentPath, setCurrentPath] = useState<string[]>(['C:', 'Users', 'XiaoFeng_QWQ']);
    const [terminalInput, setTerminalInput] = useState('');
    const [promptState, setPromptState] = useState<PromptState | null>(null);
    const [terminalHistory, setTerminalHistory] = useState<TerminalLine[]>([
        { type: 'system', text: 'Windows PowerShell 7.6.3', id: 'init-1' },
        { type: 'system', text: 'Copyright (C) Microsoft Corporation. All rights reserved.', id: 'init-2' },
        { type: 'system', text: '', id: 'init-3' },
        { type: 'system', text: '安装最新的 PowerShell，了解新功能和改进！https://aka.ms/PSWindows', id: 'init-4' },
        { type: 'system', text: '', id: 'init-5' }
    ]);

    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [completionSuggestion, setCompletionSuggestion] = useState('');
    const [completionMatches, setCompletionMatches] = useState<string[]>([]);
    const [completionIndex, setCompletionIndex] = useState(-1);

    const terminalInputRef = useRef<HTMLInputElement>(null);
    const terminalBottomRef = useRef<HTMLDivElement>(null);

    /**
     * 自动滚动到终端底部
     */
    useEffect(() => {
        terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [terminalHistory]);

    /**
     * 获取当前目录下的文件和目录名
     */
    const getCurrentDirItems = useCallback(() => {
        const node = navigateTo(currentPath, rootDir) as FSDir;
        return node?.type === 'dir' ? Object.keys(node.children || {}) : [];
    }, [currentPath, rootDir]);

    /**
     * 获取变量值（支持动态变量如 $PWD）
     * @param varName 变量名
     * @returns 变量值
     */
    const getVariableValue = useCallback((varName: string): string => {
        if (varName === '$PWD') return currentPath.join('\\');
        return POWERSHELL_VARS[varName] || '';
    }, [currentPath]);

    /**
     * 计算自动补全建议
     * @param input 当前输入内容
     * @returns 补全建议和匹配列表
     */
    const calculateCompletion = useCallback((input: string): { suggestion: string; matches: string[] } => {
        if (!input.trim()) return { suggestion: '', matches: [] };

        const parts = input.trim().split(/\s+/);
        const lastPart = parts[parts.length - 1];
        const prevPart = parts.length > 1 ? parts[parts.length - 2] : '';

        if (lastPart.startsWith('-')) {
            const matches = COMMON_PARAMS.filter(p => p.toLowerCase().startsWith(lastPart.toLowerCase()));
            return matches.length > 0 ? { suggestion: matches[0].slice(lastPart.length), matches } : { suggestion: '', matches: [] };
        }

        if (prevPart.startsWith('-')) {
            const items = getCurrentDirItems().filter(i => i.toLowerCase().startsWith(lastPart.toLowerCase()));
            return items.length > 0 ? { suggestion: items[0].slice(lastPart.length), matches: items } : { suggestion: '', matches: [] };
        }

        if (parts.length === 1) {
            const cmdMatches = AVAILABLE_COMMANDS.filter(c => c.toLowerCase().startsWith(lastPart.toLowerCase()));
            if (cmdMatches.length > 0) return { suggestion: cmdMatches[0].slice(lastPart.length), matches: cmdMatches };

            const varMatches = Object.keys(POWERSHELL_VARS).filter(v => v.toLowerCase().startsWith(lastPart.toLowerCase()));
            if (varMatches.length > 0) return { suggestion: varMatches[0].slice(lastPart.length), matches: varMatches };
        }

        const pathMatches = getCurrentDirItems().filter(i => i.toLowerCase().startsWith(lastPart.toLowerCase()));
        return pathMatches.length > 0 ? { suggestion: pathMatches[0].slice(lastPart.length), matches: pathMatches } : { suggestion: '', matches: [] };
    }, [getCurrentDirItems]);

    /**
     * 更新补全提示
     */
    useEffect(() => {
        const { suggestion, matches } = calculateCompletion(terminalInput);
        setCompletionSuggestion(suggestion);
        setCompletionMatches(matches);
        setCompletionIndex(-1);
    }, [terminalInput, calculateCompletion]);

    /**
     * 键盘事件处理
     * - Tab: 循环补全
     * - ArrowUp: 向上浏览历史
     * - ArrowDown: 向下浏览历史
     */
    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (completionMatches.length === 0) return;

            const newIndex = completionIndex < completionMatches.length - 1 ? completionIndex + 1 : 0;
            setCompletionIndex(newIndex);

            const match = completionMatches[newIndex];
            const parts = terminalInput.trim().split(/\s+/);
            const newInput = parts.slice(0, -1).join(' ') + (parts.length > 1 ? ' ' : '') + match;
            setTerminalInput(newInput);
            setCompletionSuggestion('');
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (commandHistory.length === 0) return;
            const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
            if (newIndex !== historyIndex) {
                setHistoryIndex(newIndex);
                setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
            }
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setTerminalInput(commandHistory[commandHistory.length - 1 - newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setTerminalInput('');
            }
            return;
        }

        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') return;
        setCompletionIndex(-1);
    }, [completionMatches, completionIndex, commandHistory, historyIndex, terminalInput]);

    /**
     * 处理分页和交互提示状态
     * @param fullCmd 用户输入的命令
     * @param timestamp 时间戳
     * @returns 是否处理成功
     */
    const handlePromptState = useCallback((fullCmd: string, timestamp: string): boolean => {
        if (!promptState) return false;

        if (promptState.type === 'pager') {
            const pager = promptState.pager!;
            const nextIndex = pager.currentIndex + pager.pageSize;

            if (fullCmd.toLowerCase() === 'q' || nextIndex >= pager.lines.length) {
                setPromptState(null);
                setTerminalHistory(prev => [...prev, { type: 'system', text: '', id: `${timestamp}-pager-end` }]);
            } else {
                const pageLines = pager.lines.slice(nextIndex, Math.min(nextIndex + pager.pageSize, pager.lines.length));
                const hasMore = nextIndex + pager.pageSize < pager.lines.length;

                setTerminalHistory(prev => [...prev, ...pageLines]);

                if (hasMore) {
                    setTerminalHistory(prev => [...prev, { type: 'system', text: '-- More --', id: `${timestamp}-pager-more` }]);
                    setPromptState({
                        ...promptState,
                        pager: { ...pager, currentIndex: nextIndex }
                    });
                } else {
                    setPromptState(null);
                }
            }
            setTerminalInput('');
            return true;
        }

        if (promptState.type !== 'gc') return false;

        const newHistoryLine: TerminalLine = {
            type: 'output',
            text: `Path[${promptState.step}]: ${fullCmd}`,
            id: `${timestamp}-prompt-in`
        };

        const updatedPaths = [...promptState.paths];
        if (fullCmd) updatedPaths.push(fullCmd);

        if (!fullCmd || promptState.step >= 1) {
            const finalLines: TerminalLine[] = [newHistoryLine];

            if (updatedPaths.length > 0) {
                const fileToRead = updatedPaths[0];
                const currentDirNode = navigateTo(currentPath, rootDir) as FSDir;
                const fileNode = currentDirNode?.children?.[fileToRead];

                if (fileNode?.type === 'file') {
                    const fileText = typeof fileNode.content === 'function' ? fileNode.content() : fileNode.content;
                    fileText.split('\n').forEach((line, idx) => {
                        finalLines.push({ type: 'output', text: line, id: `${timestamp}-gc-prompt-line-${idx}` });
                    });
                } else {
                    formatPSError(finalLines, 'Get-Content', `Cannot find path "${fileToRead}" because it does not exist.`, timestamp);
                }
            }

            setTerminalHistory(prev => [...prev, ...finalLines]);
            setPromptState(null);
        } else {
            setTerminalHistory(prev => [...prev, newHistoryLine]);
            setPromptState({ type: 'gc', step: promptState.step + 1, paths: updatedPaths });
        }

        setTerminalInput('');
        return true;
    }, [promptState, currentPath, rootDir]);

    /**
     * 命令提交处理
     */
    const handleTerminalSubmit = useCallback((e: FormEvent) => {
        e.preventDefault();
        const fullCmd = terminalInput.trim();
        const timestamp = Date.now().toString();

        if (handlePromptState(fullCmd, timestamp)) return;

        if (fullCmd && (commandHistory.length === 0 || commandHistory[commandHistory.length - 1] !== fullCmd)) {
            setCommandHistory(prev => [...prev, fullCmd]);
        }
        setHistoryIndex(-1);
        setCompletionSuggestion('');
        setCompletionIndex(-1);

        if (!fullCmd) return;

        const activeDirStr = currentPath.join('\\');
        const newLines: TerminalLine[] = [
            { type: 'input', text: `${activeDirStr}> ${fullCmd}`, id: `${timestamp}-in` }
        ];

        const args = fullCmd.split(/\s+/);
        const command = args[0];
        const target = args.slice(1).join(' ').trim();
        const resolvedTarget = target.replace(/\$\w+/g, m => getVariableValue(m) || m);

        const resolvedCmd = resolveCommand(command);

        if (!resolvedCmd) {
            formatCommandNotFoundError(newLines, command, timestamp);
            setTerminalHistory(prev => [...prev, ...newLines]);
            setTerminalInput('');
            return;
        }

        const ctx: CommandContext = {
            args,
            target,
            resolvedTarget,
            currentPath,
            rootDir,
            timestamp,
            setCurrentPath,
            setPromptState,
            getVariableValue
        };

        const handler = commandRegistry[resolvedCmd];
        const result = handler.execute(ctx);

        if (result === null) {
            setTerminalHistory([]);
            setTerminalInput('');
            return;
        }

        if (resolvedCmd === 'Get-Help') {
            const helpLines: TerminalLine[] = [
                { type: 'output', text: '主题', id: `${timestamp}-help-1` },
                { type: 'output', text: '    Windows PowerShell 帮助系统', id: `${timestamp}-help-2` },
                { type: 'system', text: ' ', id: `${timestamp}-help-3` },
                { type: 'output', text: '简短说明', id: `${timestamp}-help-4` },
                { type: 'output', text: '    显示有关 Windows PowerShell 的 cmdlet 及概念的帮助。', id: `${timestamp}-help-5` },
                { type: 'system', text: ' ', id: `${timestamp}-help-6` },
                { type: 'output', text: '详细说明', id: `${timestamp}-help-7` },
                { type: 'output', text: '    "Windows PowerShell 帮助"介绍了 Windows PowerShell 的 cmdlet、', id: `${timestamp}-help-8` },
                { type: 'output', text: '    函数、脚本及模块，并解释了 Windows PowerShell 语言的元素等概念。', id: `${timestamp}-help-9` },
                { type: 'system', text: ' ', id: `${timestamp}-help-10` },
                { type: 'output', text: '    您也可以使用 Update-Help cmdlet 下载最新的帮助文件。', id: `${timestamp}-help-11` },
                { type: 'system', text: ' ', id: `${timestamp}-help-12` },
                { type: 'output', text: '示例', id: `${timestamp}-help-13` },
                { type: 'output', text: '    Get-Help Get-Process    # 获取 Get-Process 命令的帮助', id: `${timestamp}-help-14` },
                { type: 'output', text: '    Get-Help about_*        # 获取概念性帮助主题', id: `${timestamp}-help-15` },
                { type: 'system', text: ' ', id: `${timestamp}-help-16` },
                { type: 'output', text: '相关链接', id: `${timestamp}-help-17` },
                { type: 'output', text: '    https://aka.ms/PSWindows', id: `${timestamp}-help-18` },
                { type: 'output', text: '    https://docs.microsoft.com/powershell', id: `${timestamp}-help-19` }
            ];

            const pageSize = 8;
            const firstPage = helpLines.slice(0, pageSize);
            const hasMore = helpLines.length > pageSize;

            newLines.push(...firstPage);

            if (hasMore) {
                newLines.push({ type: 'system', text: '-- More --', id: `${timestamp}-help-more` });
                const pager: PagerState = {
                    lines: helpLines,
                    currentIndex: 0,
                    pageSize
                };
                setPromptState({ type: 'pager', step: 0, paths: [], pager });
            }

            setTerminalHistory(prev => [...prev, ...newLines]);
            setTerminalInput('');
            return;
        }

        if (resolvedCmd === 'Get-History') {
            const historyLines: TerminalLine[] = commandHistory.slice(-10).map((cmd, idx) => ({
                type: 'output' as const,
                text: `${(commandHistory.length - 10 + idx + 1).toString().padStart(2)} ${cmd}`,
                id: `${timestamp}-h-${idx}`
            }));
            newLines.push(...result, ...historyLines);
        } else if (result) {
            newLines.push(...result);
        }

        setTerminalHistory(prev => [...prev, ...newLines]);
        setTerminalInput('');
    }, [terminalInput, currentPath, rootDir, commandHistory, handlePromptState, getVariableValue]);

    return {
        currentPath,
        terminalInput,
        setTerminalInput,
        promptState,
        terminalHistory,
        terminalInputRef,
        terminalBottomRef,
        handleTerminalSubmit,
        handleKeyDown,
        completionSuggestion,
        completionMatches,
        completionIndex
    };
};