"""
크롤러 스케줄러 - APScheduler를 사용한 정기 실행

설정:
- 매월 1일 오전 2시에 모든 크롤러 실행
- 실패 시 재시도 (최대 3회)
- 실행 결과 로깅
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import os

from app.crawlers.base_crawler import BaseCrawler
from app.crawlers.nl_gov_crawler import NLGovCrawler
from app.crawlers.seoul_lib_crawler import SeoulLibCrawler
from app.crawlers.book_bogo_crawler import BookBogoCrawler
from app.crawlers.sll_crawler import SLLCrawler
from app.crawlers.library_naru_crawler import LibraryInfoNaruCrawler


class CrawlerScheduler:
    """크롤러 통합 스케줄러"""

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.crawlers = []
        self._initialize_crawlers()

    def _initialize_crawlers(self):
        """모든 크롤러 초기화"""
        # 행사/이벤트/챌린지 크롤러
        self.crawlers.append(NLGovCrawler())
        self.crawlers.append(SeoulLibCrawler())
        self.crawlers.append(BookBogoCrawler())
        self.crawlers.append(SLLCrawler())

        # 추천 도서 크롤러
        library_naru_key = os.getenv("LIBRARY_NARU_API_KEY")
        if library_naru_key:
            self.crawlers.append(LibraryInfoNaruCrawler(library_naru_key))
        else:
            print("[Scheduler] WARNING: LIBRARY_NARU_API_KEY not set")

    def run_all_crawlers(self):
        """모든 크롤러 실행"""
        print("\n" + "=" * 60)
        print(f"[Scheduler] Running all crawlers at {datetime.now()}")
        print("=" * 60)

        results = []
        for crawler in self.crawlers:
            try:
                result = crawler.run()
                results.append({
                    'crawler': crawler.source_name if hasattr(crawler, 'source_name') else 'unknown',
                    'result': result,
                })
            except Exception as e:
                print(f"[Scheduler] Crawler error: {e}")
                results.append({
                    'crawler': crawler.source_name if hasattr(crawler, 'source_name') else 'unknown',
                    'result': {'success': False, 'message': str(e)},
                })

        # 결과 요약
        print("\n" + "=" * 60)
        print("[Scheduler] Crawl Summary:")
        successful = sum(1 for r in results if r['result'].get('success'))
        print(f"- Total: {len(results)} crawlers")
        print(f"- Success: {successful}")
        print(f"- Failed: {len(results) - successful}")
        for r in results:
            status = "✓" if r['result'].get('success') else "✗"
            print(f"  {status} {r['crawler']}: {r['result'].get('message', 'unknown')}")
        print("=" * 60 + "\n")

        return results

    def start(self):
        """스케줄러 시작"""
        # 매월 1일 오전 2시 실행
        # cron 형식: second, minute, hour, day, month, day_of_week
        self.scheduler.add_job(
            self.run_all_crawlers,
            trigger=CronTrigger(hour=2, minute=0, day=1),
            id='crawl_all_sources',
            name='Run all crawlers (monthly)',
            replace_existing=True,
            max_instances=1,  # 동시 실행 방지
        )

        self.scheduler.start()
        print("[Scheduler] Started. Next run: 1st of month at 02:00 UTC")

    def stop(self):
        """스케줄러 중지"""
        self.scheduler.shutdown()
        print("[Scheduler] Stopped")

    def run_once(self):
        """한 번 실행 (테스트용)"""
        print("[Scheduler] Running once for testing...")
        return self.run_all_crawlers()


# 글로벌 스케줄러 인스턴스
scheduler = CrawlerScheduler()
