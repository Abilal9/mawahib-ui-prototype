export interface ProfileSetupStepProps {
  onNext: () => void;
  onBack?: () => void;
  /** Persist current step draft into ProfileContext, then exit to Profile */
  onSave: () => void;
  step: number;
  totalSteps: number;
}
