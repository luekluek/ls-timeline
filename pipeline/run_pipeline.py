#!/usr/bin/env python3
"""Pipeline entrypoint — recomputes all JSON outputs from LSD.law CSV export."""

import argparse
import sys


def main() -> int:
    parser = argparse.ArgumentParser(
        description="ls_timeline data pipeline"
    )
    parser.add_argument("--input", required=True, help="Path to LSD.law CSV export")
    args = parser.parse_args()

    print(f"Pipeline stub — input: {args.input}", file=sys.stderr)
    print("ERROR: Pipeline not yet implemented. See Epic 1 Story 1.3.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
