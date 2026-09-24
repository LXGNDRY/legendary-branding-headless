#!/usr/bin/env python3
"""Create and verify headless UI locale catalogs.

Shopify is the source of truth for catalog content.  This script deliberately
handles only the React storefront's static interface strings.  It accepts an
approved translation map (including a Hextom export converted to this flat
JSON shape), preserves placeholders, and rejects incomplete catalogs.

Run ``npm run locales:check`` in CI before a language is made customer-facing.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LOCALES = ROOT / "app" / "locales"
SOURCE = LOCALES / "en.json"
SUPPORTED = ("de", "es", "fr", "hi", "id", "it", "pt-BR")
PLACEHOLDER = re.compile(r"\{([\w.-]+)\}")


def read_json(path: Path) -> dict[str, str]:
    with path.open(encoding="utf-8") as file:
        content = json.load(file)
    if not isinstance(content, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in content.items()):
        raise ValueError(f"{path}: expected a flat object of string keys and values")
    return content


def validate(catalog: dict[str, str], source: dict[str, str], label: str) -> list[str]:
    errors: list[str] = []
    missing = sorted(set(source) - set(catalog))
    extra = sorted(set(catalog) - set(source))
    if missing:
        errors.append(f"{label}: missing keys: {', '.join(missing)}")
    if extra:
        errors.append(f"{label}: extra keys: {', '.join(extra)}")
    for key in sorted(set(source) & set(catalog)):
        if not catalog[key].strip():
            errors.append(f"{label}: {key} is blank")
        if set(PLACEHOLDER.findall(source[key])) != set(PLACEHOLDER.findall(catalog[key])):
            errors.append(f"{label}: {key} does not preserve placeholders")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate and validate Legendary Branding UI locale files")
    parser.add_argument("--check", action="store_true", help="verify every supported catalog")
    parser.add_argument("--language", choices=SUPPORTED, help="locale to create or update from --translations")
    parser.add_argument("--translations", type=Path, help="approved flat JSON translation map")
    args = parser.parse_args()
    source = read_json(SOURCE)

    if args.language:
        if not args.translations:
            parser.error("--language requires --translations; automatic machine translation is intentionally not used")
        incoming = read_json(args.translations)
        target = LOCALES / f"{args.language}.json"
        existing = read_json(target) if target.exists() else {}
        merged = {key: incoming.get(key, existing.get(key, "")) for key in source}
        errors = validate(merged, source, args.language)
        if errors:
            print("\n".join(errors), file=sys.stderr)
            return 1
        target.write_text(json.dumps(merged, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"Wrote {target.relative_to(ROOT)}")

    if args.check or not args.language:
        errors = []
        for language in SUPPORTED:
            target = LOCALES / f"{language}.json"
            if not target.exists():
                errors.append(f"{language}: catalog is missing")
                continue
            errors.extend(validate(read_json(target), source, language))
        if errors:
            print("\n".join(errors), file=sys.stderr)
            return 1
        print(f"Locale coverage valid: English + {len(SUPPORTED)} Shopify-published locales")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
