
import { CheckSquare } from 'lucide-react';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
  // Timer specific properties
  timerDuration?: number; // in seconds
  remainingTime?: number; // in seconds
  isRunning?: boolean;
  isTimerCompleted?: boolean;
}

export const TASK_STORAGE_KEY = 'drlevey-tasks-v2';

export const TEXTS = {
  MODAL_TITLE: 'Task & Time Manager',
  INPUT_PLACEHOLDER: 'What do you need to accomplish?',
  EMPTY_STATE: 'No tasks yet. Add one to get started.',
  PROGRESS_LABEL: 'Progress',
  TIMER_COMPLETED_MSG: 'Time is up for task:',
};

export const ICONS = {
  Main: CheckSquare
};
