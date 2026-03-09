"""Tests for pipeline/src/kaplan_meier.py — Story 2.4."""

import pandas as pd

from src.kaplan_meier import compute_km, MIN_OBSERVATIONS


def make_km_df(rows: list[dict]) -> pd.DataFrame:
    """Build a cohort DataFrame with KM-relevant columns and sensible defaults."""
    defaults = {
        "school_name": "Test Law",
        "matriculating_year": 2024,
        "cycle_week": 10,
        "decision_cycle_week": 10.0,
        "sent_at": pd.Timestamp("2024-09-15"),
        "applied_month": 9,
        "gpa": 3.8,
        "lsat": 170,
    }
    records = [{**defaults, **r} for r in rows]
    return pd.DataFrame(records)


def current_cycle_stub(
    school_name: str = "Test Law",
    current_year: int = 2025,
    count: int = 6,
) -> list[dict]:
    """Return in-progress rows to establish a global current cycle year.

    Required by any test that wants last_cycle_km data: the new global-cycle
    logic only produces last_cycle_km when a current in-progress cycle exists
    across the dataset. Tests that focus on last_cycle_km math must include
    these NaN rows so global_current_year is not None.
    """
    return [
        {
            "school_name": school_name,
            "matriculating_year": current_year,
            "decision_cycle_week": float("nan"),
            "cycle_week": 10,
        }
    ] * count


# ---------------------------------------------------------------------------
# Known survival calculation (AC #2)
# ---------------------------------------------------------------------------

class TestKnownSurvivalCalculation:
    def test_survival_at_week_10_is_half(self):
        """5 of 10 get decisions at week 10 → survival drops to 0.5."""
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * 5
            + [{"decision_cycle_week": 20.0, "cycle_week": 20}] * 5
            + current_cycle_stub()  # 2024 data → last_cycle, 2025 stub → current
        )
        df = make_km_df(rows)
        result = compute_km(df)
        points = result["Test Law"]["last_cycle_km"]["data"]["points"]

        week_10_point = next(p for p in points if p["cycle_week"] == 10)
        assert abs(week_10_point["survival"] - 0.5) < 1e-6

    def test_survival_at_week_20_is_zero(self):
        """All 10 have decided by week 20 → survival drops to 0.0."""
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * 5
            + [{"decision_cycle_week": 20.0, "cycle_week": 20}] * 5
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        result = compute_km(df)
        points = result["Test Law"]["last_cycle_km"]["data"]["points"]

        week_20_point = next(p for p in points if p["cycle_week"] == 20)
        assert abs(week_20_point["survival"] - 0.0) < 1e-6

    def test_first_point_is_origin(self):
        """Curve always starts at (0, 1.0)."""
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * 5
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        result = compute_km(df)
        points = result["Test Law"]["last_cycle_km"]["data"]["points"]

        assert points[0]["cycle_week"] == 0
        assert points[0]["survival"] == 1.0


# ---------------------------------------------------------------------------
# Sparsity (AC #5)
# ---------------------------------------------------------------------------

class TestSparsity:
    def test_below_min_observations_is_sparse(self):
        """4 rows (< MIN_OBSERVATIONS=5) in last cycle → sparse result."""
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * (MIN_OBSERVATIONS - 1)
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        result = compute_km(df)
        last_km = result["Test Law"]["last_cycle_km"]

        assert last_km["sparse"] is True

    def test_sparse_reason(self):
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * (MIN_OBSERVATIONS - 1)
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        result = compute_km(df)
        assert result["Test Law"]["last_cycle_km"]["reason"] == "insufficient_observations"

    def test_sparse_data_is_none(self):
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * (MIN_OBSERVATIONS - 1)
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        result = compute_km(df)
        assert result["Test Law"]["last_cycle_km"]["data"] is None

    def test_exactly_min_observations_is_not_sparse(self):
        """Exactly MIN_OBSERVATIONS rows in last cycle → not sparse."""
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * MIN_OBSERVATIONS
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        result = compute_km(df)
        assert result["Test Law"]["last_cycle_km"]["sparse"] is False


