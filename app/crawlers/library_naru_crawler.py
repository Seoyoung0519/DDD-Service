from typing import List, Dict, Optional
import httpx
from datetime import datetime, timedelta, timezone
import xml.etree.ElementTree as ET

from app.db.supabase_client import get_supabase_admin_client


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class LibraryInfoNaruCrawler:
    """도서관 정보나루 API 크롤러

    API 문서: https://www.data4library.kr/openapi
    - 인기대출도서: loanItemSrch
    - 대출 급상승: hotTrend
    """

    def __init__(self, auth_key: str):
        """
        Args:
            auth_key: 도서관 정보나루 API 키 (환경변수에서 가져와야 함)
        """
        self.auth_key = auth_key
        self.base_url = "http://data4library.kr/api"
        self.client = httpx.Client(timeout=15.0)
        self.sb = get_supabase_admin_client()

    def fetch_popular_books(self) -> List[Dict]:
        """인기대출도서 조회 (지난 3개월 전국 기준)"""
        try:
            print("[LibraryInfoNaru] Fetching popular books...")

            # 지난 3개월 기간 설정
            end_dt = datetime.now()
            start_dt = end_dt - timedelta(days=90)

            params = {
                'authKey': self.auth_key,
                'startDt': start_dt.strftime('%Y-%m-%d'),
                'endDt': end_dt.strftime('%Y-%m-%d'),
            }

            response = self.client.get(
                f"{self.base_url}/loanItemSrch",
                params=params,
                headers={'User-Agent': 'Daedokdan-BookCrawler/1.0'}
            )
            response.raise_for_status()

            books = self._parse_xml_response(response.text, 'popular')
            print(f"[LibraryInfoNaru] Found {len(books)} popular books")
            return books

        except Exception as e:
            print(f"[LibraryInfoNaru] Popular books fetch failed: {e}")
            return []

    def fetch_trending_books(self) -> List[Dict]:
        """대출 급상승 도서 조회 (최근 7일)"""
        try:
            print("[LibraryInfoNaru] Fetching trending books...")

            search_dt = datetime.now()

            params = {
                'authKey': self.auth_key,
                'searchDt': search_dt.strftime('%Y-%m-%d'),
            }

            response = self.client.get(
                f"{self.base_url}/hotTrend",
                params=params,
                headers={'User-Agent': 'Daedokdan-BookCrawler/1.0'}
            )
            response.raise_for_status()

            books = self._parse_xml_response(response.text, 'trending')
            print(f"[LibraryInfoNaru] Found {len(books)} trending books")
            return books

        except Exception as e:
            print(f"[LibraryInfoNaru] Trending books fetch failed: {e}")
            return []

    def _parse_xml_response(self, xml_text: str, book_type: str) -> List[Dict]:
        """XML 응답 파싱

        API 응답 형식:
        <result>
            <resultCode>0</resultCode>
            <resultMessage>OK</resultMessage>
            <data>
                <loanItem>
                    <rank>1</rank>
                    <title>도서명</title>
                    <author>저자명</author>
                    <publisher>출판사</publisher>
                    <pubYear>2023</pubYear>
                    <isbn>ISBN</isbn>
                    <loanCnt>1000</loanCnt>
                </loanItem>
                ...
            </data>
        </result>
        """
        books = []
        try:
            root = ET.fromstring(xml_text)

            # 결과 코드 확인
            result_code = root.findtext('resultCode')
            if result_code != '0':
                error_msg = root.findtext('resultMessage', 'Unknown error')
                print(f"[LibraryInfoNaru] API Error: {error_msg}")
                return []

            # 도서 정보 파싱
            data_elem = root.find('data')
            if data_elem is None:
                return []

            # loanItem 또는 item 요소 찾기
            items = data_elem.findall('loanItem') or data_elem.findall('item')

            for item in items[:20]:  # 최대 20개까지만
                try:
                    title = item.findtext('title', '').strip()
                    if not title:
                        continue

                    author = item.findtext('author', '').strip()
                    publisher = item.findtext('publisher', '').strip()
                    pub_year = item.findtext('pubYear', '').strip()
                    isbn = item.findtext('isbn', '').strip()

                    # rank와 대출 횟수
                    rank = item.findtext('rank', '0')
                    loan_cnt = item.findtext('loanCnt', '0')

                    book = {
                        'title': title,
                        'author': author,
                        'publisher': publisher,
                        'pub_year': pub_year,
                        'isbn': isbn,
                        'rank': int(rank) if rank.isdigit() else 0,
                        'loan_count': int(loan_cnt) if loan_cnt.isdigit() else 0,
                        'book_type': book_type,  # 'popular' or 'trending'
                    }
                    books.append(book)

                except Exception as e:
                    print(f"[LibraryInfoNaru] Item parse failed: {e}")
                    continue

        except ET.ParseError as e:
            print(f"[LibraryInfoNaru] XML parse failed: {e}")

        return books

    def save_recommend_books(self, books: List[Dict]) -> int:
        """추천 도서를 배너로 저장

        - 도서별로 배너 생성
        - 중복 체크: ISBN 기준
        - 기간: 한 달 (1일 ~ 말일)
        """
        if not books:
            return 0

        saved_count = 0
        current_date = datetime.now()

        # 한 달 기간 설정
        start_of_month = current_date.replace(day=1)
        if current_date.month == 12:
            end_of_month = start_of_month.replace(year=current_date.year + 1, month=1, day=1) - timedelta(days=1)
        else:
            end_of_month = start_of_month.replace(month=current_date.month + 1, day=1) - timedelta(days=1)

        start_at = start_of_month.strftime('%Y-%m-%d')
        end_at = end_of_month.strftime('%Y-%m-%d')

        for book in books:
            try:
                # ISBN 기준 중복 체크
                existing = (
                    self.sb.table("banners")
                    .select("id")
                    .eq("source", "library_naru")
                    .filter("title", "ilike", f"%{book['title']}%")
                    .limit(1)
                    .execute()
                    .data
                )

                if existing:
                    print(f"[LibraryInfoNaru] Already exists: {book['title']}")
                    continue

                # 배너 저장
                description = f"{book['author']} | {book['publisher']}"
                if book['pub_year']:
                    description += f" ({book['pub_year']})"

                # 도서 타입에 따른 제목 조정
                title_prefix = "인기대출" if book['book_type'] == 'popular' else "대출급상승"

                insert_data = {
                    'title': f"[{title_prefix}] {book['title']}",
                    'description': description,
                    'image_url': None,  # 알라딘 API로 따로 조회 가능 (옵션)
                    'landing_url': self._build_book_url(book),
                    'category': 'recommend_book',
                    'source': 'library_naru',
                    'start_at': start_at,
                    'end_at': end_at,
                    'location': None,
                    'is_active': False,
                    'is_approved': False,
                    'order_index': book['rank'] if book['rank'] else 0,
                }

                self.sb.table("banners").insert(insert_data).execute()
                saved_count += 1
                print(f"[LibraryInfoNaru] Saved: {book['title']}")

            except Exception as e:
                print(f"[LibraryInfoNaru] Save failed for {book.get('title', 'unknown')}: {e}")

        return saved_count

    def _build_book_url(self, book: Dict) -> str:
        """도서 상세 페이지 URL 구성

        ISBN으로 교보문고, 알라딘 등의 검색 URL 만들 수 있음
        """
        if book.get('isbn'):
            # ISBN으로 교보문고 검색
            return f"https://search.kyobobook.co.kr/web/search?vKeyword={book['isbn']}"
        else:
            # ISBN 없으면 제목으로 알라딘 검색
            title = book.get('title', '').replace(' ', '+')
            return f"https://www.aladin.co.kr/search/wsearch.aspx?SearchWord={title}"

    def log_crawl(self, book_type: str, item_count: int, status: str, error_msg: str = None):
        """크롤링 로그 저장"""
        try:
            self.sb.table("crawl_logs").insert({
                "source": "library_naru",
                "category": book_type,
                "item_count": item_count,
                "status": status,
                "error_message": error_msg,
            }).execute()
        except Exception as e:
            print(f"[LibraryInfoNaru] Log save failed: {e}")

    def run(self) -> Dict:
        """전체 실행"""
        try:
            print("\n" + "=" * 50)
            print("[LibraryInfoNaru] Starting crawl...")

            # 인기대출도서
            popular_books = self.fetch_popular_books()
            if popular_books:
                saved = self.save_recommend_books(popular_books)
                self.log_crawl("popular", len(popular_books), "success")
            else:
                self.log_crawl("popular", 0, "no_change", "No data found")

            # 대출 급상승
            trending_books = self.fetch_trending_books()
            if trending_books:
                saved = self.save_recommend_books(trending_books)
                self.log_crawl("trending", len(trending_books), "success")
            else:
                self.log_crawl("trending", 0, "no_change", "No data found")

            total_saved = len(popular_books) + len(trending_books)
            print(f"[LibraryInfoNaru] Crawl completed: {total_saved} books")
            print("=" * 50 + "\n")

            return {
                "success": True,
                "message": f"{total_saved} books saved",
                "popular": len(popular_books),
                "trending": len(trending_books),
            }

        except Exception as e:
            error_msg = str(e)
            self.log_crawl("all", 0, "fail", error_msg)
            print(f"[LibraryInfoNaru] Error: {error_msg}")
            return {"success": False, "message": error_msg}
