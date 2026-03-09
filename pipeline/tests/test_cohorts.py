import pandas as pd
import pytest

from src.outliers import filter_outliers
from src.cohorts import group_by_cohort


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def make_df(**overrides) -> pd.DataFrame:
    """Build a single-row DataFrame with valid defaults; override any field."""
    base = {
        'gpa': 3.5,
        'lsat': 160,
        'cycle_week': 10,
        'decision_cycle_week': float('nan'),
        'sent_at': pd.Timestamp('2023-10-15'),
        'matriculating_year': 2024,
        'school_name': 'Harvard Law',
    }
    base.update(overrides)
    return pd.DataFrame([base])


def make_rows(rows: list[dict]) -> pd.DataFrame:
    """Build a multi-row DataFrame from a list of override dicts."""
    return pd.concat([make_df(**r) for r in rows], ignore_index=True)


# ---------------------------------------------------------------------------
# filter_outliers — GPA boundary tests
# ---------------------------------------------------------------------------

class TestFilterOutliersGpa:
    def test_gpa_lower_bound_retained(self):
        df = make_df(gpa=0.0)
        result = filter_outliers(df)
        assert len(result) == 1

    def test_gpa_upper_bound_retained(self):
        df = make_df(gpa=4.33)
        result = filter_outliers(df)
        assert len(result) == 1

    def test_gpa_over_upper_excluded(self):
        df = make_df(gpa=4.34)
        result = filter_outliers(df)
        assert len(result) == 0

    def test_gpa_below_lower_excluded(self):
        df = make_df(gpa=-0.01)
        result = filter_outliers(df)
        assert len(result) == 0

    def test_gpa_well_over_excluded(self):
        df = make_df(gpa=5.5)
        result = filter_outliers(df)
        assert len(result) == 0


# ---------------------------------------------------------------------------
# filter_outliers — LSAT boundary tests
# ---------------------------------------------------------------------------

class TestFilterOutliersLsat:
    def test_lsat_lower_bound_retained(self):
        df = make_df(lsat=120)
        result = filter_outliers(df)
        assert len(result) == 1

    def test_lsat_upper_bound_retained(self):
        df = make_df(lsat=180)
        result = filter_outliers(df)
        assert len(result) == 1

    def test_lsat_below_lower_excluded(self):
        df = make_df(lsat=119)
        result = filter_outliers(df)
        assert len(result) == 0

    def test_lsat_above_upper_excluded(self):
        df = make_df(lsat=181)
        result = filter_outliers(df)
        assert len(result) == 0

    def test_lsat_well_over_excluded(self):
        df = make_df(lsat=190)
        result = filter_outliers(df)
        assert len(result) == 0


# ---------------------------------------------------------------------------
# filter_outliers — cycle_week boundary tests
# ---------------------------------------------------------------------------

class TestFilterOutliersCycleWeek:
    def test_cycle_week_lower_bound_retained(self):
        df = make_df(cycle_week=1)
        result = filter_outliers(df)
        assert len(result) == 1

    def test_cycle_week_upper_bound_retained(self):
        df = make_df(cycle_week=44)
        result = filter_outliers(df)
        assert len(result) == 1

    def test_cycle_week_zero_excluded(self):
        df = make_df(cycle_week=0)
        result = filter_outliers(df)
        assert len(result) == 0

    def test_cycle_week_over_excluded(self):
        df = make_df(cycle_week=45)
        result = filter_outliers(df)
        assert len(result) == 0


# ---------------------------------------------------------------------------
# filter_outliers — decision_cycle_week boundary tests
# ---------------------------------------------------------------------------

class TestFilterOutliersDecisionCycleWeek:
    def test_decision_cycle_week_nan_retained(self):
        df = make_df(decision_cycle_week=float('nan'))
        result = filter_outliers(df)
        assert len(result) == 1

    def test_decision_cycle_week_at_edge_retained(self):
        df = make_df(decision_cycle_week=52.0)
        result = filter_outliers(df)
        assert len(result) == 1

    def test_decision_cycle_week_lower_bound_excluded(self):
        df = make_df(decision_cycle_week=0.0)
        result = filter_outliers(df)
        assert len(result) == 0

    def test_decision_cycle_week_over_excluded(self):
        df = make_df(decision_cycle_week=53.0)
        result = filter_outliers(df)
        assert len(result) == 0


# ---------------------------------------------------------------------------
# filter_outliers — preserves columns, does not modify values
# ---------------------------------------------------------------------------

class TestFilterOutliersPreservation:
    def test_all_columns_preserved(self):
        df = make_df()
        result = filter_outliers(df)
        assert set(df.columns) == set(result.columns)

    def test_does_not_mutate_input(self):
        df = make_df(gpa=3.5)
        df_before = df.copy()
        filter_outliers(df)
        pd.testing.assert_frame_equal(df, df_before)

    def test_index_reset_after_filter(self):
        rows = [make_df(gpa=5.5), make_df(gpa=3.5)]
        df = pd.concat(rows, ignore_index=True)
        result = filter_outliers(df)
        assert list(result.index) == list(range(len(result)))


