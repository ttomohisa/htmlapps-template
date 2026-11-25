"""Create a source-only template ZIP from tracked files, including dotfiles and fresh screenshots."""
from pathlib import Path
import subprocess
import zipfile

root = Path(__file__).resolve().parent.parent
output = root / "htmlapps-template.zip"
excluded = {"htmlapps-template.zip", ".github/workflows/refresh-template-assets-once.yml"}
tracked = subprocess.check_output(["git", "ls-files", "-z"], cwd=root).decode("utf-8").split("\0")
names = sorted(name for name in tracked if name and name not in excluded)
with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in names:
        source = root / name
        if not source.is_file() or source.is_symlink():
            raise RuntimeError(f"Expected tracked regular file: {name}")
        info = zipfile.ZipInfo(name, date_time=(2020, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        archive.writestr(info, source.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert sorted(archive.namelist()) == names
    for name in names:
        assert archive.read(name) == (root / name).read_bytes(), name
print(f"Packaged {len(names)} tracked source files: {output.name}")
