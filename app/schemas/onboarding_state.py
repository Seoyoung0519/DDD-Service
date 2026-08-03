from pydantic import BaseModel
from typing import Optional, Literal, List

UserType = Literal["worker_student", "other"]
OnboardingStep = Literal[
    "start",
    "type_selected",
    "reading_profile_done",
    "commute_profile_done",
    "speed_test_done",
    "done",
]

class OnboardingStateOut(BaseModel):
    userId: str
    userType: Optional[UserType] = None
    step: OnboardingStep
    isOnboarded: bool

    # 서버가 “다음으로 가야 할 화면”을 직접 알려줌
    nextAction: Literal[
        "select_user_type",
        "fill_reading_profile",
        "fill_commute_profile",
        "do_speed_test",
        "enter_home",
    ]

    # 화면 로직에 도움되는 보조정보
    required: List[str]  # ["user_type", "reading_profile", ...]
