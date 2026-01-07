import { JobType, ModelId } from "./types";

export const assignModelForJob = (jobType: JobType): ModelId => {
  switch (jobType) {
    case JobType.CHAT_BLOCK_ANALYSIS:
      return "gemma-3-27b";
    case JobType.DAY_AGGREGATION:
      return "gemini-3-flash";
    case JobType.WEEK_AGGREGATION:
    case JobType.MONTH_AGGREGATION:
      return "gemini-2.5-flash";
    case JobType.TEST_DEBUG:
      return "gemini-2.5-flash-lite";
    default:
      return "gemini-2.5-flash-lite";
  }
};

export const fallbackModelForJob = (jobType: JobType): ModelId => {
  switch (jobType) {
    case JobType.CHAT_BLOCK_ANALYSIS:
      return "gemma-3-12b";
    case JobType.DAY_AGGREGATION:
      return "gemini-2.5-flash";
    case JobType.WEEK_AGGREGATION:
    case JobType.MONTH_AGGREGATION:
      return "gemini-2.5-flash";
    case JobType.TEST_DEBUG:
      return "gemini-2.5-flash-lite";
    default:
      return "gemini-2.5-flash-lite";
  }
};
