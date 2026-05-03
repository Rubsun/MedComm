#!/usr/bin/env python
"""Идемпотентный импортёр контента из JSON-файлов.

Формат файла (один документ — одно дерево program → course → module → lessons):

{
  "program": { "slug": "comm-doctor-patient", "title": "...", "description": "...",
                "is_published": true, "sort_order": 0 },
  "course":  { "slug": "course-1-basic-consultation", "title": "...",
                "description": "...", "is_published": true, "sort_order": 0 },
  "module":  { "slug": "module-1-why-communication", "title": "...",
                "description": "...", "is_locked": false, "sort_order": 0,
                "estimated_minutes": 75 },
  "lessons": [
    { "slug": "1-1-evidence", "title": "...", "type": "theory|practice|mixed",
      "estimated_minutes": 12, "sort_order": 0, "is_published": true,
      "description": "...",
      "blocks": [
        { "sort_order": 0, "type": "text|image|video|practice|quiz", "data": {...} }
      ],
      "sources": [...]      // игнорируется на текущем этапе
    }
  ],
  "module_sources": [...]    // игнорируется на текущем этапе
}

Запуск:

    # импорт одного файла
    python -m backend.import_content content/course-1/module-1.json

    # импорт всей папки (рекурсивно по *.json)
    python -m backend.import_content content/

    # dry-run — показать что было бы сделано, ничего не записывать
    python -m backend.import_content content/ --dry-run

Стратегия:
    - program/course/module/lesson — upsert по `slug`
    - lesson_blocks — match по (lesson_id, sort_order):
        существующие обновляются, новые добавляются, лишние удаляются
"""

from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import AsyncSessionLocal
from backend.models import Course, Lesson, LessonBlock, Module, Program

VALID_BLOCK_TYPES = {"text", "image", "video", "practice", "quiz"}
VALID_LESSON_TYPES = {"theory", "practice", "mixed"}


# --- утилиты ---

def _required(payload: dict, key: str, ctx: str) -> Any:
    if key not in payload:
        raise ValueError(f"{ctx}: обязательное поле '{key}' отсутствует")
    return payload[key]


async def _upsert(
    session: AsyncSession,
    model,
    slug: str,
    fields: dict,
    *,
    label: str,
) -> tuple[Any, str]:
    """Upsert по slug. Возвращает (объект, status) где status ∈ {created, updated, unchanged}."""
    res = await session.execute(select(model).where(model.slug == slug))
    obj = res.scalar_one_or_none()
    if obj is None:
        obj = model(slug=slug, **fields)
        session.add(obj)
        await session.flush()
        print(f"  + создан {label}: {slug} — {fields.get('title', '')}")
        return obj, "created"

    changed = False
    for k, v in fields.items():
        if getattr(obj, k) != v:
            setattr(obj, k, v)
            changed = True
    if changed:
        await session.flush()
        print(f"  ~ обновлён {label}: {slug}")
        return obj, "updated"
    return obj, "unchanged"


async def _sync_blocks(
    session: AsyncSession, lesson_id: int, blocks_payload: list[dict]
) -> dict[str, int]:
    """Синхронизировать блоки урока.

    Match по (lesson_id, sort_order). Существующие — обновляются, новые — создаются,
    лишние — удаляются. Это сохраняет id блоков и не ломает QuizResult/PracticeResult,
    если sort_order сохраняются.
    """
    # текущие блоки урока, проиндексированные по sort_order
    res = await session.execute(
        select(LessonBlock).where(LessonBlock.lesson_id == lesson_id)
    )
    existing = {b.sort_order: b for b in res.scalars().all()}
    incoming_orders = set()

    stats = {"created": 0, "updated": 0, "unchanged": 0, "deleted": 0}

    for raw in blocks_payload:
        sort_order = int(_required(raw, "sort_order", f"block in lesson {lesson_id}"))
        btype = _required(raw, "type", f"block sort_order={sort_order}")
        if btype not in VALID_BLOCK_TYPES:
            raise ValueError(f"block sort_order={sort_order}: type='{btype}' недопустим")
        data = raw.get("data", {})
        incoming_orders.add(sort_order)

        existing_block = existing.get(sort_order)
        if existing_block is None:
            session.add(LessonBlock(
                lesson_id=lesson_id,
                sort_order=sort_order,
                type=btype,
                data=data,
            ))
            stats["created"] += 1
        else:
            if existing_block.type != btype or existing_block.data != data:
                existing_block.type = btype
                existing_block.data = data
                stats["updated"] += 1
            else:
                stats["unchanged"] += 1

    # удалить блоки, которых нет в новой версии
    for sort_order, block in existing.items():
        if sort_order not in incoming_orders:
            await session.delete(block)
            stats["deleted"] += 1

    await session.flush()
    return stats


# --- основная логика ---

