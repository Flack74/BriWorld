/* eslint-disable @typescript-eslint/consistent-type-definitions */
import type { GameState, RoomUpdate, AnswerSubmittedPayload } from "./game";

/**
 * ===============================
 * CLIENT -> SERVER (Commands)
 * ===============================
 * These are messages sent FROM React TO Go backend.
 */

export interface SetRoundsCommand {
  type: "set_rounds";
  payload: {
    rounds: number;
  };
}

export interface StartGameCommand {
  type: "start_game";
}

export interface SubmitAnswerCommand {
  type: "submit_answer";
  payload: {
    answer: string;
    response_time_ms?: number;
  };
}

export interface SetMapModeCommand {
  type: "set_map_mode";
  payload: {
    mode: "FREE" | "STRICT";
  };
}

export interface ChatMessageCommand {
  type: "chat_message";
  payload: {
    message: string;
  };
}

export interface ColorSelectedCommand {
  type: "color_selected";
  payload: {
    color: string;
  };
}

export interface JoinRoomCommand {
  type: "join_room";
  payload: {
    room_code: string;
    username: string;
    game_mode: GameState["game_mode"];
    room_type: GameState["room_type"];
    rounds?: number;
  };
}

export interface LeaveRoomCommand {
  type: "leave_room";
}

export interface PingCommand {
  type: "ping";
  payload?: {
    timestamp: number;
  };
}

/**
 * Union of ALL client commands (STRICT, no `any`)
 */
export type ClientCommand =
  | SetRoundsCommand
  | StartGameCommand
  | SubmitAnswerCommand
  | SetMapModeCommand
  | ChatMessageCommand
  | ColorSelectedCommand
  | JoinRoomCommand
  | LeaveRoomCommand
  | PingCommand;

/**
 * ===============================
 * SERVER -> CLIENT (Events)
 * ===============================
 * These are messages sent FROM Go backend TO React.
 */

export interface RoomJoinedEvent {
  type: "room_joined";
  payload: GameState;
}

export interface RoomUpdateEvent {
  type: "room_update";
  payload: RoomUpdate;
}

export interface StateSnapshotEvent {
  type: "state_snapshot";
  payload: GameState;
}

export interface GameStartedEvent {
  type: "game_started";
  payload: GameState;
}

export interface AnswerSubmittedEvent {
  type: "answer_submitted";
  payload: AnswerSubmittedPayload;
}

export interface ScoreUpdateEvent {
  type: "score_update";
  payload: {
    scores: Record<string, number>;
  };
}

export interface PlayerJoinedEvent {
  type: "player_joined";
  payload: {
    username: string;
  };
}

export interface PlayerReconnectedEvent {
  type: "player_reconnected";
  payload: {
    username: string;
  };
}

export interface PlayerDisconnectedEvent {
  type: "player_disconnected";
  payload: {
    username: string;
    reconnect_deadline?: number; // for 1m30s reconnect feature
  };
}

export interface TimerUpdateEvent {
  type: "timer_update";
  payload: {
    time_remaining: number;
    deadline?: number;
  };
}

export interface RoundEndedEvent {
  type: "round_ended";
  payload: GameState;
}

export interface GameCompletedEvent {
  type: "game_completed";
  payload: GameState;
}

export interface ErrorEvent {
  type: "error";
  payload: {
    message: string;
    code?: string;
  };
}

/**
 * Union of ALL server events
 */
export type ServerEvent =
  | RoomJoinedEvent
  | RoomUpdateEvent
  | StateSnapshotEvent
  | GameStartedEvent
  | AnswerSubmittedEvent
  | ScoreUpdateEvent
  | PlayerJoinedEvent
  | PlayerReconnectedEvent
  | PlayerDisconnectedEvent
  | TimerUpdateEvent
  | RoundEndedEvent
  | GameCompletedEvent
  | ErrorEvent;

/**
 * ===============================
 * GENERIC WS ENVELOPE
 * ===============================
 */

export type WebSocketIncomingMessage = ServerEvent;
export type WebSocketOutgoingMessage = ClientCommand;

/**
 * Type guards (production-grade safety)
 */
export function isServerEvent(msg: unknown): msg is ServerEvent {
  return (
    typeof msg === "object" &&
    msg !== null &&
    "type" in msg &&
    typeof (msg as { type: unknown }).type === "string"
  );
}
