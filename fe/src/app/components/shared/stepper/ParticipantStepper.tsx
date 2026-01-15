'use client';

import { ParticipantStepperProps } from './type';
import Stepper from './Stepper';
import Rules from '@/app/shared/rule';

const maxValue = Rules.ROOM.PARTICIPANT_MAX_COUNT;

export default function ParticipantStepper({
  initialValue = 4,
  onChange,
}: ParticipantStepperProps) {
  return (
    <Stepper
      initialValue={initialValue}
      minValue={2}
      maxValue={maxValue}
      suffix="명"
      onChange={onChange}
    />
  );
}
