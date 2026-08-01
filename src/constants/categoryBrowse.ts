/**
 * 대독PICK 카테고리 id → API `category` 쿼리 키
 * @see 카테고리별_추천_API_개발_설명서
 */
export type CategoryApiKey =
  | 'novel'
  | 'essay'
  | 'kids'
  | 'comic'
  | 'business'
  | 'language'
  | 'humanities'
  | 'philosophy'
  | 'science'
  | 'society'
  | 'it'
  | 'history'
  | 'religion'
  | 'travel'
  | 'magazine'
  | 'lifestyle'
  | 'selfdev';

/** DaedokPick `categories[].id` → API category param */
export const PICK_CATEGORY_TO_API: Record<string, CategoryApiKey> = {
  novel: 'novel',
  poetry: 'essay',
  children: 'kids',
  comic: 'comic',
  business: 'business',
  foreign: 'language',
  humanities: 'humanities',
  philosophy: 'philosophy',
  science: 'science',
  society: 'society',
  it: 'it',
  history: 'history',
  religion: 'religion',
  travel: 'travel',
  magazine: 'magazine',
  lifestyle: 'lifestyle',
  selfhelp: 'selfdev',
};

export const CATEGORY_API_LABELS: Record<CategoryApiKey, string> = {
  novel: '소설',
  essay: '시/에세이',
  kids: '어린이',
  comic: '만화',
  business: '경제경영',
  language: '외국어',
  humanities: '인문',
  philosophy: '철학',
  science: '과학',
  society: '사회',
  it: 'IT',
  history: '역사',
  religion: '종교',
  travel: '여행',
  magazine: '매거진',
  lifestyle: '라이프스타일',
  selfdev: '자기계발',
};

export type BrowseChip = {
  label: string;
  /** 알라딘 categoryId (복수일 때 첫 ID로 조회) */
  categoryIds: number[];
};

export type BrowseGroup = {
  title: string;
  chips: BrowseChip[];
};

/** 인문 전체 보기 섹션 */
const HUMANITIES_BROWSE_GROUPS: BrowseGroup[] = [
  {
    title: '인문',
    chips: [
      { label: '인문에세이', categoryIds: [51381] },
      { label: '인문비평', categoryIds: [51384] },
    ],
  },
  {
    title: '심리',
    chips: [
      { label: '교양심리', categoryIds: [51514] },
      { label: '심리치료', categoryIds: [51515] },
    ],
  },
  {
    title: '글쓰기',
    chips: [
      { label: '독서', categoryIds: [51537] },
      { label: '글쓰기', categoryIds: [51538] },
    ],
  },
];

/** 철학 전체 보기 섹션 */
const PHILOSOPHY_BROWSE_GROUPS: BrowseGroup[] = [
  {
    title: '철학',
    chips: [
      { label: '교양철학', categoryIds: [51440] },
      { label: '윤리학', categoryIds: [51449] },
    ],
  },
];

/**
 * 두 번째 페이지(전체 보기) — 알라딘 분류표 기반 칩 구성
 * @see 알라딘_API_카테고리별_분류표.pdf
 */
