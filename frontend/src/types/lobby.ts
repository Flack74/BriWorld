export type RoomType = "single" | "private" | "public";

export interface GameMode {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface LobbyState {
  roomType: RoomType;
  selectedMode: string | null;
  roomCode: string;
}
