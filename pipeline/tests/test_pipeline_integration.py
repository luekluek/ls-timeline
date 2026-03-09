"""Integration tests for the full pipeline: CSV in → JSON out.

Runs the pipeline in-process to a tmp directory to avoid overwriting src/data/.
All tests share a single pipeline run via the module-scoped fixture.
"""

import json
import re
import subprocess
import sys
from pathlib import Path

import pytest

PIPELINE_DIR = Path(__file__).parent.parent
FIXTURE_CSV = PIPELINE_DIR / "data" / "fixture_lsdata.csv"


def run_pipeline_in_process(csv_path: Path, output_dir: Path) -> None:
    """Execute the pipeline in-process, writing output to output_dir."""
    sys.path.insert(0, str(PIPELINE_DIR))
    import pandas as pd
    from src.normalize import normalize
    from src.outliers import filter_outliers
    from src.cohorts import group_by_cohort
    from src.kaplan_meier import compute_km
    from src.output import write_output

    df = pd.read_csv(csv_path, skiprows=1)
    df = normalize(df)
    df = filter_outliers(df)
    df = group_by_cohort(df)
    km_data = compute_km(df)
    write_output(df, km_data, output_dir)


@pytest.fixture(scope="module")
def pipeline_output(tmp_path_factory):
    """Run the pipeline once and return the output directory."""
    out_dir = tmp_path_factory.mktemp("data")
    run_pipeline_in_process(FIXTURE_CSV, out_dir)
    return out_dir


# ---------------------------------------------------------------------------
# meta.json tests (AC #1, #6)
# ---------------------------------------------------------------------------

class TestMetaJson:
    def test_meta_json_exists(self, pipeline_output):
        assert (pipeline_output / "meta.json").exists()

    def test_meta_json_has_valid_data_freshness(self, pipeline_output):
        meta = json.loads((pipeline_output / "meta.json").read_text())
        assert re.match(r"^\d{4}-\d{2}-\d{2}$", meta["data_freshness"])

    def test_meta_json_has_generated_at(self, pipeline_output):
        meta = json.loads((pipeline_output / "meta.json").read_text())
        assert "generated_at" in meta
        assert re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}", meta["generated_at"])


# ---------------------------------------------------------------------------
# schools-index.json tests (AC #1, #6)
# ---------------------------------------------------------------------------

class TestSchoolsIndex:
    def test_schools_index_exists_and_is_list(self, pipeline_output):
        index_path = pipeline_output / "schools-index.json"
        assert index_path.exists()
        index = json.loads(index_path.read_text())
        assert isinstance(index, list)
        assert len(index) > 0

    def test_schools_index_entries_have_required_fields(self, pipeline_output):
        index = json.loads((pipeline_output / "schools-index.json").read_text())
        for entry in index:
            assert "school_id" in entry, f"Missing school_id in {entry}"
            assert "school_name" in entry, f"Missing school_name in {entry}"


# ---------------------------------------------------------------------------
# Per-school JSON tests (AC #1, #5, #6)
# ---------------------------------------------------------------------------

class TestSchoolJsonFiles:
    def test_school_json_files_exist(self, pipeline_output):
        schools_dir = pipeline_output / "schools"
        assert schools_dir.exists()
        json_files = list(schools_dir.glob("*.json"))
        assert len(json_files) > 0

    def test_school_json_matches_schema_shape(self, pipeline_output):
        """All 7 top-level SchoolData fields must be present in every school JSON."""
        schools_dir = pipeline_output / "schools"
        required_fields = {
            "school_id",
            "school_name",
            "last_cycle_km",
            "current_cycle_km",
            "cohort_histograms",
            "median_decision_week",
            "current_cycle_week",
        }
        json_files = list(schools_dir.glob("*.json"))
        assert len(json_files) > 0, "No school JSON files found"

        for json_file in json_files:
            school = json.loads(json_file.read_text())
            missing = required_fields - set(school.keys())
            assert not missing, f"{json_file.name} missing fields: {missing}"

    def test_sparse_fields_have_correct_structure(self, pipeline_output):
        """All SparseField values must have sparse, reason, data keys."""
        sparse_field_keys = {"last_cycle_km", "current_cycle_km", "cohort_histograms", "median_decision_week"}
        schools_dir = pipeline_output / "schools"
        for json_file in schools_dir.glob("*.json"):
            school = json.loads(json_file.read_text())
            for field_name in sparse_field_keys:
                field = school[field_name]
                assert "sparse" in field, f"{json_file.name}.{field_name} missing 'sparse'"
                assert "reason" in field, f"{json_file.name}.{field_name} missing 'reason'"
                assert "data" in field, f"{json_file.name}.{field_name} missing 'data'"

    def test_non_sparse_school_has_km_data(self, pipeline_output):
        """Find a school with non-sparse last_cycle_km and validate its KM points."""
        schools_dir = pipeline_output / "schools"
        found_non_sparse = False
        for json_file in schools_dir.glob("*.json"):
            school = json.loads(json_file.read_text())
            km = school["last_cycle_km"]
            if not km["sparse"]:
                found_non_sparse = True
                data = km["data"]
                assert "points" in data, f"{json_file.name}: last_cycle_km.data missing 'points'"
                assert "cycle_year" in data, f"{json_file.name}: last_cycle_km.data missing 'cycle_year'"
                assert isinstance(data["points"], list)
                assert len(data["points"]) > 0
                # First point must be origin (0, 1.0)
                assert data["points"][0]["cycle_week"] == 0
                assert data["points"][0]["survival"] == 1.0
                break

        assert found_non_sparse, "Expected at least one school with non-sparse last_cycle_km"

    def test_school_id_is_valid_slug(self, pipeline_output):
        """school_id must be a valid URL slug (lowercase letters, digits, hyphens)."""
        index = json.loads((pipeline_output / "schools-index.json").read_text())
        for entry in index:
            slug = entry["school_id"]
            assert re.match(r"^[a-z0-9-]+$", slug), f"Invalid slug: '{slug}'"


