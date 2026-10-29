"""Windows packaged entry point. No hardware actions are performed at build time."""
import multiprocessing
import sys
from attackshark.tray import main

if __name__ == "__main__":
    multiprocessing.freeze_support()
    raise SystemExit(main(open_browser="--minimized" not in sys.argv))
