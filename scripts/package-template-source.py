"""Package or verify the tracked template source ZIP, including screenshots and dotfiles."""
import argparse
from pathlib import Path
import subprocess
import zipfile

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--check", action="store_true", help="Verify the existing ZIP without modifying it.")
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
output = root / "htmlapps-template.zip"
excluded = {"htmlapps-template.zip", ".github/workflows/refresh-template-assets-once.yml"}
tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode("utf-8").split("\0")
names = sorted(name for name in tracked if name and name not in excluded)
for name in names:
    source = root / name
    if not source.is_file() or source.is_symlink():
        raise RuntimeError(f"Expected tracked regular file: {name}")
if not args.check:
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for name in names:
            info = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, (root / name).read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
with zipfile.ZipFile(output) as archive:
    bad = archive.testzip()
    if bad is not None:
        raise RuntimeError(f"ZIP CRC failed: {bad}")
    if sorted(archive.namelist()) != names:
        raise RuntimeError("ZIP file list differs from tracked source; regenerate it.")
    for name in names:
        if archive.read(name) != (root / name).read_bytes():
            raise RuntimeError(f"ZIP is stale: {name}")
print(f"Verified {len(names)} tracked source files: {output.name}")