# ---------------------------------------------------------------------------
# Determinism (AC #4, NFR10)
# ---------------------------------------------------------------------------

class TestDeterminism:
    def test_determinism(self, tmp_path_factory):
        """Two independent runs produce identical JSON output (except generated_at)."""
        out1 = tmp_path_factory.mktemp("det1")
        out2 = tmp_path_factory.mktemp("det2")
        run_pipeline_in_process(FIXTURE_CSV, out1)
        run_pipeline_in_process(FIXTURE_CSV, out2)

        for json_file in out1.glob("**/*.json"):
            relative = json_file.relative_to(out1)
            other_file = out2 / relative
            assert other_file.exists(), f"Missing in second run: {relative}"

            if json_file.name == "meta.json":
                m1 = json.loads(json_file.read_text())
                m2 = json.loads(other_file.read_text())
                assert m1["data_freshness"] == m2["data_freshness"], (
                    f"meta.json data_freshness differs: {m1['data_freshness']} vs {m2['data_freshness']}"
                )
            else:
                assert json_file.read_text() == other_file.read_text(), (
                    f"Non-deterministic output: {relative}"
                )


# ---------------------------------------------------------------------------
# NFR7: Raw CSV not written to output (AC #7)
# ---------------------------------------------------------------------------

class TestNoCsvInOutput:
    def test_raw_csv_not_in_output(self, pipeline_output):
        """No .csv files should exist anywhere in the output directory."""
        csv_files = list(pipeline_output.rglob("*.csv"))
        assert len(csv_files) == 0, f"Unexpected CSV files in output: {csv_files}"


# ---------------------------------------------------------------------------
# AC #3 / NFR9: run_pipeline.py main() error handling
# ---------------------------------------------------------------------------

_RUNNER = str(PIPELINE_DIR / "run_pipeline.py")


class TestMainErrorHandling:
    """Tests for run_pipeline.py main() error handling (AC #3, NFR9).

    Invokes the script as a subprocess so exit codes and stderr are real.
    These tests exit before any pipeline stage runs, so src/data/ is never touched.
    """

    def test_missing_csv_exits_nonzero(self, tmp_path):
        """Non-existent CSV path → non-zero exit with descriptive error."""
        missing = tmp_path / "nonexistent.csv"
        result = subprocess.run(
            [sys.executable, _RUNNER, str(missing)],
            capture_output=True,
            text=True,
        )
        assert result.returncode != 0
        assert "Error" in result.stderr
        assert "not found" in result.stderr

    def test_missing_columns_exits_nonzero(self, tmp_path):
        """CSV missing required columns → non-zero exit with descriptive error."""
        bad_csv = tmp_path / "bad.csv"
        bad_csv.write_text("metadata row\ncol_a,col_b\n1,2\n")
        result = subprocess.run(
            [sys.executable, _RUNNER, str(bad_csv)],
            capture_output=True,
            text=True,
        )
        assert result.returncode != 0
        assert "missing required columns" in result.stderr

    def test_empty_csv_exits_nonzero(self, tmp_path):
        """CSV with headers only (no data rows) → non-zero exit with descriptive error."""
        empty_csv = tmp_path / "empty.csv"
        empty_csv.write_text(
            "Last updated: 2026-01-01\n"
            "user_uuid,simple_status,scholarship,sent_at,decision_at,"
            "matriculating_year,school_name,gpa,lsat\n"
        )
        result = subprocess.run(
            [sys.executable, _RUNNER, str(empty_csv)],
            capture_output=True,
            text=True,
        )
        assert result.returncode != 0
        assert "no data" in result.stderr.lower()
