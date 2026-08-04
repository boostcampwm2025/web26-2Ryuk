const Rules = {
  DATETIME_FORMAT: {
    DATE: 'YYYY-MM-DD',
    TIME: 'HH:mm',
    FULL: 'YYYY-MM-DD HH:mm:ss',
  },
  ROOM: {
    PARTICIPANT_MAX_COUNT: 10,
  },
  GAME: {
    BEAKER: {
      MAX_LEVEL: 500,
      THROTTLE_INTERVAL_MS: 100,
    },
    REFLEX: {
      TOTAL_TRIGGERS: 5,
      TOTAL_DURATION_MS: 30_000,
      READY_DELAY_MS: 800,
      ACTIVE_TIMEOUT_MS: 1000,
      FEEDBACK_DURATION: 2000,
      HIGHEST_SCORE: 200,
      MIN_REACTION_MS: 1,
      MAX_REACTION_MS: 1000,
    },
    BUBBLE: {
      HIGHEST_SCORE: 200,
      MIN_DIFF_MS: 1,
      MAX_DIFF_MS: 20_000,
      INITIAL_RADIUS: 30,
      RADIUS_STEP: 1,
      STEP_INTERVAL_MS: 100,
      TIMER_VISIBLE_MS: 3000,
    },
  },
} as const;

export default Rules;
