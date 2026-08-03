from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import List, Dict, Optional
import httpx
import time
from bs4 import BeautifulSoup

from app.db.supabase_client import get_supabase_admin_client


def now_iso():
    return datetime.now(timezone.utc).isoformat()


class BaseCrawler(ABC):
    """크롤러 베이스 클래스"""

    def __init__(self, source_name: str, category: str):
        self.source_name = source_name
        self.category = category
        self.client = httpx.Client(timeout=10.0)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        self.sb = get_supabase_admin_client()

    def fetch_html(self, url: str) -> Optional[str]:
        """HTML 페이지 가져오기"""
        try:
            print(f"[{self.source_name}] Fetching {url}")
            response = self.client.get(url, headers=self.headers)
            response.raise_for_status()
            return response.text
        except Exception as e:
            print(f"[{self.source_name}] Fetch failed: {e}")
            return None

    @abstractmethod
    def parse(self, html: str) -> List[Dict]:
        """HTML 파싱해서 배너 데이터 추출

        반환 형식:
        [
            {
                'title': '행사명',
                'description': '설명',
                'image_url': 'URL',
                'landing_url': '상세페이지URL',
                'start_at': '2023-06-01',
                'end_at': '2023-06-30',
                'location': '장소',
            },
            ...
        ]
        """
        pass

    def save_banners(self, banners_data: List[Dict]) -> int:
        """DB에 배너 저장

        - 중복 체크: landing_url 기준 (같은 행사는 중복 저장 안 함)
        - 기존 배너는 is_active=false로 변경
        - 새 배너는 is_active=false, is_approved=false로 저장 (관리자 승인 필수)
        """
        if not banners_data:
            return 0

        saved_count = 0

        for banner in banners_data:
            try:
                # 1) 중복 체크 (같은 landing_url이 이미 있는지)
                existing = (
                    self.sb.table("banners")
                    .select("id")
                    .eq("landing_url", banner["landing_url"])
                    .eq("source", self.source_name)
                    .limit(1)
                    .execute()
                    .data
                )

                if existing:
                    print(f"[{self.source_name}] Already exists: {banner['title']}")
                    continue

                # 2) 새 배너 저장
                insert_data = {
                    "title": banner["title"],
                    "description": banner.get("description", ""),
                    "image_url": banner.get("image_url"),
                    "landing_url": banner["landing_url"],
                    "category": self.category,
                    "source": self.source_name,
                    "start_at": banner.get("start_at"),
                    "end_at": banner.get("end_at"),
                    "location": banner.get("location"),
                    "is_active": False,
                    "is_approved": False,
                    "order_index": 0,
                }

                self.sb.table("banners").insert(insert_data).execute()
                saved_count += 1
                print(f"[{self.source_name}] Saved: {banner['title']}")

            except Exception as e:
                print(f"[{self.source_name}] Save failed for {banner.get('title', 'unknown')}: {e}")

        return saved_count

    def log_crawl(self, item_count: int, status: str, error_msg: str = None):
        """크롤링 로그 저장"""
        try:
            self.sb.table("crawl_logs").insert({
                "source": self.source_name,
                "category": self.category,
                "item_count": item_count,
                "status": status,
                "error_message": error_msg,
            }).execute()
        except Exception as e:
            print(f"[{self.source_name}] Log save failed: {e}")

    def run(self) -> Dict:
        """크롤링 실행 (오버라이드 불필요)"""
        try:
            print(f"\n{'=' * 50}")
            print(f"[{self.source_name}] Starting crawl...")

            html = self.fetch_html(self.get_url())
            if not html:
                self.log_crawl(0, "fail", "Failed to fetch HTML")
                return {"success": False, "message": "Failed to fetch HTML"}

            banners = self.parse(html)
            if not banners:
                self.log_crawl(0, "no_change", "No data found")
                return {"success": True, "message": "No new data", "count": 0}

            saved_count = self.save_banners(banners)
            self.log_crawl(len(banners), "success")

            print(f"[{self.source_name}] Crawl completed: {saved_count}/{len(banners)} saved")
            print(f"{'=' * 50}\n")

            return {
                "success": True,
                "message": f"{saved_count} banners saved",
                "count": saved_count,
            }

        except Exception as e:
            error_msg = str(e)
            self.log_crawl(0, "fail", error_msg)
            print(f"[{self.source_name}] Error: {error_msg}")
            return {"success": False, "message": error_msg}

    @abstractmethod
    def get_url(self) -> str:
        """크롤링할 URL 반환"""
        pass
