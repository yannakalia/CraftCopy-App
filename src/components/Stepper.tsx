import React from 'react';
import { PenTool, Sparkles, CheckCircle2, Share2, HelpCircle } from 'lucide-react';

export type WorkflowStep = 'form' | 'generating' | 'review' | 'ready';

interface StepperProps {
  currentStep: WorkflowStep;
  onStepClick?: (step: WorkflowStep) => void;
  canNavigateToReview: boolean;
  canNavigateToReady: boolean;
}

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepClick,
  canNavigateToReview,
  canNavigateToReady,
}) => {
  const steps: { id: WorkflowStep; label: string; sub: string; icon: React.ReactNode }[] = [
    {
      id: 'form',
      label: '1. Product & Photo',
      sub: 'Details & Materials',
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      id: 'generating',
      label: '2. AI Generation',
      sub: 'Creative Copy & Pricing',
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      id: 'review',
      label: '3. Review & Edit',
      sub: 'Refine & Satisfaction',
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      id: 'ready',
      label: '4. Ready to Post',
      sub: 'Approve, Save & Share',
      icon: <CheckCircle2 className="w-4 h-4" />,
    },
  ];

  const getStepIndex = (step: WorkflowStep) => {
    switch (step) {
      case 'form': return 0;
      case 'generating': return 1;
      case 'review': return 2;
      case 'ready': return 3;
    }
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full bg-[#FAF7F2] border-b border-[#E8DFD1]/80 py-3.5 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between relative">
          {/* Connecting line */}
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-0.5 bg-[#E6DDD0] -z-0" />
          <div
            className="absolute top-1/2 left-4 -translate-y-1/2 h-0.5 bg-[#4E654E] transition-all duration-500 -z-0"
            style={{ width: `${(currentIndex / 3) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isActive = currentStep === step.id;
            const isCompleted = idx < currentIndex;
            const isClickable =
              idx === 0 ||
              (step.id === 'review' && canNavigateToReview) ||
              (step.id === 'ready' && canNavigateToReady);

            return (
              <button
                key={step.id}
                disabled={!isClickable && !isActive}
                onClick={() => isClickable && onStepClick?.(step.id)}
                className={`relative z-10 flex flex-col items-center group transition-all text-left ${
                  isClickable ? 'cursor-pointer' : 'cursor-default'
                }`}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all border-2 ${
                    isActive
                      ? 'bg-[#4E654E] text-[#FAF7F2] border-[#4E654E] ring-4 ring-[#4E654E]/20 scale-105'
                      : isCompleted
                      ? 'bg-[#E7EFE6] text-[#344834] border-[#4E654E]'
                      : 'bg-[#F2ECE1] text-[#917E6B] border-[#D8CCBD]'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5 text-[#4E654E]" /> : step.icon}
                </div>
                <div className="hidden sm:block text-center mt-1.5">
                  <span
                    className={`block text-xs font-semibold ${
                      isActive ? 'text-[#3E523E]' : isCompleted ? 'text-[#584435]' : 'text-[#968473]'
                    }`}
                  >
                    {step.label}
                  </span>
                  <span className="block text-[11px] text-[#867362]">{step.sub}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
