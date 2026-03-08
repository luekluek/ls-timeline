# ls_timeline Pipeline

Python data pipeline that processes raw LSD.Law application data and produces per-school JSON files consumed by the React frontend.

## Installation

From within the `pipeline/` directory:

```bash
pip install -e ".[dev]"
```

This installs `pandas`, `scipy`, `numpy`, and developer tools (`pytest`, `pytest-cov`).

## Running the pipeline

```bash
python run_pipeline.py --input data/lsdata.csv
```

Output JSON files are written to `../src/data/` (the frontend data directory).

## Running tests

```bash
pytest tests/
```

## Notes

- `pipeline/data/lsdata.csv` is the real source data file (not committed if too large). It is **never** copied to `src/` or `public/`.
- `pipeline/data/fixture_lsdata.csv` is a small representative sample (30 rows) used for development and testing. Use this when you don't have the real data file.
- The real CSV has a non-header first line (`Last updated: ...`). All CSV reads must use `skiprows=1` (e.g. `pd.read_csv(path, skiprows=1)`).
