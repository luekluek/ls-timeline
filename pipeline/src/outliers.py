import pandas as pd


def filter_outliers(df: pd.DataFrame) -> pd.DataFrame:
    """Remove implausible records from a normalized pipeline DataFrame.

    Applies hard boundary filters on GPA, LSAT, and cycle-week columns.
    Input DataFrame must have already been through normalize().

    Args:
        df: Normalized DataFrame with cycle_week, decision_cycle_week,
            gpa, lsat columns.

    Returns:
        Filtered DataFrame with all original columns preserved, reset index.
    """
    gpa_mask = (df['gpa'] >= 0.0) & (df['gpa'] <= 4.33)
    lsat_mask = (df['lsat'] >= 120) & (df['lsat'] <= 180)
    cycle_mask = (df['cycle_week'] >= 1) & (df['cycle_week'] <= 44)

    # decision_cycle_week may be NaN (still deciding) — NaN rows pass this filter
    dcw = df['decision_cycle_week']
    dcw_mask = dcw.isna() | ((dcw >= 1) & (dcw <= 52))

    combined = gpa_mask & lsat_mask & cycle_mask & dcw_mask
    return df[combined].copy().reset_index(drop=True)
