import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../theme';
import { Icon } from './Icon';
import { refillAiQuota, getAiQuota, DEFAULT_AI_QUOTA } from '../utils/aiQuota';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardClaimed?: (newRemaining: number) => void;
}

const AD_DURATION_SEC = 15;

const SPONSOR_SLIDES = [
  {
    title: 'Focus Better with NOVA Smart Audio',
    desc: 'Deep work ambient sounds tuned to your flow state.',
    tag: 'SPONSOR SPOTLIGHT',
    icon: 'headphones',
    color: '#10B981',
  },
  {
    title: 'Instant Voice-to-Action Capture',
    desc: 'Turn fast thoughts into organized tasks across your day.',
    tag: 'PRODUCTIVITY BOOST',
    icon: 'mic',
    color: '#6366F1',
  },
  {
    title: 'Offline-First Quiet Workspace',
    desc: 'No trackers, no algorithms, just clean personal clarity.',
    tag: 'NOVA CLOUD',
    icon: 'shield',
    color: '#F59E0B',
  },
];

export function RewardedAdModal({ isOpen, onClose, onRewardClaimed }: RewardedAdModalProps) {
  const { colors } = useTheme();
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION_SEC);
  const [rewardReady, setRewardReady] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset and start countdown when opened
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(AD_DURATION_SEC);
      setRewardReady(false);
      return;
    }

    setSecondsLeft(AD_DURATION_SEC);
    setRewardReady(false);
    setIsPlaying(true);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setRewardReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen]);

  // Rotate slides every 5 seconds
  useEffect(() => {
    if (!isOpen || rewardReady) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SPONSOR_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, rewardReady]);

  if (!isOpen) return null;

  const currentQuota = getAiQuota();
  const progressPercent = Math.min(100, Math.round(((AD_DURATION_SEC - secondsLeft) / AD_DURATION_SEC) * 100));
  const slide = SPONSOR_SLIDES[activeSlide];

  const handleClaimReward = async () => {
    const updated = await refillAiQuota(DEFAULT_AI_QUOTA);
    if (onRewardClaimed) {
      onRewardClaimed(updated.remaining);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden flex flex-col relative"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.onSurface,
        }}
      >
        {/* Top Ad Banner Header */}
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}
        >
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-500 border border-amber-500/30">
              Ad • 15s
            </span>
            <span className="text-xs opacity-75 font-medium">Watch to refill AI quota</span>
          </div>

          {rewardReady ? (
            <button
              onClick={onClose}
              className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
              title="Close"
            >
              <Icon name="x" size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{secondsLeft}s</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-black/30 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Ad Body / Video Player Simulation */}
        <div className="p-6 flex flex-col items-center text-center space-y-5">
          {!rewardReady ? (
            <>
              {/* Dynamic Animated Sponsor Card */}
              <div
                className="w-full rounded-2xl p-6 border relative overflow-hidden transition-all duration-500 flex flex-col items-center justify-center min-h-[190px]"
                style={{
                  backgroundColor: colors.surfaceSecondary,
                  borderColor: slide.color + '44',
                }}
              >
                {/* Glow behind icon */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-20 pointer-events-none"
                  style={{ backgroundColor: slide.color }}
                />

                <span
                  className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3"
                  style={{ backgroundColor: slide.color + '22', color: slide.color }}
                >
                  {slide.tag}
                </span>

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-lg transition-transform hover:scale-105"
                  style={{ backgroundColor: slide.color, color: '#FFFFFF' }}
                >
                  <Icon name={slide.icon as any} size={26} />
                </div>

                <h3 className="text-base sm:text-lg font-bold leading-snug px-2">
                  {slide.title}
                </h3>
                <p className="text-xs opacity-60 mt-1 max-w-xs">
                  {slide.desc}
                </p>

                {/* Animated mini sound wave */}
                <div className="flex items-center gap-1 mt-4">
                  {[40, 75, 50, 90, 60, 30].map((h, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full bg-emerald-500 animate-pulse"
                      style={{
                        height: `${h * 0.25}px`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status info */}
              <div className="space-y-1">
                <span className="text-xs opacity-50 block font-medium">
                  Reward unlocks automatically in {secondsLeft} seconds
                </span>
                <span className="text-sm font-semibold text-emerald-400">
                  +13 AI Messages Waiting
                </span>
              </div>
            </>
          ) : (
            /* Celebration Screen when 15 seconds complete */
            <div className="py-4 flex flex-col items-center space-y-4 animate-scale-up">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl animate-bounce"
                style={{ backgroundColor: colors.brandPrimary }}
              >
                <Icon name="check-circle" size={32} />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black">Reward Unlocked!</h3>
                <p className="text-sm opacity-70 max-w-xs">
                  Thanks for watching the 15-second sponsor video. You earned 13 more AI messages!
                </p>
              </div>

              <div
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold"
                style={{
                  backgroundColor: colors.brandTertiary,
                  borderColor: colors.brandSecondary,
                  color: colors.brandPrimary,
                }}
              >
                <Icon name="zap" size={16} />
                <span>+13 Messages Ready</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div
          className="p-4 border-t"
          style={{ borderColor: colors.divider, backgroundColor: colors.surfaceSecondary }}
        >
          {rewardReady ? (
            <button
              onClick={handleClaimReward}
              className="w-full py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all shadow-lg hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
              style={{
                backgroundColor: colors.brandPrimary,
                color: colors.onBrandPrimary,
              }}
            >
              <Icon name="zap" size={18} />
              <span>Claim +13 Messages & Continue</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3.5 rounded-2xl font-semibold text-sm opacity-50 cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: colors.surfaceTertiary,
                color: colors.muted,
              }}
            >
              <Icon name="clock" size={16} />
              <span>Watching Ad... ({secondsLeft}s)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
