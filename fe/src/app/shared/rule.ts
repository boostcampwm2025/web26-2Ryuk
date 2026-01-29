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
  },
} as const;

export default Rules;