# ---------------------------------------------------------------------------
# In-progress flag (AC #4)
# ---------------------------------------------------------------------------

class TestInProgressFlag:
    def _make_two_cycle_df(self):
        """School with complete 2024 cycle and in-progress 2025 cycle."""
        last_rows = [
            {"matriculating_year": 2024, "decision_cycle_week": float(10 + i), "cycle_week": 10 + i}
            for i in range(6)
        ]
        current_rows = [
            {"matriculating_year": 2025, "decision_cycle_week": float(10 + i), "cycle_week": 10 + i}
            for i in range(3)
        ] + [
            {"matriculating_year": 2025, "decision_cycle_week": float("nan"), "cycle_week": 30}
            for _ in range(3)
        ]
        return make_km_df(last_rows + current_rows)

    def test_last_point_of_current_cycle_has_in_progress(self):
        df = self._make_two_cycle_df()
        result = compute_km(df)
        points = result["Test Law"]["current_cycle_km"]["data"]["points"]
        assert points[-1].get("in_progress") is True

    def test_only_last_point_has_in_progress(self):
        df = self._make_two_cycle_df()
        result = compute_km(df)
        points = result["Test Law"]["current_cycle_km"]["data"]["points"]
        for p in points[:-1]:
            assert "in_progress" not in p

    def test_last_cycle_has_no_in_progress(self):
        df = self._make_two_cycle_df()
        result = compute_km(df)
        points = result["Test Law"]["last_cycle_km"]["data"]["points"]
        for p in points:
            assert "in_progress" not in p

    def test_in_progress_not_marked_when_school_has_all_decisions_for_current_cycle(self):
        """A school whose current-cycle applicants all have decisions gets no in_progress flag.

        Another school establishes 2025 as the global current year.
        This school has all decisions in for 2025 — curve is complete, no flag.
        """
        rows_pending = [
            {"school_name": "Pending School", "matriculating_year": 2025,
             "decision_cycle_week": float("nan"), "cycle_week": 10}
        ] * 6
        rows_decided = [
            {"school_name": "Decided School", "matriculating_year": 2025,
             "decision_cycle_week": float(10 + i), "cycle_week": 10 + i}
            for i in range(6)
        ]
        df = make_km_df(rows_pending + rows_decided)
        result = compute_km(df)

        points = result["Decided School"]["current_cycle_km"]["data"]["points"]
        for p in points:
            assert "in_progress" not in p


# ---------------------------------------------------------------------------
# Cycle determination
# ---------------------------------------------------------------------------