export const CATEGORY_BROWSE_GROUPS: Record<CategoryApiKey, BrowseGroup[]> = {
  essay: [
    {
      title: '에세이',
      chips: [
        { label: '감성/힐링', categoryIds: [51374, 51375] },
        { label: '여행', categoryIds: [51377] },
        { label: '연애/사랑', categoryIds: [51391] },
        { label: '일상/가족', categoryIds: [51371, 51402] },
        { label: '예술', categoryIds: [51842, 51376] },
        { label: '음식', categoryIds: [180236] },
        { label: '동물', categoryIds: [174700] },
      ],
    },
    {
      title: '시',
      chips: [
        { label: '한국의 시', categoryIds: [51167] },
        { label: '세계의 시', categoryIds: [51168] },
        { label: '한시/옛시', categoryIds: [69256] },
        { label: '명시 모음', categoryIds: [51170] },
        { label: '감성 시', categoryIds: [51169] },
      ],
    },
  ],
  novel: [
    {
      title: '소설',
      chips: [
        { label: '한국소설', categoryIds: [50928] },
        { label: '해외소설', categoryIds: [50929] },
        { label: 'SF', categoryIds: [50930] },
        { label: '추리/스릴러', categoryIds: [50931] },
        { label: '판타지', categoryIds: [50932] },
        { label: '액션/스릴러', categoryIds: [50933] },
        { label: '로맨스', categoryIds: [50935] },
      ],
    },
  ],
  kids: [
    {
      title: '동화',
      chips: [
        { label: '국내창작동화', categoryIds: [48874] },
        { label: '외국창작동화', categoryIds: [48877] },
        { label: '세계명작', categoryIds: [48875] },
      ],
    },
    {
      title: '학습',
      chips: [
        { label: '학습동화', categoryIds: [49223] },
        { label: '논리/논술', categoryIds: [48945] },
        { label: '글쓰기', categoryIds: [48944] },
      ],
    },
    {
      title: '과학',
      chips: [
        { label: '과학 일반', categoryIds: [48867] },
        { label: '생물/생명', categoryIds: [48869] },
        { label: '지구/우주', categoryIds: [48870] },
      ],
    },
    {
      title: '사회',
      chips: [
        { label: '세계사', categoryIds: [48905] },
        { label: '정치/경제', categoryIds: [48909] },
      ],
    },
    {
      title: '문화',
      chips: [
        { label: '음악/미술', categoryIds: [51820] },
        { label: '세계문화', categoryIds: [48900] },
      ],
    },
    {
      title: '콘텐츠',
      chips: [{ label: '학습만화', categoryIds: [112080] }],
    },
  ],
  comic: [
    {
      title: '만화',
      chips: [
        { label: '소년만화', categoryIds: [3727] },
        { label: '순정만화', categoryIds: [3741] },
        { label: '스포츠', categoryIds: [2561] },
        { label: '요리', categoryIds: [3750] },
        { label: '역사', categoryIds: [4670] },
        { label: '시사/풍자', categoryIds: [4669] },
        { label: '그래픽노블', categoryIds: [36192] },
        { label: '웹툰/연재', categoryIds: [7443] },
      ],
    },
  ],
  business: [
    {
      title: '재테크',
      chips: [
        { label: '주식/펀드', categoryIds: [174] },
        { label: '부동산', categoryIds: [175] },
        { label: '암호화폐', categoryIds: [141092] },
      ],
    },
    {
      title: '커리어',
      chips: [
        { label: '창업', categoryIds: [180] },
        { label: '취업', categoryIds: [249] },
      ],
    },
    {
      title: '마케팅',
      chips: [
        { label: '브랜드/마케팅', categoryIds: [1632] },
        { label: 'SNS', categoryIds: [55058] },
      ],
    },
    {
      title: '자기계발(비즈니스)',
      chips: [
        { label: '성공/커리어', categoryIds: [3101] },
        { label: '리더십', categoryIds: [3104] },
      ],
    },
    {
      title: '경제',
      chips: [
        { label: '경제이론', categoryIds: [8586] },
        { label: '경제정책', categoryIds: [3140] },
      ],
    },
    {
      title: '트렌드',
      chips: [
        { label: 'AI/빅데이터', categoryIds: [197415] },
        { label: '미래전망', categoryIds: [263] },
      ],
    },
  ],
  language: [
    {
      title: '영어',
      chips: [
        { label: '회화', categoryIds: [49845] },
        { label: '문법', categoryIds: [49834] },
        { label: '독해', categoryIds: [49835] },
        { label: '어휘', categoryIds: [49838] },
      ],
    },
    {
      title: '시험',
      chips: [
        { label: '토익', categoryIds: [49846] },
        { label: '토플', categoryIds: [49848] },
      ],
    },
    {
      title: '일본어',
      chips: [{ label: '일본어', categoryIds: [49884] }],
    },
    {
      title: '중국어',
      chips: [{ label: '중국어', categoryIds: [49903] }],
    },
  ],
  humanities: HUMANITIES_BROWSE_GROUPS,
  philosophy: PHILOSOPHY_BROWSE_GROUPS,
  science: [
    {
      title: '과학',
      chips: [
        { label: '물리학', categoryIds: [51006] },
        { label: '화학', categoryIds: [51035] },
        { label: '생명과학', categoryIds: [51007] },
        { label: '지구과학', categoryIds: [51030] },
        { label: '수학', categoryIds: [51033] },
        { label: '컴퓨터공학', categoryIds: [51010] },
      ],
    },
  ],
  society: [
    {
      title: '사회',
      chips: [
        { label: '사회문제', categoryIds: [50995] },
        { label: '정치', categoryIds: [51016] },
        { label: '교육', categoryIds: [50999] },
        { label: '젠더', categoryIds: [51037] },
        { label: '미디어', categoryIds: [51041] },
      ],
    },
  ],
  it: [
    {
      title: 'IT',
      chips: [
        { label: 'Python', categoryIds: [6734] },
        { label: 'Java', categoryIds: [2502] },
        { label: '웹개발', categoryIds: [6627] },
        { label: '데이터베이스', categoryIds: [6794] },
        { label: 'AI', categoryIds: [212364] },
      ],
    },
  ],
  history: [
    {
      title: '한국사',
      chips: [
        { label: '조선', categoryIds: [52589] },
        { label: '근현대', categoryIds: [52590] },
      ],
    },
    {
      title: '세계사',
      chips: [
        { label: '중국사', categoryIds: [52594] },
        { label: '일본사', categoryIds: [52595] },
      ],
    },
    {
      title: '전쟁사',
      chips: [{ label: '전쟁사', categoryIds: [52610] }],
    },
  ],
  religion: [
    {
      title: '종교',
      chips: [
        { label: '기독교', categoryIds: [51564] },
        { label: '불교', categoryIds: [51566] },
        { label: '가톨릭', categoryIds: [51565] },
        { label: '명상', categoryIds: [51569] },
        { label: '사주/운세', categoryIds: [51660] },
      ],
    },
  ],
  travel: [
    {
      title: '여행',
      chips: [
        { label: '국내여행', categoryIds: [50827] },
        { label: '유럽', categoryIds: [63634] },
        { label: '일본', categoryIds: [63860] },
        { label: '여행에세이', categoryIds: [63514] },
        { label: '가이드북', categoryIds: [63513] },
      ],
    },
  ],
  magazine: [
    {
      title: '매거진',
      chips: [
        { label: '시사지', categoryIds: [3563] },
        { label: '여성/패션', categoryIds: [5420] },
        { label: '경제/경영', categoryIds: [7605] },
        { label: 'IT/게임', categoryIds: [9897] },
      ],
    },
  ],
  lifestyle: [
    {
      title: '요리',
      chips: [
        { label: '생활요리', categoryIds: [53472] },
        { label: '디저트', categoryIds: [53480] },
      ],
    },
    {
      title: '건강',
      chips: [
        { label: '다이어트', categoryIds: [53514] },
        { label: '정신건강', categoryIds: [53517] },
      ],
    },
    {
      title: '취미',
      chips: [
        { label: '캠핑', categoryIds: [53529] },
        { label: '퍼즐', categoryIds: [53531] },
      ],
    },
    {
      title: '반려동물',
      chips: [{ label: '반려동물', categoryIds: [53534] }],
    },
  ],
  selfdev: [
    {
      title: '자기계발',
      chips: [
        { label: '취업/진로', categoryIds: [2943] },
        { label: '인간관계', categoryIds: [2951] },
        { label: '성공/리더십', categoryIds: [70214] },
        { label: '시간관리', categoryIds: [70220] },
        { label: '마인드/힐링', categoryIds: [70236] },
      ],
    },
  ],
};

export function resolveCategoryApiKey(pickId: string): CategoryApiKey | null {
  return PICK_CATEGORY_TO_API[pickId] ?? null;
}

export function getBrowseGroups(apiKey: CategoryApiKey): BrowseGroup[] {
  return CATEGORY_BROWSE_GROUPS[apiKey] ?? [];
}

export function primaryCategoryId(chip: BrowseChip): number {
  return chip.categoryIds[0];
}
