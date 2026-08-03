from typing import List, Dict
from bs4 import BeautifulSoup
import re

from app.crawlers.base_crawler import BaseCrawler


class SeoulLibCrawler(BaseCrawler):
    """서울도서관 (lib.seoul.go.kr) 행사/프로그램 크롤러"""

    def __init__(self):
        super().__init__(source_name="seoul_lib", category="event")

    def get_url(self) -> str:
        # 서울도서관 행사/프로그램 페이지
        return "https://lib.seoul.go.kr/contents/program/"

    def parse(self, html: str) -> List[Dict]:
        """서울도서관 행사/프로그램 정보 파싱"""
        banners = []
        try:
            soup = BeautifulSoup(html, 'html.parser')

            # 실제 사이트 구조에 맞게 조정 필요
            # 예시: 프로그램 목록이 .program-list li 또는 .list-item 클래스에 있다고 가정
            program_items = soup.select('.program-list li') or \
                            soup.select('.list-item') or \
                            soup.select('[class*="program"] li')

            for item in program_items[:10]:
                try:
                    # 제목 추출
                    title_elem = item.select_one('a, .title, h3, h4')
                    if not title_elem:
                        continue
                    title = title_elem.get_text(strip=True)
                    if not title or len(title) < 3:
                        continue

                    # URL 추출
                    url_elem = item.select_one('a')
                    if not url_elem or not url_elem.get('href'):
                        continue
                    landing_url = url_elem.get('href')
                    if not landing_url.startswith('http'):
                        landing_url = 'https://lib.seoul.go.kr' + landing_url

                    # 설명 추출
                    desc_elem = item.select_one('.desc, .description, p, .summary')
                    description = desc_elem.get_text(strip=True) if desc_elem else ""

                    # 날짜 추출
                    date_text = None
                    date_elem = item.select_one('[class*="date"], .period, .when, .term')
                    if date_elem:
                        date_text = date_elem.get_text(strip=True)

                    start_at, end_at = self._parse_date_range(date_text)

                    # 장소 추출
                    location = None
                    location_elem = item.select_one('[class*="location"], .place, .venue')
                    if location_elem:
                        location = location_elem.get_text(strip=True)

                    # 이미지 추출
                    img_elem = item.select_one('img')
                    image_url = None
                    if img_elem:
                        image_url = img_elem.get('src') or img_elem.get('data-src')
                        if image_url and not image_url.startswith('http'):
                            image_url = 'https://lib.seoul.go.kr' + image_url

                    banners.append({
                        'title': title,
                        'description': description,
                        'image_url': image_url,
                        'landing_url': landing_url,
                        'start_at': start_at,
                        'end_at': end_at,
                        'location': location or '서울도서관',
                    })

                except Exception as e:
                    print(f"[Seoul Lib] Parse item failed: {e}")
                    continue

        except Exception as e:
            print(f"[Seoul Lib] Parse failed: {e}")

        return banners

    def _parse_date_range(self, date_text: str) -> tuple:
        """날짜 범위 파싱
        형식 예:
        - '2023.6.1 ~ 2023.6.30'
        - '2023-06-01 ~ 2023-06-30'
        - '6월 1일 ~ 30일' (같은 연월일 때)
        """
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

                # 형식: 2023.6.1 또는 2023-06-01
                if '.' in start_str:
                    # 2023.6.1 형식
                    match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', start_str)
                    if match:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        start_at = f"{year:04d}-{month:02d}-{day:02d}"

                elif '-' in start_str:
                    # 2023-06-01 형식
                    match = re.search(r'(\d{4})-(\d{2})-(\d{2})', start_str)
                    if match:
                        start_at = match.group(0)

                # end_at 파싱
                if '.' in end_str:
                    match = re.search(r'(\d{4})\.(\d{1,2})\.(\d{1,2})', end_str)
                    if match:
                        year, month, day = int(match.group(1)), int(match.group(2)), int(match.group(3))
                        end_at = f"{year:04d}-{month:02d}-{day:02d}"
                    else:
                        # 같은 연월이면 start_at의 연월 사용
                        if start_at:
                            match = re.search(r'(\d{1,2})\.(\d{1,2})', end_str)
                            if match:
                                month, day = int(match.group(1)), int(match.group(2))
                                year = int(start_at.split('-')[0])
                                end_at = f"{year:04d}-{month:02d}-{day:02d}"

                elif '-' in end_str:
                    match = re.search(r'(\d{4})-(\d{2})-(\d{2})', end_str)
                    if match:
                        end_at = match.group(0)
                    else:
                        # 같은 연월
                        if start_at:
                            match = re.search(r'(\d{2})-(\d{2})', end_str)
                            if match:
                                month, day = int(match.group(1)), int(match.group(2))
                                year = int(start_at.split('-')[0])
                                end_at = f"{year:04d}-{month:02d}-{day:02d}"

            return start_at, end_at

        except Exception as e:
            print(f"[Seoul Lib] Date parse failed: {e}")

        return None, None
