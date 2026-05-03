from pydantic import BaseModel


# --- Program ---
class ProgramCreate(BaseModel):
    title: str
    slug: str | None = None
    description: str = ""
    image_url: str | None = None


class ProgramUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    image_url: str | None = None


class ProgramOut(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    image_url: str | None
    is_published: bool
    sort_order: int

    model_config = {"from_attributes": True}


class ReorderItem(BaseModel):
    id: int
    sort_order: int


# --- Course ---
class CourseCreate(BaseModel):
    program_id: int
    title: str
    slug: str | None = None
    description: str = ""


class CourseUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None


class CourseOut(BaseModel):
    id: int
    slug: str
    program_id: int
    title: str
    description: str
    sort_order: int
    is_published: bool

    model_config = {"from_attributes": True}


# --- Module ---
class ModuleCreate(BaseModel):
    course_id: int
    title: str
    slug: str | None = None
    description: str = ""


class ModuleUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None


class ModuleOut(BaseModel):
    id: int
    slug: str
    course_id: int
    title: str
    description: str
    sort_order: int
    is_locked: bool
    is_published: bool

    model_config = {"from_attributes": True}


# --- Lesson ---
class LessonCreate(BaseModel):
    module_id: int
    title: str
    slug: str | None = None
    description: str = ""
    type: str = "theory"
    duration_min: int = 0


class LessonUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    description: str | None = None
    type: str | None = None
    duration_min: int | None = None


class LessonOut(BaseModel):
    id: int
    slug: str
    module_id: int
    title: str
    description: str
    type: str
    duration_min: int
    sort_order: int
    is_published: bool

    model_config = {"from_attributes": True}


# --- Block ---
class BlockCreate(BaseModel):
    type: str
    sort_order: int = 0
    data: dict = {}


class BlockUpdate(BaseModel):
    sort_order: int | None = None
    data: dict | None = None


class BlockOut(BaseModel):
    id: int
    lesson_id: int
    type: str
    sort_order: int
    data: dict

    model_config = {"from_attributes": True}
