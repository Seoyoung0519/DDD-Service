import { ImageSourcePropType } from 'react-native';

export const ALLOWED_AVATAR_IDS = [
  'avatar_01',
  'avatar_02',
  'avatar_03',
  'avatar_04',
  'avatar_05',
  'avatar_06',
  'avatar_07',
  'avatar_08',
] as const;

export type UserAvatarId = (typeof ALLOWED_AVATAR_IDS)[number];

const AVATAR_SOURCES: Record<UserAvatarId, ImageSourcePropType> = {
  avatar_01: require('@/assets/images/profile-characters/avatar_01.png'),
  avatar_02: require('@/assets/images/profile-characters/avatar_02.png'),
  avatar_03: require('@/assets/images/profile-characters/avatar_03.png'),
  avatar_04: require('@/assets/images/profile-characters/avatar_04.png'),
  avatar_05: require('@/assets/images/profile-characters/avatar_05.png'),
  avatar_06: require('@/assets/images/profile-characters/avatar_06.png'),
  avatar_07: require('@/assets/images/profile-characters/avatar_07.png'),
  avatar_08: require('@/assets/images/profile-characters/avatar_08.png'),
};

const DEFAULT_AVATAR_ID: UserAvatarId = 'avatar_01';

export function isUserAvatarId(value: string | null | undefined): value is UserAvatarId {
  return !!value && (ALLOWED_AVATAR_IDS as readonly string[]).includes(value);
}

export function getUserAvatarSource(avatarId: string | null | undefined): ImageSourcePropType {
  if (isUserAvatarId(avatarId)) return AVATAR_SOURCES[avatarId];
  return AVATAR_SOURCES[DEFAULT_AVATAR_ID];
}

export function getUserAvatarList(): { id: UserAvatarId; source: ImageSourcePropType }[] {
  return ALLOWED_AVATAR_IDS.map((id) => ({ id, source: AVATAR_SOURCES[id] }));
}
