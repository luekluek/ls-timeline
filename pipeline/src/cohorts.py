import pandas as pd


def group_by_cohort(df: pd.DataFrame) -> pd.DataFrame:
    """Tag each record with its applied_month and sort by school + month.

    Input DataFrame must have been through normalize() (so sent_at is datetime)
    and filter_outliers().

    Args:
        df: Filtered normalized DataFrame with sent_at as datetime column.

    Returns:
        DataFrame with applied_month (int 1-12) column added, sorted by
        school_name and applied_month. All original columns preserved.
    """
    df = df.copy()
    df['applied_month'] = df['sent_at'].dt.month
    df = df.sort_values(['school_name', 'applied_month', 'matriculating_year'])
    return df.reset_index(drop=True)
