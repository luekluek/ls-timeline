"""Kaplan-Meier survival estimation for LS Timeline pipeline.

Computes KM step-function data per school per application cycle.
Input: cohort DataFrame from group_by_cohort().
Output: dict keyed by school_name with last_cycle_km and current_cycle_km.
"""

import numpy as np
import pandas as pd

MIN_OBSERVATIONS = 5


def _compute_km_curve(group_df: pd.DataFrame) -> list[dict]:
    """Compute KM step-function points for a single (school, year) cohort.

    Returns list of {cycle_week, survival} dicts starting at (0, 1.0).
    Does NOT add in_progress flag — caller is responsible.
    """
    dcw = group_df["decision_cycle_week"].to_numpy(dtype=float)
    events = ~np.isnan(dcw)  # True = received decision

    # Censoring time for NaN rows: max observed decision week in this group,
    # or max cycle_week if no decisions have arrived yet
    if events.any():
        censor_at = float(np.nanmax(dcw))
    else:
        censor_at = float(group_df["cycle_week"].max())

    times = np.where(events, dcw, censor_at)
    event_times = np.unique(times[events])

    points = [{"cycle_week": 0, "survival": 1.0}]
    S = 1.0
    for t in event_times:
        d_t = float(np.sum(events & (times == t)))
        n_t = float(np.sum(times >= t))
        S = S * (1.0 - d_t / n_t)
        points.append({"cycle_week": int(t), "survival": round(S, 6)})

    return points


def _sparse_field(data) -> dict:
    """Wrap data in SparseField structure matching frontend TypeScript types."""
    if data is None:
        return {"sparse": True, "reason": "insufficient_observations", "data": None}
    return {"sparse": False, "reason": None, "data": data}


def _determine_cycles(school_df: pd.DataFrame) -> tuple[int | None, int | None]:
    """Determine last (complete) and current (in-progress) cycle years for a school.

    A year is "in-progress" if it has ANY NaN decision_cycle_week values.
    Returns (last_year, current_year) where either may be None.
    """
    years = sorted(school_df["matriculating_year"].unique())
    complete_years = [
        y
        for y in years
        if not school_df[school_df["matriculating_year"] == y]["decision_cycle_week"]
        .isna()
        .any()
    ]
    current_years = [
        y
        for y in years
        if school_df[school_df["matriculating_year"] == y]["decision_cycle_week"]
        .isna()
        .any()
    ]

    current_year = max(current_years) if current_years else None

    if current_year is not None:
        ## last_year = most recent complete year before current
        # prior_complete = [y for y in complete_years if y < current_year]
        # last_year = max(prior_complete) if prior_complete else None
        last_year = current_year - 1
    else:
        # No in-progress cycle — most recent year is "last"
        last_year = max(complete_years) if complete_years else None

    return (last_year, current_year)


def compute_km(cohort_df: pd.DataFrame) -> dict:
    """Compute KM survival estimates per school per application cycle.

    Args:
        cohort_df: Output of group_by_cohort(). Must have columns:
            school_name, matriculating_year, cycle_week, decision_cycle_week.

    Returns:
        Dict keyed by school_name, each value containing:
            last_cycle_km: SparseField wrapping KmCurve for the most recent complete cycle.
            current_cycle_km: SparseField wrapping KmCurve for the in-progress cycle.
    """
    result = {}

    for school_name, school_df in cohort_df.groupby("school_name"):
        last_year, current_year = _determine_cycles(school_df)

        # Compute last_cycle_km
        if last_year is None:
            last_cycle_data = None
        else:
            last_group = school_df[school_df["matriculating_year"] == last_year]
            if len(last_group) < MIN_OBSERVATIONS:
                last_cycle_data = None
            else:
                points = _compute_km_curve(last_group)
                last_cycle_data = {"points": points, "cycle_year": int(last_year)}

        # Compute current_cycle_km
        if current_year is None:
            current_cycle_data = None
        else:
            current_group = school_df[school_df["matriculating_year"] == current_year]
            if len(current_group) < MIN_OBSERVATIONS:
                current_cycle_data = None
            else:
                points = _compute_km_curve(current_group)
                # Mark the last point as in_progress
                if points:
                    points[-1] = dict(points[-1], in_progress=True)
                current_cycle_data = {"points": points, "cycle_year": int(current_year)}

        result[school_name] = {
            "last_cycle_km": _sparse_field(last_cycle_data),
            "current_cycle_km": _sparse_field(current_cycle_data),
        }

    return result
