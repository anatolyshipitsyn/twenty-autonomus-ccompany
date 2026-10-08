#!/usr/bin/env python3
"""Print the Twenty MCP authorization header from this project's ignored .env."""

import json
import shlex
import sys
from pathlib import Path


def main() -> int:
    env_file = Path(__file__).resolve().parent.parent / ".env"
    if not env_file.is_file():
        print("Project .env file not found", file=sys.stderr)
        return 1

    for line in env_file.read_text(encoding="utf-8").splitlines():
        entry = line.strip()
        if not entry or entry.startswith("#"):
            continue
        if entry.startswith("export "):
            entry = entry[len("export ") :].lstrip()
        name, separator, raw_value = entry.partition("=")
        if not separator or name.strip() != "TWENTY_API_KEY":
            continue

        try:
            parts = shlex.split(raw_value.strip(), comments=True, posix=True)
        except ValueError:
            print("TWENTY_API_KEY in .env has invalid quoting", file=sys.stderr)
            return 1
        if len(parts) != 1 or not parts[0]:
            print("TWENTY_API_KEY is empty or malformed in .env", file=sys.stderr)
            return 1

        print(json.dumps({"Authorization": f"Bearer {parts[0]}"}))
        return 0

    print("TWENTY_API_KEY not found in project .env", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
