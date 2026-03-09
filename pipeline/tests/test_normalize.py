import math

import pandas as pd
import pytest

from src.normalize import normalize


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_df(rows: list[dict]) -> pd.DataFrame:
    """Build a minimal DataFrame with only the columns normalize() needs.

    Each dict in ``rows`` may supply: sent_at, decision_at, matriculating_year.
    Additional columns are allowed (they pass through unchanged).
    Missing columns default to: decision_at="" (null), matriculating_year=2026.
    """
    defaults = {"sent_at": "", "decision_at": "", "matriculating_year": 2026}
    records = [{**defaults, **row} for row in rows]
    return pd.DataFrame(records)


# ---------------------------------------------------------------------------
# Test cases
# ---------------------------------------------------------------------------

class TestWeekBoundary:
    """AC #2: Cycle-week computation anchored at Sept 1 of cycle start year."""

    def test_week_1_boundary_sept_1(self):
        """sent_at = Sept 1 (day 0 from cycle_start) → cycle_week == 1."""
        df = make_df([{"sent_at": "2025-09-01", "matriculating_year": 2026}])
        out = normalize(df)
        assert len(out) == 1
        assert out.loc[0, "cycle_week"] == 1

    def test_week_1_sept_7(self):
        """Sept 7 is still day 6 → cycle_week == 1."""
        df = make_df([{"sent_at": "2025-09-07", "matriculating_year": 2026}])
        out = normalize(df)
        assert out.loc[0, "cycle_week"] == 1

    def test_week_2_sept_8(self):
        """Sept 8 is day 7 → cycle_week == 2."""
        df = make_df([{"sent_at": "2025-09-08", "matriculating_year": 2026}])
        out = normalize(df)
        assert out.loc[0, "cycle_week"] == 2

    def test_mid_cycle_oct_15(self):
        """Oct 15, 2025: 44 days from Sept 1, 2025 → week 7 (44 // 7 + 1 = 7)."""
        df = make_df([{"sent_at": "2025-10-15", "matriculating_year": 2026}])
        out = normalize(df)
        # days = (2025-10-15 - 2025-09-01).days = 44  →  44 // 7 + 1 = 7
        assert out.loc[0, "cycle_week"] == 7


class TestDecisionCycleWeek:
    """AC #3: decision_cycle_week computed relative to same cycle_start."""

    def test_dec_jan_year_crossing(self):
        """sent_at Oct 1 2025, decision_at Jan 20 2026, matric_year 2026.

        cycle_start = 2025-09-01
        sent_at days  = 30  → week  5
        decision days = 141 → week 21
        decision_cycle_week > cycle_week
        """
        df = make_df([{
            "sent_at": "2025-10-01",
            "decision_at": "2026-01-20",
            "matriculating_year": 2026,
        }])
        out = normalize(df)
        # days from 2025-09-01 to 2025-10-01 = 30  → 30 // 7 + 1 = 5
        assert out.loc[0, "cycle_week"] == 5
        # days from 2025-09-01 to 2026-01-20 = 141 → 141 // 7 + 1 = 21
        assert out.loc[0, "decision_cycle_week"] == 21
        assert out.loc[0, "decision_cycle_week"] > out.loc[0, "cycle_week"]


class TestWindowFilter:
    """AC #4: Records outside the Sept–June window are excluded."""

    def test_june_30_included(self):
        """June 30 of matriculating year is within the window (inclusive)."""
        df = make_df([{"sent_at": "2026-06-30", "matriculating_year": 2026}])
        out = normalize(df)
        assert len(out) == 1

    def test_july_1_excluded(self):
        """July 1 is after June 30 — must be excluded."""
        df = make_df([{"sent_at": "2026-07-01", "matriculating_year": 2026}])
        out = normalize(df)
        assert len(out) == 0

    def test_august_excluded(self):
        """August is before Sept 1 cycle start — must be excluded."""
        df = make_df([{"sent_at": "2025-08-15", "matriculating_year": 2026}])
        out = normalize(df)
        assert len(out) == 0


class TestNullDecisionAt:
    """AC #5: Null decision_at retains the row; decision_cycle_week is NaN."""

    def test_null_decision_at_retained(self):
        """Row with blank decision_at is kept; decision_cycle_week is NaN."""
        df = make_df([{
            "sent_at": "2025-10-01",
            "decision_at": "",
            "matriculating_year": 2026,
        }])
        out = normalize(df)
        assert len(out) == 1
        assert math.isnan(out.loc[0, "decision_cycle_week"])

    def test_nan_decision_at_retained(self):
        """NaN in decision_at is also handled — row retained, week is NaN."""
        df = make_df([{
            "sent_at": "2025-10-01",
            "decision_at": float("nan"),
            "matriculating_year": 2026,
        }])
        out = normalize(df)
        assert len(out) == 1
        assert math.isnan(out.loc[0, "decision_cycle_week"])


class TestDeterminism:
    """AC #6: Calling normalize() twice on the same input produces identical output."""

    def test_determinism(self):
        """Identical input DataFrames produce identical outputs."""
        df = make_df([
            {"sent_at": "2025-09-01", "matriculating_year": 2026},
            {"sent_at": "2025-10-15", "decision_at": "2026-01-20", "matriculating_year": 2026},
            {"sent_at": "2026-06-30", "matriculating_year": 2026},
        ])
        out1 = normalize(df)
        out2 = normalize(df)
        pd.testing.assert_frame_equal(out1, out2)


class TestMultiCycle:
    """AC #2, #3: Mixed matriculating years — each row uses its own cycle_start."""

    def test_multi_cycle_rows(self):
        """MatYr 2025 cycle starts 2024-09-01; MatYr 2026 cycle starts 2025-09-01."""
        df = make_df([
            {"sent_at": "2024-09-01", "matriculating_year": 2025},  # week 1 for 2025 cycle
            {"sent_at": "2025-09-01", "matriculating_year": 2026},  # week 1 for 2026 cycle
        ])
        out = normalize(df)
        assert len(out) == 2
        # Both should be week 1 despite different calendar years
        assert out.loc[0, "cycle_week"] == 1
        assert out.loc[1, "cycle_week"] == 1

    def test_multi_cycle_exclusion(self):
        """August record is excluded regardless of which matriculating year it references."""
        df = make_df([
            {"sent_at": "2025-08-31", "matriculating_year": 2026},  # before 2025-09-01 → excluded
            {"sent_at": "2025-09-01", "matriculating_year": 2026},  # exactly cycle_start → included
        ])
        out = normalize(df)
        assert len(out) == 1
        assert out.loc[0, "cycle_week"] == 1
