from pydantic import BaseModel
from typing import Optional, List

class UserProfileOut(BaseModel):
    userId: str
    email: Optional[str] = None

    isOnboarded: bool
    onboardedAt: Optional[str] = None

    userType: Optional[str] = None
    onboardingStep: Optional[str] = None

    nickname: Optional[str] = None
    preferredGenres: Optional[List[str]] = None
    readingSpeed: Optional[str] = None
    weeklyReadCount: Optional[int] = None

    initialPPM: Optional[float] = None
    currentPPM: Optional[float] = None
    initialPPMSetAt: Optional[str] = None


    avatarId: Optional[str] = None      # 선택된 아바타 ID (예: "avatar_01")
    avatarUrl: Optional[str] = None     # 아바타 이미지 URL (프론트에서 매핑)


class UserProfileUpdateIn(BaseModel):
    nickname: Optional[str] = None      # 변경할 닉네임 (사용자 아이디)
    avatarId: Optional[str] = None      # 변경할 아바타 ID


class UserProfileUpdateOut(BaseModel):
    ok: bool
    nickname: Optional[str] = None
    avatarId: Optional[str] = None