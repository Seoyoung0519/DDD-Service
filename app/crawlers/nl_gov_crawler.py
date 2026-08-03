from typing import List, Dict
from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import re

from app.crawlers.base_crawler import BaseCrawler


class NLGovCrawler(BaseCrawler):
    """국립중앙도서관 (nl.go.kr) 행사/전시 크롤러"""

    def __init__(self):
        super().__init__(source_name="nl_gov", category="event")

    def get_url(self) -> str:
        return "https://www.nl.go.kr/NL/contents/N50200000000.do"

    def parse(self, html: str) -> List[Dict]:
        """국립중앙도서관 행사/전시 정보 파싱"""
        banners = []
        try:
            soup = BeautifulSoup(html, 'html.parser')

            # 실제 사이트 구조에 맞게 조정 필요
            # 예시: 행사 목록이 .event-list 클래스의 li 요소에 있다고 가정
            event_items = soup.select('.event-list li') or soup.select('ul li')

            for item in event_items[:10]:  # 최대 10개까지만
                try:
                    # 제목 추출
                    title_elem = item.select_one('a, .title, h3')
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
                        landing_url = 'https://www.nl.go.kr' + landing_url

                    # 설명 추출
                    desc_elem = item.select_one('.desc, .description, p')
                    description = desc_elem.get_text(strip=True) if desc_elem else ""

                    # 날짜 추출 (형식: 2023.6.1~2023.6.30)
                    date_text = None
                    date_elem = item.select_one('.date, .period, .when')
                    if date_elem:
                        date_text = date_elem.get_text(strip=True)

                    start_at, end_at = self._parse_date_range(date_text)

                    # 이미지 추출 (있으면)
                    img_elem = item.select_one('img')
                    image_url = None
                    if img_elem:
                        image_url = img_elem.get('src') or img_elem.get('data-src')
                        if image_url and not image_url.startswith('http'):
                            image_url = 'https://www.nl.go.kr' + image_url

                    banners.append({
                        'title': title,
                        'description': description,
                        'image_url': image_url,
                        'landing_url': landing_url,
                        'start_at': start_at,
                        'end_at': end_at,
                        'location': '국립중앙도서관',
                    })

                except Exception as e:
                    print(f"[NL] Parse item failed: {e}")
                    continue

        except Exception as e:
            print(f"[NL] Parse failed: {e}")

        return banners

    def _parse_date_range(self, date_text: str) -> tuple:
        """날짜 범위 파싱 (예: '2023.6.1~2023.6.30' 또는 '6월 1일~30일')"""
        if not date_text:
            return None, None

        try:
            # 형식: 2023.6.1~2023.6.30
            if '~' in date_text:
                start_str, end_str = date_text.split('~')
                start_str = start_str.strip()
                end_str = end_str.strip()

                # 2023.6.1 형식
                if '.' in start_str:
                    parts = start_str.split('.')
                    if len(parts) == 3:
                        year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                        start_at = f"{year:04d}-{month:02d}-{day:02d}"

                    parts = end_str.split('.')
                    if len(parts) == 3:
                        year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
                        end_at = f"{year:04d}-{month:02d}-{day:02d}"

                return start_at, end_at

        except Exception as e:
            print(f"[NL] Date parse failed: {e}")

        return None, None
