#!/usr/bin/env python3
"""Pipeline entry point: CSV in → src/data/ out.

Usage:
    python run_pipeline.py                      # uses pipeline/data/lsdata.csv
    python run_pipeline.py path/to/lsdata.csv  # custom CSV path
"""
import sys
from pathlib import Path

PIPELINE_DIR = Path(__file__).parent
sys.path.insert(0, str(PIPELINE_DIR))  # enables `from src.xxx import yyy`

from src.normalize import normalize
from src.outliers import filter_outliers
from src.cohorts import group_by_cohort
from src.kaplan_meier import compute_km
from src.output import write_output

import pandas as pd

DEFAULT_CSV = PIPELINE_DIR / "data" / "lsdata.csv"
OUTPUT_DIR = PIPELINE_DIR.parent / "src" / "data"

REQUIRED_COLS = {"sent_at", "decision_at", "matriculating_year", "school_name", "gpa", "lsat"}


def main(csv_path: Path) -> None:
    """Run the full pipeline: normalize → filter_outliers → group_by_cohort → compute_km → output.

    Args:
        csv_path: Path to the lsdata CSV file (must exist).

    Exits non-zero with a descriptive stderr message on failure (NFR9).
    """
    if not csv_path.exists():
        print(f"Error: CSV file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)

    try:
        df = pd.read_csv(csv_path, skiprows=1)
    except Exception as exc:
        print(f"Error: Failed to read CSV file '{csv_path}': {exc}", file=sys.stderr)
        sys.exit(1)

    missing_cols = REQUIRED_COLS - set(df.columns)
    if missing_cols:
        print(
            f"Error: CSV is missing required columns: {sorted(missing_cols)}",
            file=sys.stderr,
        )
        sys.exit(1)

    if df.empty:
        print("Error: CSV contains no data rows.", file=sys.stderr)
        sys.exit(1)

    try:
        df = normalize(df)
        df = filter_outliers(df)
        df = group_by_cohort(df)
        km_data = compute_km(df)
        write_output(df, km_data, OUTPUT_DIR)
    except Exception as exc:
        print(f"Error: Pipeline failed: {exc}", file=sys.stderr)
        sys.exit(1)

    print(f"Pipeline complete. Output written to: {OUTPUT_DIR}")


if __name__ == "__main__":
    csv_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_CSV
    main(csv_path)
