import pandas as pd


def normalize(df: pd.DataFrame) -> pd.DataFrame:
    """Convert raw application/decision dates to cycle-week numbers.

    Filters records to the Sept–June window for each matriculating year,
    then adds ``cycle_week`` and ``decision_cycle_week`` columns.

    Args:
        df: Raw DataFrame (already loaded, header-skipped) containing at
            minimum: ``sent_at``, ``decision_at``, ``matriculating_year``.

    Returns:
        Filtered DataFrame with two new columns added:
        - ``cycle_week`` (int): weeks since Sept 1 of the cycle start year; min 1.
        - ``decision_cycle_week`` (float, nullable): same formula for decision
          date; NaN where ``decision_at`` is blank.
        All original columns are preserved unchanged.
    """
    df = df.copy()

    # Parse dates — coerce blanks/invalid to NaT
    df['sent_at'] = pd.to_datetime(df['sent_at'], errors='coerce')
    df['decision_at'] = pd.to_datetime(df['decision_at'], errors='coerce')

    # Compute cycle boundaries per row (vectorized, tz-naive)
    cycle_start = pd.to_datetime({
        'year': df['matriculating_year'] - 1,
        'month': pd.Series(9, index=df.index),
        'day': pd.Series(1, index=df.index),
    })
    cycle_end = pd.to_datetime({
        'year': df['matriculating_year'],
        'month': pd.Series(6, index=df.index),
        'day': pd.Series(30, index=df.index),
    })

    # Window filter: keep rows where sent_at falls within the cycle
    mask = (df['sent_at'] >= cycle_start) & (df['sent_at'] <= cycle_end)
    df = df[mask].copy()
    cycle_start = cycle_start[mask]

    # Compute cycle_week (integer, 1-based)
    df['cycle_week'] = ((df['sent_at'] - cycle_start).dt.days // 7 + 1).astype(int)

    # Compute decision_cycle_week (NaN where decision_at is NaT or before cycle_start)
    decision_days = (df['decision_at'] - cycle_start).dt.days
    df['decision_cycle_week'] = (decision_days // 7 + 1).where(
        df['decision_at'].notna() & (decision_days >= 0)
    )

    return df.reset_index(drop=True)
