import { Button } from './Button';

interface StepNavigatorProps {
  step: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  labels?: string[];
}

export function StepNavigator({
  step,
  totalSteps,
  onPrev,
  onNext,
  labels,
}: StepNavigatorProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={onPrev} disabled={step === 0}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Prev
        </Button>

        <span className="text-sm text-text-muted tabular-nums min-w-[5rem] text-center">
          Step {step + 1} of {totalSteps}
        </span>

        <Button
          variant="secondary"
          onClick={onNext}
          disabled={step === totalSteps - 1}
        >
          Next
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ml-1"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </Button>
      </div>

      {labels && labels[step] && (
        <p className="text-sm text-text-muted font-medium">{labels[step]}</p>
      )}
    </div>
  );
}