class TestCycleDetermination:
    def test_cycle_year_labels_correct(self):
        """2024 complete, 2025 in-progress → last=2024, current=2025."""
        last_rows = [
            {"matriculating_year": 2024, "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 6
        current_rows = [
            {"matriculating_year": 2025, "decision_cycle_week": 12.0, "cycle_week": 12}
        ] * 3 + [
            {"matriculating_year": 2025, "decision_cycle_week": float("nan"), "cycle_week": 30}
        ] * 3
        df = make_km_df(last_rows + current_rows)
        result = compute_km(df)

        assert result["Test Law"]["last_cycle_km"]["data"]["cycle_year"] == 2024
        assert result["Test Law"]["current_cycle_km"]["data"]["cycle_year"] == 2025

    def test_no_current_cycle_when_all_complete(self):
        """All years have decisions → current_cycle_km is sparse."""
        rows = [
            {"matriculating_year": 2024, "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 6
        df = make_km_df(rows)
        result = compute_km(df)
        assert result["Test Law"]["current_cycle_km"]["sparse"] is True

    def test_current_cycle_with_zero_decisions(self):
        """Current cycle where NO decisions have been issued yet (all NaN).

        Real-world: school early in cycle, no decisions out.
        KM curve has only the origin point, marked in_progress.
        """
        last_rows = [
            {"matriculating_year": 2024, "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 6
        current_rows = [
            # All NaN — no decisions yet in 2025 cycle
            {"matriculating_year": 2025, "decision_cycle_week": float("nan"), "cycle_week": w}
            for w in range(5, 11)
        ]
        df = make_km_df(last_rows + current_rows)
        result = compute_km(df)

        current_km = result["Test Law"]["current_cycle_km"]
        assert current_km["sparse"] is False
        points = current_km["data"]["points"]
        # Only the origin point — no events to step down on
        assert points[0] == {"cycle_week": 0, "survival": 1.0, "in_progress": True}
        assert len(points) == 1

    def test_last_cycle_uses_global_current_year_minus_one(self):
        """With 2023 and 2024 complete and 2025 in-progress, last_year = 2024 (= 2025 - 1)."""
        rows_2023 = [
            {"matriculating_year": 2023, "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 6
        rows_2024 = [
            {"matriculating_year": 2024, "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 6
        rows_2025 = [
            {"matriculating_year": 2025, "decision_cycle_week": float("nan"), "cycle_week": 10}
        ] * 6
        df = make_km_df(rows_2023 + rows_2024 + rows_2025)
        result = compute_km(df)
        assert result["Test Law"]["last_cycle_km"]["data"]["cycle_year"] == 2024

    def test_year_with_some_nan_is_still_used_as_last_cycle(self):
        """Regression: year N-1 that has some NaN (partially complete) is still last_cycle.

        The old per-school logic excluded years with any NaN from complete_years,
        causing it to fall back to N-2. The global approach uses current_year - 1
        regardless of NaN status for that year.
        """
        # 2024: partially complete (some decisions in, some still NaN)
        rows_2024_decided = [
            {"matriculating_year": 2024, "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 5
        rows_2024_pending = [
            {"matriculating_year": 2024, "decision_cycle_week": float("nan"), "cycle_week": 10}
        ] * 2
        # 2025: global current (all NaN — early in cycle)
        rows_2025 = [
            {"matriculating_year": 2025, "decision_cycle_week": float("nan"), "cycle_week": 5}
        ] * 6
        df = make_km_df(rows_2024_decided + rows_2024_pending + rows_2025)
        result = compute_km(df)
        # last_cycle = 2025 - 1 = 2024, even though 2024 has NaN rows
        assert result["Test Law"]["last_cycle_km"]["data"]["cycle_year"] == 2024

    def test_school_missing_current_cycle_year_is_fully_sparse(self):
        """A school with no rows for the global current year shows nothing (both sparse).

        School A establishes 2025 as the global current year.
        School B only has 2024 data — no data for 2025 at all.
        """
        rows_a = [
            {"school_name": "School A", "matriculating_year": 2025,
             "decision_cycle_week": float("nan"), "cycle_week": 10}
        ] * 6
        rows_b = [
            {"school_name": "School B", "matriculating_year": 2024,
             "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 6
        df = make_km_df(rows_a + rows_b)
        result = compute_km(df)

        assert result["School B"]["current_cycle_km"]["sparse"] is True
        assert result["School B"]["last_cycle_km"]["sparse"] is True

    def test_global_current_year_is_max_in_progress_year_across_all_schools(self):
        """Global current year is determined by the maximum year with NaN across all schools."""
        rows_a = [
            {"school_name": "School A", "matriculating_year": 2025,
             "decision_cycle_week": float("nan"), "cycle_week": 10}
        ] * 6
        rows_b = [
            {"school_name": "School B", "matriculating_year": 2024,
             "decision_cycle_week": 10.0, "cycle_week": 10}
        ] * 6
        df = make_km_df(rows_a + rows_b)
        result = compute_km(df)

        assert result["School A"]["current_cycle_km"]["data"]["cycle_year"] == 2025
        assert result["School B"]["current_cycle_km"]["sparse"] is True
        assert result["School B"]["last_cycle_km"]["sparse"] is True


# ---------------------------------------------------------------------------
# Multiple schools
# ---------------------------------------------------------------------------

class TestMultipleSchools:
    def test_separate_results_per_school(self):
        """Two schools with last-cycle data both show non-sparse results."""
        rows = (
            [{"school_name": "School A", "decision_cycle_week": 10.0, "cycle_week": 10}] * 6
            + [{"school_name": "School B", "decision_cycle_week": 15.0, "cycle_week": 15}] * 6
            + current_cycle_stub(school_name="School A")
            + current_cycle_stub(school_name="School B")
        )
        df = make_km_df(rows)
        result = compute_km(df)

        assert "School A" in result
        assert "School B" in result
        assert result["School A"]["last_cycle_km"]["sparse"] is False
        assert result["School B"]["last_cycle_km"]["sparse"] is False

    def test_sparse_school_does_not_affect_other(self):
        """School with < MIN_OBSERVATIONS in last cycle is sparse; other school is fine."""
        rows = (
            [{"school_name": "Big School", "decision_cycle_week": 10.0, "cycle_week": 10}] * 6
            + [{"school_name": "Tiny School", "decision_cycle_week": 10.0, "cycle_week": 10}] * 3
            + current_cycle_stub(school_name="Big School")
            + current_cycle_stub(school_name="Tiny School", count=3)
        )
        df = make_km_df(rows)
        result = compute_km(df)

        assert result["Big School"]["last_cycle_km"]["sparse"] is False
        assert result["Tiny School"]["last_cycle_km"]["sparse"] is True


# ---------------------------------------------------------------------------
# Determinism (NFR10)
# ---------------------------------------------------------------------------

class TestDeterminism:
    def test_same_result_on_repeated_calls(self):
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * 5
            + [{"decision_cycle_week": 20.0, "cycle_week": 20}] * 5
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        result1 = compute_km(df)
        result2 = compute_km(df)

        points1 = result1["Test Law"]["last_cycle_km"]["data"]["points"]
        points2 = result2["Test Law"]["last_cycle_km"]["data"]["points"]
        assert points1 == points2

    def test_shuffled_input_same_result(self):
        """Order of rows should not affect KM output."""
        rows = (
            [{"decision_cycle_week": 10.0, "cycle_week": 10}] * 5
            + [{"decision_cycle_week": 20.0, "cycle_week": 20}] * 5
            + current_cycle_stub()
        )
        df = make_km_df(rows)
        df_shuffled = df.sample(frac=1, random_state=42).reset_index(drop=True)

        result1 = compute_km(df)
        result2 = compute_km(df_shuffled)

        points1 = result1["Test Law"]["last_cycle_km"]["data"]["points"]
        points2 = result2["Test Law"]["last_cycle_km"]["data"]["points"]
        assert points1 == points2


# ---------------------------------------------------------------------------
# Non-sparse fields structure (AC #3 / output dict shape)
# ---------------------------------------------------------------------------

class TestOutputStructure:
    def test_non_sparse_field_has_correct_keys(self):
        rows = [{"decision_cycle_week": 10.0, "cycle_week": 10}] * 6 + current_cycle_stub()
        df = make_km_df(rows)
        result = compute_km(df)
        last_km = result["Test Law"]["last_cycle_km"]

        assert "sparse" in last_km
        assert "reason" in last_km
        assert "data" in last_km
        assert last_km["sparse"] is False
        assert last_km["reason"] is None

    def test_data_has_points_and_cycle_year(self):
        rows = [{"decision_cycle_week": 10.0, "cycle_week": 10}] * 6 + current_cycle_stub()
        df = make_km_df(rows)
        result = compute_km(df)
        data = result["Test Law"]["last_cycle_km"]["data"]

        assert "points" in data
        assert "cycle_year" in data
        assert isinstance(data["points"], list)
        assert isinstance(data["cycle_year"], int)

    def test_cycle_year_matches_matriculating_year(self):
        """last_cycle_km cycle_year matches the last-cycle matriculating_year."""
        rows = (
            [{"matriculating_year": 2023, "decision_cycle_week": 10.0, "cycle_week": 10}] * 6
            + current_cycle_stub(current_year=2024)  # global_current_year=2024, last=2023
        )
        df = make_km_df(rows)
        result = compute_km(df)
        assert result["Test Law"]["last_cycle_km"]["data"]["cycle_year"] == 2023
