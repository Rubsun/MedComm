"""Scoring/interpretation для общих диагностических тестов.

Логика 1-в-1 со scoreTest() из index.html:
  yesno   — для каждой шкалы: +1 за каждый "yes" в s.yes и за каждый "no" в s.no.
  likert4 — sum(direct: A) + sum(reverse: 5 - A); A — 1..4.
  scale10 — среднее по 10-балльной шкале с инверсией для inverse-вопросов: (11 - A).
"""

from __future__ import annotations

from typing import Any


def _coerce_int(v: Any) -> int | None:
    try:
        return int(v)
    except (TypeError, ValueError):
        return None


def score_attempt(test, answers: dict[str, Any], questions_count: int) -> dict[str, Any]:
    """Считает результат попытки. answers: { '0': value, '1': value, ... }
    Возвращает {total, max, breakdown}.
    """
    qtype = test.question_type
    scales = test.scales or []

    # answers с 0-индексацией: ключи приведены к int для удобства
    a: dict[int, Any] = {}
    for k, v in (answers or {}).items():
        ki = _coerce_int(k)
        if ki is None:
            continue
        a[ki] = v

    if qtype == "yesno":
        total = 0
        breakdown: list[dict[str, Any]] = []
        for s in scales:
            pts = 0
            yes_idx = s.get("yes") or []
            no_idx = s.get("no") or []
            for i in yes_idx:
                if a.get(i - 1) == "yes":
                    pts += 1
            for i in no_idx:
                if a.get(i - 1) == "no":
                    pts += 1
            total += pts
            breakdown.append({
                "key": s.get("key", ""),
                "name": s.get("name", ""),
                "value": pts,
                "max": len(yes_idx) + len(no_idx),
            })
        return {"total": float(total), "max": float(questions_count), "breakdown": breakdown}

    if qtype == "likert4":
        direct: list[int] = []
        reverse: list[int] = []
        for s in scales:
            if s.get("direct"):
                direct = list(s["direct"])
            if s.get("reverse"):
                reverse = list(s["reverse"])
        total = 0
        for i in direct:
            v = _coerce_int(a.get(i - 1)) or 0
            total += v
        for i in reverse:
            v = _coerce_int(a.get(i - 1)) or 0
            total += (5 - v) if v else 0
        return {"total": float(total), "max": float(questions_count * 4), "breakdown": []}

    if qtype == "scale10":
        inv: list[int] = []
        if scales:
            inv = list(scales[0].get("inverse") or [])
        total = 0.0
        n = 0
        for i in range(questions_count):
            v = _coerce_int(a.get(i))
            if v is None:
                continue
            total += (11 - v) if (i + 1) in inv else v
            n += 1
        avg = total / n if n else 0.0
        return {"total": round(avg, 4), "max": 10.0, "breakdown": []}

    return {"total": 0.0, "max": 0.0, "breakdown": []}


def find_interpretation(test, total: float) -> dict[str, Any] | None:
    """Возвращает диапазон интерпретации, в который попадает total."""
    interpretations = test.interpretations or []
    for r in interpretations:
        rmin = float(r.get("min", 0))
        rmax = float(r.get("max", 0))
        if rmin <= total <= rmax:
            return {
                "level": r.get("level", ""),
                "short": r.get("short", ""),
                "text": r.get("text", ""),
                "min": rmin,
                "max": rmax,
            }
    if interpretations:
        first = interpretations[0]
        return {
            "level": first.get("level", ""),
            "short": first.get("short", ""),
            "text": first.get("text", ""),
            "min": float(first.get("min", 0)),
            "max": float(first.get("max", 0)),
        }
    return None
