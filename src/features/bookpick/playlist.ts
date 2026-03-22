export const PLAYLISTS = [
  {
    id: 'PL4-UCyPXds6-f_9i8Xgqg2LrE0ddPmiH0',
    title: '다들 뭐 봐? 책장 엿보기',
  },
  {
    id: 'PL4-UCyPXds6_XUO9n1ZCITEH6CIc_9Xs2',
    title: '책 추천이 필요해? 들어와',
  },
  {
    id: 'PLUpgTv3bu9rGxQBAMVaMvam27P0YbiY29',
    title: '이동진이 추천하는 책 모음',
  },
] as const;

export type PlaylistsId = (typeof PLAYLISTS)[number]['id'];

