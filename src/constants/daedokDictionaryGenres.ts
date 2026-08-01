export type DaedokDictionaryGenre = {
  id: string;
  order: number;
  label: string;
  description: string;
  recommendedBookTitle: string;
  recommendedBookReason: string;
};

/** PDF 「대독사전 도서 장르 콘텐츠」 — 스티커 (1)~(18) 순서 */
export const DAEDOK_DICTIONARY_GENRES: DaedokDictionaryGenre[] = [
  {
    id: 'prose',
    order: 1,
    label: '산문집',
    description:
      '일상의 경험과 생각을 자유롭게 담은 글이에요. 거창한 이야기보다 평범한 하루 속에서 특별함을 발견하고 싶은 분들, 누군가의 진솔한 기록을 읽으며 천천히 사색하고 싶은 분들께 추천해요.',
    recommendedBookTitle: '아침의 피아노',
    recommendedBookReason:
      '죽음을 앞둔 철학자가 남긴 마지막 기록이에요. 평범한 하루 속에서도 삶의 의미를 발견하는 과정을 담고 있어 산문집의 매력을 잘 보여줘요.',
  },
  {
    id: 'essay',
    order: 2,
    label: '에세이',
    description:
      '작가의 경험과 감정을 이야기하듯 풀어낸 글이에요.',
    recommendedBookTitle: '나는 나로 살기로 했다',
    recommendedBookReason:
      '타인의 시선보다 나 자신을 존중하는 방법을 이야기해요. 공감하기 쉬운 내용이 많아 에세이 입문용으로 추천해요.',
  },
  {
    id: 'novel',
    order: 3,
    label: '소설',
    description:
      '인물과 사건을 통해 이야기를 펼쳐가는 장르예요. 현실을 잠시 잊고 새로운 세상에 몰입하고 싶은 분들, 다양한 인물의 삶을 간접적으로 경험해보고 싶은 분들께 추천해요.',
    recommendedBookTitle: '달러구트 꿈 백화점',
    recommendedBookReason:
      '사람들이 잠든 사이 꿈을 사고파는 백화점을 배경으로 한 이야기예요. 따뜻한 위로와 상상력이 돋보여요.',
  },
  {
    id: 'poetry',
    order: 4,
    label: '시집',
    description:
      '짧은 문장 안에 감정과 풍경을 담아내는 글이에요. 긴 글이 부담스럽지만 감정을 깊게 느끼고 싶은 분들, 문장 하나하나를 곱씹으며 여운을 즐기고 싶은 분들께 추천해요.',
    recommendedBookTitle: '꽃을 보듯 너를 본다',
    recommendedBookReason:
      '사랑과 위로를 담은 짧은 시들이 수록되어 있어요. 시가 어렵게 느껴지는 사람도 쉽게 읽을 수 있어요.',
  },
  {
    id: 'self-help',
    order: 5,
    label: '자기계발서',
    description:
      '더 나은 습관과 삶의 방향을 제안하는 책이에요. 새로운 목표를 세우고 싶은 분들, 현재의 나를 조금씩 성장시키고 싶은 분들께 추천해요.',
    recommendedBookTitle: '아주 작은 습관의 힘',
    recommendedBookReason:
      '거창한 목표보다 작은 습관 하나가 인생을 바꾼다는 내용을 담고 있어요. 공부, 독서, 운동처럼 꾸준함이 필요한 일을 시작하고 싶은 분들에게 특히 추천하는 책이에요.',
  },
  {
    id: 'humanities',
    order: 6,
    label: '인문학',
    description:
      '인간과 사회, 문화와 역사에 대해 생각해보는 장르예요. 세상을 바라보는 시야를 넓히고 싶은 분들, \'왜?\'라는 질문을 자주 던지는 분들께 추천해요.',
    recommendedBookTitle: '지적 대화를 위한 넓고 얕은 지식',
    recommendedBookReason:
      '역사, 철학, 정치, 경제를 쉽고 재미있게 연결해 설명해요. 인문학 입문자에게 가장 많이 추천되는 책 중 하나예요.',
  },
  {
    id: 'science',
    order: 7,
    label: '과학',
    description:
      '자연과 우주, 생명과 기술의 원리를 설명하는 장르예요. 세상이 어떻게 움직이는지 궁금한 분들, 지적 호기심이 많은 분들께 추천해요.',
    recommendedBookTitle: '코스모스',
    recommendedBookReason:
      '우주와 인간의 관계를 아름답게 설명한 과학 고전이에요. 과학 지식뿐 아니라 세상을 바라보는 시야를 넓혀줘요.',
  },
  {
    id: 'business',
    order: 8,
    label: '경제·경영',
    description:
      '돈과 시장, 기업의 원리를 다루는 장르예요. 경제 뉴스를 읽을 때 이해도를 높이고 싶은 분들, 금융과 투자에 관심 있는 분들께 추천해요.',
    recommendedBookTitle: '돈의 속성',
    recommendedBookReason:
      '돈을 어떻게 바라보고 관리해야 하는지 쉽게 알려주는 경제 교양서예요. 경제 초보자도 부담 없이 읽을 수 있어요.',
  },
  {
    id: 'mystery',
    order: 9,
    label: '추리·미스터리',
    description:
      '단서를 따라가며 사건의 진실을 밝혀가는 이야기예요. 반전과 긴장감을 좋아하는 분들, 범인을 추리하며 읽는 재미를 느끼고 싶은 분들께 추천해요.',
    recommendedBookTitle: '그리고 아무도 없었다',
    recommendedBookReason:
      '외딴 섬에 모인 사람들이 하나씩 사라지는 사건을 다룬 추리소설이에요. 반전의 묘미를 제대로 느낄 수 있어요.',
  },
  {
    id: 'fantasy',
    order: 10,
    label: '판타지',
    description:
      '마법, 초능력, 상상 속 세계를 다루는 장르예요. 현실에서는 경험할 수 없는 세계를 여행하고 싶은 분들, 풍부한 상상력을 즐기고 싶은 분들께 추천해요.',
    recommendedBookTitle: '해리 포터와 마법사의 돌',
    recommendedBookReason:
      '평범한 소년이 마법학교에 입학하며 벌어지는 이야기예요. 판타지 장르의 대표작으로 꼽혀요.',
  },
  {
    id: 'sf',
    order: 11,
    label: 'SF(과학소설)',
    description:
      '과학기술과 미래 사회를 바탕으로 한 이야기예요. AI, 우주, 미래 기술에 관심 있는 분들, 현실과 미래를 연결해 상상하는 것을 좋아하는 분들께 추천해요.',
    recommendedBookTitle: '작별인사',
    recommendedBookReason:
      '인간과 로봇의 경계, 그리고 존재의 의미를 다룬 작품이에요. SF 장르를 처음 접하는 사람도 읽기 쉬워요.',
  },
  {
    id: 'classic',
    order: 12,
    label: '고전문학',
    description:
      '오랜 시간 동안 사랑받아온 작품들이에요. 시대를 초월한 메시지를 만나보고 싶은 분들, 한 번쯤 꼭 읽어야 할 명작을 찾고 있는 분들께 추천해요.',
    recommendedBookTitle: '어린 왕자',
    recommendedBookReason:
      '어린 왕자의 여행을 통해 삶과 관계의 의미를 전하는 작품이에요. 짧지만 깊은 여운을 남겨요.',
  },
  {
    id: 'ya',
    order: 13,
    label: '청소년문학',
    description:
      '성장과 우정, 고민을 다루는 이야기예요. 주인공과 함께 성장하는 경험을 하고 싶은 분들, 따뜻한 공감이 필요한 분들께 추천해요.',
    recommendedBookTitle: '아몬드',
    recommendedBookReason:
      '감정을 잘 느끼지 못하는 소년이 세상과 사람을 이해해가는 성장 이야기예요.',
  },
  {
    id: 'history',
    order: 14,
    label: '역사',
    description:
      '과거의 사건과 인물을 통해 현재를 이해하는 장르예요. 세상이 지금의 모습이 된 이유를 알고 싶은 분들, 실제 이야기를 좋아하는 분들께 추천해요.',
    recommendedBookTitle: '총, 균, 쇠',
    recommendedBookReason:
      '인류 문명의 발전 과정을 흥미롭게 설명해요. 역사에 관심이 없어도 재미있게 읽을 수 있어요.',
  },
  {
    id: 'travel',
    order: 15,
    label: '여행',
    description:
      '여행지와 문화, 경험을 담아낸 장르예요. 당장 떠날 수는 없지만 새로운 세상을 만나고 싶은 분들, 여행의 설렘을 느끼고 싶은 분들께 추천해요.',
    recommendedBookTitle: '여행의 이유',
    recommendedBookReason:
      '왜 사람은 여행을 떠나는지에 대한 작가의 생각과 경험을 담은 책이에요.',
  },
  {
    id: 'psychology',
    order: 16,
    label: '심리학',
    description:
      '사람의 마음과 행동을 이해하는 장르예요. 나 자신과 타인을 더 잘 이해하고 싶은 분들, 인간관계에 대한 고민이 많은 분들께 추천해요.',
    recommendedBookTitle: '미움받을 용기',
    recommendedBookReason:
      '인간관계와 자존감에 대한 고민을 심리학 관점에서 풀어낸 책이에요.',
  },
  {
    id: 'philosophy',
    order: 17,
    label: '철학',
    description:
      '삶과 행복, 존재에 대한 질문을 다루는 장르예요. 정답보다 질문 자체를 즐기는 분들, 삶의 의미를 깊게 생각해보고 싶은 분들께 추천해요.',
    recommendedBookTitle: '죽음의 수용소에서',
    recommendedBookReason:
      '극한의 상황 속에서도 삶의 의미를 찾으려는 인간의 이야기를 담고 있어요.',
  },
  {
    id: 'social-science',
    order: 18,
    label: '사회과학',
    description:
      '사회가 움직이는 원리와 문제를 다루는 장르예요. 뉴스 속 이슈를 더 깊이 이해하고 싶은 분들, 세상을 다양한 시각으로 바라보고 싶은 분들께 추천해요.',
    recommendedBookTitle: '정의란 무엇인가',
    recommendedBookReason:
      '공정함과 정의에 대한 다양한 사례를 통해 스스로 생각해볼 수 있게 해주는 책이에요.',
  },
];

export function getDaedokDictionaryGenreByOrder(order: number): DaedokDictionaryGenre | undefined {
  return DAEDOK_DICTIONARY_GENRES.find((g) => g.order === order);
}
