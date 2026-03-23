from datetime import datetime

from pydantic import BaseModel


class EnrollRequest(BaseModel):
    course_id: int


class CompleteLessonRequest(BaseModel):
    lesson_id: int


class SubmitPracticeRequest(BaseModel):
    lesson_block_id: int
    selected_option_ids: list[str]


class SubmitQuizRequest(BaseModel):
    lesson_block_id: int
    score: int
    max_score: int


class PracticeResultOut(BaseModel):
    id: int
    lesson_block_id: int
    selected_option_ids: list[str]
    is_correct: bool
    completed_at: datetime

    model_config = {"from_attributes": True}


class QuizResultOut(BaseModel):
    id: int
    lesson_block_id: int
    score: int
    best_score: int
    max_score: int
    passed: bool
    attempts: int
    completed_at: datetime

    model_config = {"from_attributes": True}
