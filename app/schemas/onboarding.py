from pydantic import BaseModel, Field
from typing import List, Literal, Optional

UserType = Literal["worker_student", "other"]
ReadingSpeedLevel = Literal["very_slow", "slow", "normal", "fast", "very_fast"]

# 1) 사용자 유형 선택
class OnboardingUserTypeIn(BaseModel):
    userType: UserType

# 2) 독서 프로필 입력
class OnboardingReadingProfileIn(BaseModel):
    nickname: str = Field(min_length=1, max_length=30)
    preferredGenres: List[str] = Field(default_factory=list)
    readingSpeed: ReadingSpeedLevel
    weeklyReadCount: int = Field(ge=1, le=7)  # 1~7회

# 3) 통근 프로필 입력 (직장인/대학생만)
class CommuteProfileIn(BaseModel):
    name: str = "기본"  # 예: '출근/등교'
    originName: str
    destinationName: str

    commuteHour: int = Field(ge=0, le=9)
    commuteMinute: int = Field(ge=0, le=59)

    commuteDays: List[Literal["MON","TUE","WED","THU","FRI","SAT","SUN"]] = Field(default_factory=list)

    departHour: int = Field(ge=0, le=23)
    departMinute: int = Field(ge=0, le=59)
    returnHour: int = Field(ge=0, le=23)
    returnMinute: int = Field(ge=0, le=59)

# 4) 속도 테스트 시작 응답 (고정 지문+문제)
class ReadingTestStartOut(BaseModel):
    testId: str
    textId: str
    body: str
    syllableCount: int
    question: str
    choices: List[str]

# 5) 속도 테스트 완료
class ReadingTestFinishIn(BaseModel):
    testId: str
    elapsedSeconds: int = Field(gt=0, le=600)  # 온보딩이라 10분 제한 정도
    userChoice: int = Field(ge=1, le=4)

class ReadingTestFinishOut(BaseModel):
    elapsedSeconds: int
    ppm: float
    isCorrect: bool
    isOnboarded: bool

# 6) 건너뛰기
class SkipSpeedTestOut(BaseModel):
    isOnboarded: bool
