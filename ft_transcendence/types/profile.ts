export type ProfileFieldConfig = {
  key: string;
  label: string;
  editable?: boolean;
};

export interface ProfileUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string;
  online: boolean;
  createdAt: string;
  isVerified: boolean;
  use2FA: boolean;
}
