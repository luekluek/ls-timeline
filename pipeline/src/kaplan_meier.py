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


def _determine_global_current_year(cohort_df: pd.DataFrame) -> int | None:
    """Find the application cycle year currently in-progress, shared across all schools.

    A cycle is in-progress if ANY row across ALL schools has a NaN decision_cycle_week.
    Returns the maximum such year, or None if all cycles are complete.
    """
    in_progress_mask = cohort_df["decision_cycle_week"].isna()
    if not in_progress_mask.any():
        return None
    return int(cohort_df.loc[in_progress_mask, "matriculating_year"].max())


def compute_km(cohort_df: pd.DataFrame) -> dict:
    """Compute KM survival estimates per school per application cycle.

    The current cycle year is determined globally (shared across all schools).
    Schools with no data for the global current cycle year return sparse for
    both last_cycle_km and current_cycle_km — they are not displayed.

    Args:
        cohort_df: Output of group_by_cohort(). Must have columns:
            school_name, matriculating_year, cycle_week, decision_cycle_week.

    Returns:
        Dict keyed by school_name, each value containing:
            last_cycle_km: SparseField for cycle_year = global_current_year - 1.
            current_cycle_km: SparseField for cycle_year = global_current_year.
    """
    global_current_year = _determine_global_current_year(cohort_df)
    result = {}

    for school_name, school_df in cohort_df.groupby("school_name"):
        if global_current_year is None:
            # No in-progress cycle anywhere — show nothing
            result[school_name] = {
                "last_cycle_km": _sparse_field(None),
                "current_cycle_km": _sparse_field(None),
            }
            continue

        current_group = school_df[school_df["matriculating_year"] == global_current_year]
        if len(current_group) == 0:
            # School has no data for the current cycle — show nothing
            result[school_name] = {
                "last_cycle_km": _sparse_field(None),
                "current_cycle_km": _sparse_field(None),
            }
            continue

        # Compute current_cycle_km
        if len(current_group) < MIN_OBSERVATIONS:
            current_cycle_data = None
        else:
            points = _compute_km_curve(current_group)
            # Mark in_progress only if this school still has pending decisions
            if points and current_group["decision_cycle_week"].isna().any():
                points[-1] = dict(points[-1], in_progress=True)
            current_cycle_data = {"points": points, "cycle_year": int(global_current_year)}

        # Compute last_cycle_km (always global_current_year - 1)
        last_year = global_current_year - 1
        last_group = school_df[school_df["matriculating_year"] == last_year]
        if len(last_group) < MIN_OBSERVATIONS:
            last_cycle_data = None
        else:
            points = _compute_km_curve(last_group)
            last_cycle_data = {"points": points, "cycle_year": int(last_year)}

        result[school_name] = {
            "last_cycle_km": _sparse_field(last_cycle_data),
            "current_cycle_km": _sparse_field(current_cycle_data),
        }

    return result
