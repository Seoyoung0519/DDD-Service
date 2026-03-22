export type BookPickVideoItem = {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  channelName: string;
  duration: string;
  description?: string;
  externalUrl: string;
};

export type BookPickSection = {
  playlistId: string;
  title: string; // 프론트에서 고정
  items: BookPickVideoItem[];
};

export type BookPickVideosResponse = {
  success: boolean;
  data: {
    sections: BookPickSection[];
  };
};

