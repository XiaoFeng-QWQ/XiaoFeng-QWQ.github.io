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