import { type ReactNode, type ElementType } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, type LucideIcon } from 'lucide-react';

/**
 * ShimmerSkeleton — pulsing placeholder that won't look like the real thing
 */
interface ShimmerSkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function ShimmerSkeleton({ className = '', rounded = 'md' }: ShimmerSkeletonProps) {
  const radii = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg', xl: 'rounded-xl', full: 'rounded-full' };
  return (
    <div
      role="status"
      aria-live="polite"
      className={`relative overflow-hidden bg-surface-200/60 dark:bg-[#253242]/60 ${radii[rounded]} ${className}`}
    >
      <motion.div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/5 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/**
 * PageHeader — consistent title + optional back/action slot
 */
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: 'primary' | 'blue' | 'green' | 'amber' | 'red';
  actions?: ReactNode;
}

const accentMap = {
  primary: 'from-primary-500/15 to-transparent text-primary-500',
  blue: 'from-blue-500/15 to-transparent text-blue-500',
  green: 'from-emerald-500/15 to-transparent text-emerald-500',
  amber: 'from-amber-500/15 to-transparent text-amber-500',
  red: 'from-red-500/15 to-transparent text-red-500',
};

export function PageHeader({ title, subtitle, icon: Icon, accent = 'primary', actions }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-center gap-4 min-w-0">
        {Icon && (
          <div className={`relative p-3 rounded-2xl bg-gradient-to-br ${accentMap[accent]} backdrop-blur-sm border border-current/20`}>
            <Icon className="w-5 h-5" aria-hidden />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-display text-surface-900 dark:text-white truncate">{title}</h1>
          {subtitle && <p className="text-body text-surface-500 dark:text-surface-400 mt-1">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}

/**
 * GradientStatCard — premium stat card with gradient ring + sparkline + trend
 */
interface GradientStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: 'primary' | 'blue' | 'green' | 'amber' | 'red' | 'violet';
  trend?: { label: string; direction: 'up' | 'down' | 'flat' };
  /** Compact sparkline points (0..1 values) */
  spark?: number[];
  /** Renders numeric values via animated counter; pass false to opt out */
  animateNumber?: boolean;
  linkTo?: string;
  onClick?: () => void;
}

const gradientMap = {
  primary: 'from-primary-500 to-cyan-500',
  blue: 'from-blue-500 to-indigo-500',
  green: 'from-emerald-500 to-teal-500',
  amber: 'from-amber-500 to-orange-500',
  red: 'from-rose-500 to-pink-500',
  violet: 'from-violet-500 to-purple-500',
};

const sparkColorMap = {
  primary: 'stroke-primary-500',
  blue: 'stroke-blue-500',
  green: 'stroke-emerald-500',
  amber: 'stroke-amber-500',
  red: 'stroke-rose-500',
  violet: 'stroke-violet-500',
};

function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (!points.length) return null;
  const w = 80;
  const h = 28;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 0.0001);
  const step = w / (points.length - 1 || 1);
  const coords = points
    .map((p, i) => `${(i * step).toFixed(1)},${(h - ((p - min) / range) * h).toFixed(1)}`)
    .join(' ');
  const fillCoords = `0,${h} ${coords} ${w},${h}`;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polygon points={fillCoords} className={`${color.replace('stroke-', 'fill-')} opacity-15`} />
      <polyline
        points={coords}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color}
      />
    </svg>
  );
}

export function GradientStatCard({
  label,
  value,
  icon: Icon,
  accent = 'primary',
  trend,
  spark,
  animateNumber = false,
  linkTo,
  onClick,
}: GradientStatCardProps) {
  const Wrapper: ElementType = linkTo ? motion.a : motion.div;
  const wrapperProps = linkTo ? { href: linkTo } : {};

  return (
    <Wrapper
      {...(wrapperProps as Record<string, unknown>)}
      onClick={onClick}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="card p-5 relative overflow-hidden focus-ring block"
      style={{ minHeight: '44px' }}
    >
      {/* Accent gradient strip */}
      <div
        aria-hidden
        className={`absolute -top-px -right-px w-24 h-24 rounded-full blur-2xl opacity-40 bg-gradient-to-br ${gradientMap[accent]}`}
      />

      <div className="relative flex items-start justify-between mb-3">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${gradientMap[accent]} text-white shadow-sm`}>
          <Icon className="w-5 h-5" aria-hidden />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 ${
              trend.direction === 'up'
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                : trend.direction === 'down'
                ? 'text-red-600 dark:text-red-400 bg-red-500/10'
                : 'text-surface-500 bg-surface-200/60 dark:bg-surface-700/50'
            }`}
          >
            {trend.label}
          </span>
        )}
      </div>

      <div className="relative flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-2xl font-bold text-surface-900 dark:text-white font-tabular leading-tight">
            {typeof value === 'number' && animateNumber ? (
              <AnimatedCounter value={value} />
            ) : (
              value
            )}
          </p>
          <p className="text-caption text-surface-500 mt-1">{label}</p>
        </div>
        {spark && spark.length > 1 && (
          <div className="shrink-0">
            <Sparkline points={spark} color={sparkColorMap[accent]} />
          </div>
        )}
      </div>

      {linkTo && (
        <ArrowRight
          className="absolute top-4 right-4 w-4 h-4 text-surface-400 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden
        />
      )}
    </Wrapper>
  );
}

