import { JobType } from "./types";

interface RawMessage {
  sender_name: string;
  timestamp_ms: number;
  content?: string;
  is_unsent?: boolean;
  reactions?: Array<{ reaction: string; actor: string }>;
}

interface MessengerThread {
  participants: Array<{ name: string }>;
  messages: RawMessage[];
}

export interface NormalizedMessage {
  senderName: string;
  timestamp: number;
  text: string;
  reactions: string[];
}

export interface DayBlock {
  day: string;
  blockId: string;
  messages: NormalizedMessage[];
  timeRange: "morning" | "afternoon" | "evening" | "night";
}

export const parseMessengerJson = (input: string): MessengerThread => {
  const parsed = JSON.parse(input) as MessengerThread;
  if (!parsed.messages || !Array.isArray(parsed.messages)) {
    throw new Error("Invalid Messenger export: missing messages array");
  }
  return parsed;
};

export const normalizeMessages = (messages: RawMessage[]): NormalizedMessage[] => {
  return messages
    .filter((message) => !message.is_unsent)
    .map((message) => {
      return {
        senderName: message.sender_name,
        timestamp: message.timestamp_ms,
        text: message.content ?? "",
        reactions: message.reactions?.map((reaction) => reaction.reaction) ?? [],
      };
    })
    .filter((message) => message.text.trim().length > 0);
};

export const groupConsecutiveMessages = (
  messages: NormalizedMessage[],
): NormalizedMessage[] => {
  const grouped: NormalizedMessage[] = [];
  for (const message of messages) {
    const last = grouped[grouped.length - 1];
    if (last && last.senderName === message.senderName) {
      last.text = `${last.text}\n${message.text}`;
      last.reactions = [...last.reactions, ...message.reactions];
    } else {
      grouped.push({ ...message });
    }
  }
  return grouped;
};

export const splitByDay = (messages: NormalizedMessage[]) => {
  const days = new Map<string, NormalizedMessage[]>();
  for (const message of messages) {
    const date = new Date(message.timestamp).toISOString().split("T")[0];
    const bucket = days.get(date) ?? [];
    bucket.push(message);
    days.set(date, bucket);
  }
  return days;
};

const getTimeRange = (timestamp: number): DayBlock["timeRange"] => {
  const hours = new Date(timestamp).getHours();
  if (hours < 12) {
    return "morning";
  }
  if (hours < 16) {
    return "afternoon";
  }
  if (hours < 20) {
    return "evening";
  }
  return "night";
};

export const createBlocksForDay = (
  day: string,
  messages: NormalizedMessage[],
) => {
  const blocks: DayBlock[] = [];
  let blockIndex = 0;
  let currentBlock: DayBlock | null = null;

  for (const message of messages) {
    const range = getTimeRange(message.timestamp);
    if (!currentBlock || currentBlock.timeRange !== range) {
      blockIndex += 1;
      currentBlock = {
        day,
        blockId: `${day}-${blockIndex}`,
        messages: [],
        timeRange: range,
      };
      blocks.push(currentBlock);
    }
    currentBlock.messages.push(message);
  }

  return blocks;
};

export const deriveJobType = (scope: "block" | "day") => {
  return scope === "block" ? JobType.CHAT_BLOCK_ANALYSIS : JobType.DAY_AGGREGATION;
};