# ---------------------------------------------------------------------------
# group_by_cohort tests
# ---------------------------------------------------------------------------

class TestGroupByCohort:
    def test_october_applicants_get_month_10(self):
        df = make_rows([
            {'sent_at': pd.Timestamp('2023-10-05'), 'school_name': 'Harvard Law'},
            {'sent_at': pd.Timestamp('2023-10-20'), 'school_name': 'Harvard Law'},
        ])
        result = group_by_cohort(df)
        assert (result['applied_month'] == 10).all()

    def test_march_applicants_get_month_3(self):
        df = make_rows([
            {'sent_at': pd.Timestamp('2024-03-10'), 'school_name': 'Yale Law'},
        ])
        result = group_by_cohort(df)
        assert result.iloc[0]['applied_month'] == 3

    def test_two_schools_overlapping_months_grouped_correctly(self):
        df = make_rows([
            {'sent_at': pd.Timestamp('2023-10-05'), 'school_name': 'Harvard Law'},
            {'sent_at': pd.Timestamp('2023-10-15'), 'school_name': 'Yale Law'},
            {'sent_at': pd.Timestamp('2023-10-25'), 'school_name': 'Harvard Law'},
        ])
        result = group_by_cohort(df)
        harvard = result[result['school_name'] == 'Harvard Law']
        yale = result[result['school_name'] == 'Yale Law']
        assert (harvard['applied_month'] == 10).all()
        assert (yale['applied_month'] == 10).all()
        # school_name differentiates them
        assert len(harvard) == 2
        assert len(yale) == 1

    def test_applied_month_column_present(self):
        df = make_df()
        result = group_by_cohort(df)
        assert 'applied_month' in result.columns

    def test_original_columns_preserved(self):
        df = make_df()
        expected_cols = set(df.columns)
        result = group_by_cohort(df)
        assert expected_cols.issubset(set(result.columns))

    def test_output_sorted_by_school_then_month(self):
        df = make_rows([
            {'sent_at': pd.Timestamp('2023-12-01'), 'school_name': 'Yale Law', 'matriculating_year': 2024},
            {'sent_at': pd.Timestamp('2023-10-01'), 'school_name': 'Harvard Law', 'matriculating_year': 2024},
            {'sent_at': pd.Timestamp('2023-11-01'), 'school_name': 'Harvard Law', 'matriculating_year': 2024},
        ])
        result = group_by_cohort(df)
        school_names = list(result['school_name'])
        months = list(result['applied_month'])
        assert school_names == ['Harvard Law', 'Harvard Law', 'Yale Law']
        assert months == [10, 11, 12]

    def test_no_rows_dropped(self):
        df = make_rows([
            {'sent_at': pd.Timestamp('2023-10-01'), 'school_name': 'Harvard Law'},
            {'sent_at': pd.Timestamp('2023-11-01'), 'school_name': 'Yale Law'},
            {'sent_at': pd.Timestamp('2023-12-01'), 'school_name': 'Columbia Law'},
        ])
        result = group_by_cohort(df)
        assert len(result) == 3

    def test_does_not_mutate_input(self):
        df = make_df()
        assert 'applied_month' not in df.columns
        group_by_cohort(df)
        assert 'applied_month' not in df.columns

    def test_index_reset_after_sort(self):
        df = make_rows([
            {'sent_at': pd.Timestamp('2023-12-01'), 'school_name': 'Yale Law'},
            {'sent_at': pd.Timestamp('2023-10-01'), 'school_name': 'Harvard Law'},
        ])
        result = group_by_cohort(df)
        assert list(result.index) == list(range(len(result)))


# ---------------------------------------------------------------------------
# Determinism test — filter_outliers then group_by_cohort twice → identical
# ---------------------------------------------------------------------------

class TestDeterminism:
    def test_pipeline_deterministic(self):
        df = make_rows([
            {'gpa': 3.5, 'lsat': 160, 'cycle_week': 10, 'decision_cycle_week': float('nan'),
             'sent_at': pd.Timestamp('2023-10-15'), 'school_name': 'Harvard Law', 'matriculating_year': 2024},
            {'gpa': 2.8, 'lsat': 145, 'cycle_week': 20, 'decision_cycle_week': 30.0,
             'sent_at': pd.Timestamp('2023-11-20'), 'school_name': 'Yale Law', 'matriculating_year': 2024},
            # Columbia Law excluded by filter_outliers (gpa=5.5 > 4.33) — 2 rows survive
            {'gpa': 5.5, 'lsat': 160, 'cycle_week': 10, 'decision_cycle_week': float('nan'),
             'sent_at': pd.Timestamp('2023-10-05'), 'school_name': 'Columbia Law', 'matriculating_year': 2024},
        ])

        result1 = group_by_cohort(filter_outliers(df.copy()))
        result2 = group_by_cohort(filter_outliers(df.copy()))

        pd.testing.assert_frame_equal(result1, result2)
