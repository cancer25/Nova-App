import React, { useState } from 'react';
import { useStore } from '@/src/store/store';
import { useTheme } from '@/src/theme';
import { Focus } from '@/src/store/types';

interface OnboardingModalProps {
  onComplete: () => void;
}

const IMG_1 =
  'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';
const IMG_2 =
  'https://images.unsplash.com/photo-1551042710-de601b4dcdc3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';
const IMG_3 =
  'https://images.unsplash.com/photo-1768209198274-01dd8d79cd1e?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200';

const STEPS = [
  {
    key: 'welcome',
    image: IMG_1,
    title: 'Welcome to NOVA',
    subtitle: 'Your quiet space to think, plan, and get things done.',
  },
  {
    key: 'promise',
    image: IMG_2,
    title: 'Turn thoughts into plans.',
    subtitle: 'Capture anything on your mind — organize it in seconds.',
  },
  {
    key: 'clarity',
    image: IMG_3,
    title: 'Know what to do next.',
    subtitle: 'A simple daily view keeps you focused, calm, and clear.',
  },
] as const;

const FOCUS_OPTIONS: { key: Focus; label: string }[] = [
  { key: 'tasks', label: 'My daily tasks' },
  { key: 'studies', label: 'My academic studies' },
  { key: 'work', label: 'My work & projects' },
  { key: 'personal', label: 'My personal habits' },
  { key: 'everything', label: 'Everything in one place' },
];

export function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const { colors } = useTheme();
  const { updateSettings } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [focus, setFocus] = useState<Focus | null>('everything');

  const totalSlideSteps = STEPS.length;
  const isSlide = step < totalSlideSteps;
  const isNameStep = step === totalSlideSteps;
  const isFocusStep = step === totalSlideSteps + 1;

  const handleNext = () => {
    if (isFocusStep) {
      updateSettings({
        name: name.trim() || 'Friend',
        focus: focus || 'everything',
        onboarded: true,
      });
      onComplete();
      return;
    }
    setStep((s) => s + 1);
  };

  if (isSlide) {
    const s = STEPS[step];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fade-in">
        <div className="w-full max-w-lg h-[620px] rounded-3xl overflow-hidden relative shadow-2xl flex flex-col justify-end p-6 sm:p-8 text-white">
          <img
            src={s.image}
            alt="Hero background"
            className="absolute inset-0 w-full h-full object-cover -z-20 filter brightness-75"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent -z-10" />

          {/* Dots */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '24px' : '6px',
                  backgroundColor: i === step ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight leading-tight">
            {s.title}
          </h2>
          <p className="text-base opacity-85 mt-2 mb-8 leading-relaxed font-medium">
            {s.subtitle}
          </p>

          <button
            onClick={handleNext}
            className="w-full py-4 rounded-full font-bold text-base transition-transform active:scale-98 shadow-lg"
            style={{
              backgroundColor: colors.brandPrimary,
              color: colors.onBrandPrimary,
            }}
          >
            {step === STEPS.length - 1 ? 'Get Started' : 'Continue'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg rounded-3xl border shadow-2xl p-6 sm:p-8 space-y-6"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
        }}
      >
        {isNameStep ? (
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold opacity-60">Step 1 of 2</span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1">What should we call you?</h2>
              <p className="text-sm opacity-60 mt-1">Just a first name is perfect.</p>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleNext()}
              placeholder="Your name"
              autoFocus
              className="w-full px-4 py-3.5 rounded-xl border text-lg font-semibold bg-transparent outline-none focus:border-emerald-600 transition-colors"
              style={{
                borderColor: colors.border,
                backgroundColor: colors.surfaceSecondary,
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-bold opacity-60">Step 2 of 2</span>
              <h2 className="text-2xl sm:text-3xl font-bold mt-1">What do you want to organize?</h2>
              <p className="text-sm opacity-60 mt-1">We will tailor your space accordingly.</p>
            </div>

            <div className="space-y-2">
              {FOCUS_OPTIONS.map((opt) => {
                const selected = focus === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setFocus(opt.key)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all"
                    style={{
                      backgroundColor: selected ? colors.brandSecondary : colors.surfaceSecondary,
                      borderColor: selected ? colors.brandPrimary : colors.border,
                      color: selected ? colors.onBrandSecondary : colors.onSurface,
                    }}
                  >
                    <span className="font-semibold text-sm sm:text-base">{opt.label}</span>
                    <span
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                      style={{
                        borderColor: selected ? colors.brandPrimary : colors.borderStrong,
                        backgroundColor: selected ? colors.brandPrimary : 'transparent',
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleNext}
          disabled={isNameStep && !name.trim()}
          className="w-full py-3.5 rounded-full font-bold text-base transition-all disabled:opacity-40"
          style={{
            backgroundColor: colors.brandPrimary,
            color: colors.onBrandPrimary,
          }}
        >
          {isFocusStep ? 'Enter NOVA' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
