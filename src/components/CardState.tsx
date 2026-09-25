import { RotateCw } from 'lucide-react';

/**
 * 卡片状态原语
 * 全站统一的三态视觉语言：loading（骨架）/ empty（空）/ error（失败 + 重试）。
 * 之前这三态在界面上不存在——请求失败只会留下空白或一块永远转的骨架。
 */
export type CardStateVariant = 'loading' | 'empty' | 'error';

interface CardStateProps {
    variant: CardStateVariant;
    /** 主说明（等宽小字） */
    label?: string;
    /** 次级提示，可选 */
    hint?: string;
    /** 骨架行数 */
    rows?: number;
    /** 失败时的重试回调，给了才渲染按钮 */
    onRetry?: () => void;
}

const CardState = ({ variant, label, hint, rows = 3, onRetry }: CardStateProps) => {
    if (variant === 'loading') {
        return (
            <div className="flex w-full flex-col gap-2.5" role="status" aria-label="Loading">
                {Array.from({ length: rows }).map((_, index) => (
                    <div
                        key={index}
                        className="h-3 animate-pulse rounded-full bg-[var(--skeleton-bg)]"
                        style={{
                            animationDelay: `${index * 130}ms`,
                            width: index === rows - 1 ? '62%' : '100%'
                        }}
                    />
                ))}
            </div>
        );
    }

    const isError = variant === 'error';

    return (
        <div className="flex w-full flex-col items-center justify-center gap-2 py-5 text-center" role="status">
            <span className="text-readout font-mono text-tertiary">
                {label ?? (isError ? 'Request failed' : 'Nothing here yet')}
            </span>
            {hint && <span className="text-label text-tertiary">{hint}</span>}
            {isError && onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-1 flex items-center gap-1.5 surface-chip px-2.5 py-1 font-mono text-label text-secondary transition-colors hover:text-neutral-900 dark:hover:text-neutral-100"
                >
                    <RotateCw size={10} />
                    <span>Retry</span>
                </button>
            )}
        </div>
    );
};

/**
 * 整卡骨架：用于列表位置占位（如项目卡加载中）
 */
export const CardSkeleton = ({ className = '' }: { className?: string }) => (
    <div className={`surface flex flex-col justify-between p-6 ${className}`} aria-hidden>
        <CardState variant="loading" rows={3} />
    </div>
);

export default CardState;