async def import_file(session: AsyncSession, path: Path) -> dict:
    print(f"\n→ {path}")
    with path.open("r", encoding="utf-8") as f:
        doc = json.load(f)

    program_payload = _required(doc, "program", str(path))
    course_payload = _required(doc, "course", str(path))
    module_payload = _required(doc, "module", str(path))
    # lessons и module_sources могут лежать как на верхнем уровне, так и внутри module
    lessons_payload = doc.get("lessons") or module_payload.get("lessons")
    if lessons_payload is None:
        raise ValueError(f"{path}: обязательное поле 'lessons' отсутствует (искал в корне и в module)")
    module_sources = doc.get("module_sources") or module_payload.get("module_sources")

    # --- Program ---
    prog_slug = _required(program_payload, "slug", "program")
    program, _ = await _upsert(
        session, Program, prog_slug,
        {
            "title": _required(program_payload, "title", "program"),
            "description": program_payload.get("description", ""),
            "image_url": program_payload.get("image_url"),
            "is_published": program_payload.get("is_published", False),
            "sort_order": program_payload.get("sort_order", 0),
        },
        label="program",
    )

    # --- Course ---
    course_slug = _required(course_payload, "slug", "course")
    course, _ = await _upsert(
        session, Course, course_slug,
        {
            "program_id": program.id,
            "title": _required(course_payload, "title", "course"),
            "description": course_payload.get("description", ""),
            "is_published": course_payload.get("is_published", False),
            "sort_order": course_payload.get("sort_order", 0),
        },
        label="course",
    )

    # --- Module ---
    mod_slug = _required(module_payload, "slug", "module")
    if "estimated_minutes" in module_payload:
        # на модуле такого поля в БД нет — игнорируем молча
        pass
    module, _ = await _upsert(
        session, Module, mod_slug,
        {
            "course_id": course.id,
            "title": _required(module_payload, "title", "module"),
            "description": module_payload.get("description", ""),
            "is_locked": module_payload.get("is_locked", False),
            "is_published": module_payload.get("is_published", True),
            "sort_order": module_payload.get("sort_order", 0),
        },
        label="module",
    )

    # --- Lessons + Blocks ---
    aggregate_block_stats = {"created": 0, "updated": 0, "unchanged": 0, "deleted": 0}

    for lesson_payload in lessons_payload:
        lesson_slug = _required(lesson_payload, "slug", "lesson")
        ltype = lesson_payload.get("type", "theory")
        if ltype not in VALID_LESSON_TYPES:
            raise ValueError(f"lesson '{lesson_slug}': type='{ltype}' недопустим")

        # `estimated_minutes` в JSON → `duration_min` в БД
        duration = lesson_payload.get(
            "duration_min",
            lesson_payload.get("estimated_minutes", 0),
        )

        lesson, _ = await _upsert(
            session, Lesson, lesson_slug,
            {
                "module_id": module.id,
                "title": _required(lesson_payload, "title", f"lesson {lesson_slug}"),
                "description": lesson_payload.get("description", ""),
                "type": ltype,
                "duration_min": int(duration),
                "is_published": lesson_payload.get("is_published", True),
                "sort_order": lesson_payload.get("sort_order", 0),
            },
            label="lesson",
        )

        if "blocks" in lesson_payload:
            block_stats = await _sync_blocks(session, lesson.id, lesson_payload["blocks"])
            for k, v in block_stats.items():
                aggregate_block_stats[k] += v
            print(
                f"    blocks: +{block_stats['created']} ~{block_stats['updated']} "
                f"={block_stats['unchanged']} -{block_stats['deleted']}"
            )

        if lesson_payload.get("sources"):
            print(f"    (sources: {len(lesson_payload['sources'])} — пока не сохраняются)")

    if module_sources:
        print(f"  (module_sources: {len(module_sources)} — пока не сохраняются)")

    return {
        "lessons": len(lessons_payload),
        "blocks": aggregate_block_stats,
    }


def collect_files(target: Path) -> list[Path]:
    if target.is_file():
        if target.suffix != ".json":
            raise SystemExit(f"Файл должен быть .json: {target}")
        return [target]
    if target.is_dir():
        return sorted(target.rglob("*.json"))
    raise SystemExit(f"Путь не найден: {target}")


async def main_async(target: Path, dry_run: bool) -> None:
    files = collect_files(target)
    if not files:
        print(f"Нет .json файлов в {target}")
        return

    print(f"Импорт: {len(files)} файл(ов) из {target}")
    if dry_run:
        print("(DRY-RUN — изменения не будут зафиксированы)")

    total = {"lessons": 0, "blocks": {"created": 0, "updated": 0, "unchanged": 0, "deleted": 0}}

    async with AsyncSessionLocal() as session:
        try:
            for path in files:
                result = await import_file(session, path)
                total["lessons"] += result["lessons"]
                for k, v in result["blocks"].items():
                    total["blocks"][k] += v

            if dry_run:
                await session.rollback()
                print("\nDRY-RUN завершён, изменения откатаны.")
            else:
                await session.commit()
                print("\nИмпорт завершён, изменения сохранены.")
        except Exception:
            await session.rollback()
            raise

    print(
        f"Итого: уроков {total['lessons']}, "
        f"блоков +{total['blocks']['created']} "
        f"~{total['blocks']['updated']} "
        f"={total['blocks']['unchanged']} "
        f"-{total['blocks']['deleted']}"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Импорт контента из JSON")
    parser.add_argument("target", type=Path, help="Путь к .json файлу или папке с .json")
    parser.add_argument("--dry-run", action="store_true", help="Не коммитить изменения")
    args = parser.parse_args()
    asyncio.run(main_async(args.target, args.dry_run))


if __name__ == "__main__":
    sys.exit(main())
