"""JSON output serialization for LS Timeline pipeline.

Serializes KM and cohort data to schema-valid JSON in src/data/:
  - src/data/schools/{school_id}.json  per-school data
  - src/data/schools-index.json        list of all school IDs + names
  - src/data/meta.json                 freshness timestamp
"""

import json
import re
from datetime import date, datetime, timezone
from pathlib import Path

import pandas as pd

MIN_OBSERVATIONS = 5  # same threshold as kaplan_meier.py


def _school_name_to_id(name: str) -> str:
    """Convert school display name to URL-safe slug."""
    slug = name.lower()
    slug = re.sub(r"[^\w\s-]", "", slug)   # remove special chars except hyphen
    slug = re.sub(r"[\s_]+", "-", slug)    # spaces/underscores → hyphen
    slug = re.sub(r"-+", "-", slug).strip("-")  # collapse/trim hyphens
    return slug


def _compute_cohort_histograms(school_df: pd.DataFrame) -> dict:
    """Compute decision-timing histogram per application month.

    Returns a SparseField wrapping a list of CohortHistogramData.
    Sparse when school has fewer than MIN_OBSERVATIONS total records.
    """
    if len(school_df) < MIN_OBSERVATIONS:
        return {"sparse": True, "reason": "insufficient_observations", "data": None}

    histograms = []
    for month, month_df in school_df.groupby("applied_month"):
        total = len(month_df)
        decided = month_df.dropna(subset=["decision_cycle_week"])
        bins_raw = (
            decided.groupby("decision_cycle_week")
            .size()
            .reset_index(name="count")
        )
        bins = [
            {"cycle_week": int(row["decision_cycle_week"]), "count": int(row["count"])}
            for _, row in bins_raw.iterrows()
        ]
        bins.sort(key=lambda b: b["cycle_week"])
        histograms.append({"applied_month": int(month), "bins": bins, "total": total})

    histograms.sort(key=lambda h: h["applied_month"])
    return {"sparse": False, "reason": None, "data": histograms}


def _compute_median_decision_week(school_df: pd.DataFrame, last_cycle_year: int | None) -> dict:
    """Compute the median decision_cycle_week for the last complete cycle.

    Returns a SparseField wrapping an int (the median week).
    Sparse when last_cycle_year is None or fewer than MIN_OBSERVATIONS decisions.
    """
    if last_cycle_year is None:
        return {"sparse": True, "reason": "insufficient_observations", "data": None}

    last_df = school_df[school_df["matriculating_year"] == last_cycle_year]
    dcw = last_df["decision_cycle_week"].dropna()

    if len(dcw) < MIN_OBSERVATIONS:
        return {"sparse": True, "reason": "insufficient_observations", "data": None}

    median_week = int(round(float(dcw.median())))
    return {"sparse": False, "reason": None, "data": median_week}


def _compute_current_cycle_week(current_cycle_year: int | None) -> int | None:
    """Compute today's position in the in-progress cycle (week since Sept 1 of prior year).

    Returns None when there is no in-progress cycle or today is before cycle start.
    """
    if current_cycle_year is None:
        return None
    today = date.today()
    cycle_start = date(current_cycle_year - 1, 9, 1)  # Sept 1 of cycle start year
    if today < cycle_start:
        return None
    days_elapsed = (today - cycle_start).days
    return max(1, days_elapsed // 7 + 1)


def write_output(cohort_df: pd.DataFrame, km_data: dict, output_dir: Path) -> None:
    """Serialize pipeline results to JSON files under output_dir.

    Creates:
      output_dir/schools/{school_id}.json   — per-school SchoolData
      output_dir/schools-index.json         — [{school_id, school_name}, ...]
      output_dir/meta.json                  — {data_freshness, generated_at}

    Args:
        cohort_df: Output of group_by_cohort(). Must have columns:
            school_name, matriculating_year, applied_month, decision_cycle_week.
        km_data: Output of compute_km(). Keyed by school_name.
        output_dir: Root output directory (e.g. Path("src/data")).
    """
    schools_dir = output_dir / "schools"
    schools_dir.mkdir(parents=True, exist_ok=True)

    today_str = date.today().isoformat()
    generated_at = datetime.now(timezone.utc).isoformat()

    school_index = []
    seen_school_ids: dict[str, str] = {}

    for school_name, school_df in cohort_df.groupby("school_name"):
        school_id = _school_name_to_id(str(school_name))
        if school_id in seen_school_ids:
            raise ValueError(
                f"School ID collision: '{school_name}' and '{seen_school_ids[school_id]}' "
                f"both produce slug '{school_id}'. Rename one school in the source data."
            )
        seen_school_ids[school_id] = str(school_name)
        km = km_data.get(school_name, {
            "last_cycle_km": {"sparse": True, "reason": "insufficient_observations", "data": None},
            "current_cycle_km": {"sparse": True, "reason": "insufficient_observations", "data": None},
        })

        # Extract cycle years for downstream computations
        last_cycle_year = None
        if not km["last_cycle_km"]["sparse"] and km["last_cycle_km"]["data"] is not None:
            last_cycle_year = km["last_cycle_km"]["data"]["cycle_year"]

        current_cycle_year = None
        if not km["current_cycle_km"]["sparse"] and km["current_cycle_km"]["data"] is not None:
            current_cycle_year = km["current_cycle_km"]["data"]["cycle_year"]

        school_data = {
            "school_id": school_id,
            "school_name": school_name,
            "last_cycle_km": km["last_cycle_km"],
            "current_cycle_km": km["current_cycle_km"],
            "cohort_histograms": _compute_cohort_histograms(school_df),
            "median_decision_week": _compute_median_decision_week(school_df, last_cycle_year),
            "current_cycle_week": _compute_current_cycle_week(current_cycle_year),
        }

        json_path = schools_dir / f"{school_id}.json"
        json_path.write_text(
            json.dumps(school_data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
        school_index.append({"school_id": school_id, "school_name": school_name})

    school_index.sort(key=lambda s: s["school_id"])  # deterministic order

    (output_dir / "schools-index.json").write_text(
        json.dumps(school_index, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    (output_dir / "meta.json").write_text(
        json.dumps({"data_freshness": today_str, "generated_at": generated_at}, indent=2),
        encoding="utf-8",
    )
