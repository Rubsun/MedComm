import re
import secrets


_NON_SLUG = re.compile(r"[^a-z0-9]+")


def auto_slug(prefix: str) -> str:
    """Сгенерировать случайный читабельный slug, например `program-a3f912`."""
    return f"{prefix}-{secrets.token_hex(4)}"


def slugify(text: str, prefix: str | None = None, max_len: int = 80) -> str:
    """Превратить произвольный заголовок в slug. Только латиница/цифры/дефис.

    Кириллица и другие нелатинские символы вычищаются — для русских
    заголовков лучше всё же передавать slug явно.
    """
    base = _NON_SLUG.sub("-", text.lower()).strip("-")
    if not base:
        return auto_slug(prefix or "item")
    base = base[:max_len].rstrip("-")
    if prefix:
        return f"{prefix}-{base}"[: max_len + len(prefix) + 1]
    return base