/**
 * AnimatedCounter — tween 0 → value over 0.8s
 */
export function AnimatedCounter({ value, format }: { value: number; format?: (n: number) => string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
    >
      {format ? format(value) : value.toLocaleString()}
    </motion.span>
  );
}

/**
 * StatusTimeline — vertical activity feed
 */
export interface TimelineItem {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  icon?: LucideIcon;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const toneMap = {
  primary: { bg: 'bg-primary-500/15', fg: 'text-primary-500', dot: 'bg-primary-500' },
  success: { bg: 'bg-emerald-500/15', fg: 'text-emerald-500', dot: 'bg-emerald-500' },
  warning: { bg: 'bg-amber-500/15', fg: 'text-amber-500', dot: 'bg-amber-500' },
  danger: { bg: 'bg-red-500/15', fg: 'text-red-500', dot: 'bg-red-500' },
  info: { bg: 'bg-blue-500/15', fg: 'text-blue-500', dot: 'bg-blue-500' },
  neutral: { bg: 'bg-surface-200 dark:bg-surface-700', fg: 'text-surface-500', dot: 'bg-surface-400' },
};

export function StatusTimeline({ items, emptyText = 'Nothing here yet' }: { items: TimelineItem[]; emptyText?: string }) {
  if (!items.length) {
    return <p className="text-sm text-surface-500 text-center py-6">{emptyText}</p>;
  }
  return (
    <ol className="relative space-y-4 pl-6">
      <span aria-hidden className="absolute left-[11px] top-2 bottom-2 w-px bg-surface-200 dark:bg-surface-700" />
      {items.map((item, i) => {
        const tone = toneMap[item.tone ?? 'neutral'];
        const Icon = item.icon;
        return (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
            className="relative"
          >
            <span
              aria-hidden
              className={`absolute -left-[24px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-white dark:ring-[#1A2332] ${tone.dot}`}
            />
            <div className="flex items-start gap-3">
              {Icon && (
                <div className={`p-1.5 rounded-lg ${tone.bg} shrink-0`}>
                  <Icon className={`w-3.5 h-3.5 ${tone.fg}`} aria-hidden />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-surface-900 dark:text-white truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-surface-500 truncate">{item.subtitle}</p>
                )}
                {item.timestamp && (
                  <p className="text-[11px] text-surface-400 mt-0.5">{item.timestamp}</p>
                )}
              </div>
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}

/**
 * LiveActivityStrip — horizontal live ticker for the top of dashboards
 */
export interface ActivityEvent {
  id: string;
  emoji?: string;
  message: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const stripToneMap = {
  primary: 'bg-primary-500/10 text-primary-500 border-primary-500/20',
  success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  danger: 'bg-red-500/10 text-red-500 border-red-500/20',
  info: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

export function LiveActivityStrip({ events }: { events: ActivityEvent[] }) {
  if (!events.length) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-surface-200 dark:border-[#2A3444] bg-surface-50/60 dark:bg-[#141D28]/60 backdrop-blur-sm">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-semibold uppercase tracking-wider">
        <motion.span
          aria-hidden
          className="w-1.5 h-1.5 rounded-full bg-red-500"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        />
        Live
      </div>
      <div className="pl-20 pr-3 py-2.5 overflow-hidden">
        <motion.div
          className="flex gap-3 whitespace-nowrap"
          animate={{ x: ['100%', '-100%'] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
        >
          {[...events, ...events].map((e, i) => (
            <div
              key={`${e.id}-${i}`}
              className={`shrink-0 flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${stripToneMap[e.tone ?? 'info']}`}
            >
              {e.emoji && <span className="text-sm">{e.emoji}</span>}
              <span>{e.message}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * EmptyState — friendly empty placeholder
 */
interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void; icon?: LucideIcon };
}
export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  const ActionIcon = action?.icon;
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-2xl border border-dashed border-surface-200 dark:border-[#2A3444] bg-surface-50/40 dark:bg-[#141D28]/40">
      {Icon && (
        <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-500 mb-4">
          <Icon className="w-6 h-6" aria-hidden />
        </div>
      )}
      <p className="text-sm font-semibold text-surface-900 dark:text-white">{title}</p>
      {subtitle && <p className="text-xs text-surface-500 mt-1 max-w-xs">{subtitle}</p>}
      {action && (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={action.onClick}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium focus-ring"
          style={{ minHeight: '44px' }}
        >
          {ActionIcon && <ActionIcon className="w-4 h-4" aria-hidden />}
          {action.label}
        </motion.button>
      )}
    </div>
  );
}
