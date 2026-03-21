export type ProfileAssetType = "image" | "gif" | "lottie";
export type ProfileDecorationTarget = "avatar" | "banner";

export interface ProfileAsset {
  id: string;
  user_id: string;
  kind: string;
  asset_type: ProfileAssetType;
  name: string;
  url: string;
  public_id?: string;
  resource_type?: string;
  mime_type?: string;
  file_size?: number;
  provider?: string;
  metadata_json?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProfileDecoration {
  id?: string;
  asset_id?: string | null;
  name: string;
  source: "uploaded" | "prebuilt";
  asset_type: ProfileAssetType;
  target: ProfileDecorationTarget;
  asset_url: string;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
  z_index: number;
  loop: boolean;
  speed: number;
  enabled: boolean;
  config_json?: string;
}

export interface ProfileCustomizationPayload {
  profile_customization_json: string;
  decorations: ProfileDecoration[];
}
