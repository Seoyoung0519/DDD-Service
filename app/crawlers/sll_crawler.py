from typing import List, Dict
from bs4 import BeautifulSoup
import re

from app.crawlers.base_crawler import BaseCrawler


class SLLCrawler(BaseCrawler):
    """서울시 평생학습포털 (sll.seoul.go.kr) 독서 챌린지/강좌 크롤러"""

    def __init__(self):
        super().__init__(source_name="sll", category="challenge")

    def get_url(self) -> str:
        # 서울시 평생학습 포털 - 독서 관련 강좌/프로그램
        return "https://www.sll.seoul.go.kr/"

    def parse(self, html: str) -> List[Dict]:
        """서울시 평생학습 독서 관련 프로그램 파싱"""
        banners = []
        try:
            soup = BeautifulSoup(html, 'html.parser')

            # 실제 사이트 구조에 맞게 조정 필요
            # 예시: 강좌/프로그램 목록이 특정 클래스에 있다고 가정
            course_items = soup.select('.course-list li') or \
                           soup.select('[class*="program"] li') or \
                           soup.select('.list-item') or \
                           soup.select('[class*="course"] .item')

            for item in course_items[:10]:
                try:
                    # 제목 추출
                    title_elem = item.select_one('a, .title, h3, h4, .course-title')
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)
                    if not title or len(title) < 3:
                        continue

                    # "독서" 관련 강좌만 필터링 (선택사항)
                    if '독서' not in title and '책' not in title and '읽기' not in title:
                        continue

                    # URL 추출
                    url_elem = item.select_one('a')
                    if not url_elem or not url_elem.get('href'):
                        continue
                    landing_url = url_elem.get('href')
                    if not landing_url.startswith('http'):
                        landing_url = 'https://www.sll.seoul.go.kr' + landing_url

                    # 설명 추출
                    desc_elem = item.select_one('.desc, .description, p, .summary, .content')
                    description = desc_elem.get_text(strip=True) if desc_elem else ""

                    # 날짜 추출 (강좌 기간)
                    date_text = None
                    date_elem = item.select_one('[class*="date"], .period, .when, .duration, .term')
                    if date_elem:
                        date_text = date_elem.get_text(strip=True)

                    start_at, end_at = self._parse_date_range(date_text)

                    # 장소 추출
                    location = None
                    location_elem = item.select_one('[class*="location"], .place, .venue, .institute')
                    if location_elem:
                        location = location_elem.get_text(strip=True)

                    # 이미지 추출
                    img_elem = item.select_one('img')
                    image_url = None
                    if img_elem:
                        image_url = img_elem.get('src') or img_elem.get('data-src')
                        if image_url and not image_url.startswith('http'):
                            image_url = 'https://www.sll.seoul.go.kr' + image_url

                    banners.append({
                        'title': title,
                        'description': description,
                        'image_url': image_url,
                        'landing_url': landing_url,
                        'start_at': start_at,
                        'end_at': end_at,
                        'location': location or '서울시 평생학습',
                    })

                except Exception as e:
                    print(f"[SLL] Parse item failed: {e}")
                    continue

        except Exception as e:
            print(f"[SLL] Parse failed: {e}")

        return banners

    def _parse_date_range(self, date_text: str) -> tuple:
        """날짜 범위 파싱"""
        if not date_text:
            return None, None

        try:
            start_at = None
            end_at = None

            # ~ 기준으로 분할
            if '~' in date_text:
                start_str, end_str = date_text.split('~')
                start_str = start_str.strip()
                end_str = end_str.strip()

                # 형식: 2023.6.1 또는 2023-06-01 또는 2023/06/01
                if '.' in start_str:
                    match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', start_str)
                    if match:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        start_at = f"{year:04d}-{month:02d}-{day:02d}"

                elif '/' in start_str:
                    match = re.search(r'(\d{4})/(\d{1,2})/(\d{1,2})', start_str)
                    if match:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        start_at = f"{year:04d}-{month:02d}-{day:02d}"

                elif '-' in start_str and start_str.count('-') >= 2:
                    match = re.search(r'(\d{4})-(\d{1,2})-(\d{1,2})', start_str)
                    if match:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        start_at = f"{year:04d}-{month:02d}-{day:02d}"

                # end_at 파싱
                if '.' in end_str:
                    match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', end_str)
                    if match:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        end_at = f"{year:04d}-{month:02d}-{day:02d}"
                    else:
                        # 같은 연월
                        if start_at:
                            match = re.search(r'(\d{1,2})\.(\d{1,2})', end_str)
                            if match:
                                month, day = int(match.group(1)), int(match.group(2))
                                year = int(start_at.split('-')[0])
                                end_at = f"{year:04d}-{month:02d}-{day:02d}"

                elif '/' in end_str:
                    match = re.search(r'(\d{4})/(\d{1,2})/(\d{1,2})', end_str)
                    if match:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        end_at = f"{year:04d}-{month:02d}-{day:02d}"
                    else:
                        if start_at:
                            match = re.search(r'(\d{1,2})/(\d{1,2})', end_str)
                            if match:
                                month, day = int(match.group(1)), int(match.group(2))
                                year = int(start_at.split('-')[0])
                                end_at = f"{year:04d}-{month:02d}-{day:02d}"

            return start_at, end_at

        except Exception as e:
            print(f"[SLL] Date parse failed: {e}")

        return None, None
