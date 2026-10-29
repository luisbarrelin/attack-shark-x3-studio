"""Build the Studio executable from the MIT source without running the app."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parent

def main():
    args = [sys.executable, "-m", "PyInstaller", "--noconfirm", "--onefile", "--windowed",
            "--name", "AttackSharkX3Studio", "--icon", str(ROOT / "attackshark/web/logo.ico"),
            "--add-data", f"{ROOT / 'tools/fix_usb_lag.ps1'};tools",
            "--add-data", f"{ROOT / 'LICENSE'};.",
            "--add-data", f"{ROOT / 'NOTICE.md'};.",
            "--exclude-module", "tkinter", "--exclude-module", "PIL",
            "--exclude-module", "numpy", "--exclude-module", "frida",
            str(ROOT / "launch_studio.py")]
    for asset in sorted((ROOT / 'attackshark/web').iterdir()):
        if asset.is_file() and '.custom.' not in asset.name:
            args[-1:-1] = ["--add-data", f"{asset};attackshark/web"]
    subprocess.run(args, cwd=ROOT, check=True)

if __name__ == "__main__":
    main()
