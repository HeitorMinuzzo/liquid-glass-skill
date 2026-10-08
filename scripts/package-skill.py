"""Build the standalone skill ZIP and its SHA-256 checksum. Standard library only."""
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
SKILL = ROOT / "liquid-glass-apple"


def main() -> None:
    version = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
    if not re.fullmatch(r"\d+\.\d+\.\d+", version):
        raise ValueError("A release needs a numeric major.minor.patch version")
    if f'version: "{version}"' not in (SKILL / "SKILL.md").read_text(encoding="utf-8"):
        raise ValueError("Skill metadata and package.json versions differ")
    output = ROOT / "dist"
    output.mkdir(exist_ok=True)
    archive = output / f"liquid-glass-skill-v{version}.zip"
    files = sorted(path for path in SKILL.rglob("*") if path.is_file())
    forbidden = {".git", "node_modules", "__pycache__", ".artifacts", ".env"}
    if any(path.is_symlink() or forbidden.intersection(path.relative_to(SKILL).parts) for path in files):
        raise ValueError("Unexpected private or generated content in skill package")
    with ZipFile(archive, "w", compression=ZIP_DEFLATED, compresslevel=9) as package:
        for path in files:
            entry = ZipInfo(path.relative_to(ROOT).as_posix(), date_time=(2026, 10, 8, 0, 0, 0))
            entry.compress_type = ZIP_DEFLATED
            entry.external_attr = 0o100644 << 16
            package.writestr(entry, path.read_bytes())
    # Check every byte and path, not only whether the archive can be opened.
    with ZipFile(archive) as package:
        if package.testzip() is not None:
            raise ValueError("Corrupt ZIP entry")
        expected = {path.relative_to(ROOT).as_posix(): path.read_bytes() for path in files}
        if set(package.namelist()) != set(expected):
            raise ValueError("Archive file inventory differs from the skill")
        for name, data in expected.items():
            if package.read(name) != data:
                raise ValueError(f"Archive contents differ: {name}")
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    checksum = output / "SHA256SUMS.txt"
    checksum.write_text(f"{digest}  {archive.name}\n", encoding="utf-8")
    print(json.dumps({"version": version, "files": len(files), "zip": str(archive),
                      "bytes": archive.stat().st_size, "sha256": digest}, indent=2))


if __name__ == "__main__":
    main()
