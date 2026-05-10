from __future__ import annotations

import json
from datetime import date
from pathlib import Path


PROJECT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)

SERVER_CAPACITY_GB = 12_000

MEMBERS = [
    {
        "name": "Alice Martin",
        "usageGb": 1430,
        "details": [
            {"label": "Raw microscopy data", "usageGb": 860},
            {"label": "Processed datasets", "usageGb": 340},
            {"label": "Analysis notebooks", "usageGb": 120},
            {"label": "Exports and figures", "usageGb": 110},
        ],
    },
    {
        "name": "Ben Carter",
        "usageGb": 980,
        "details": [
            {"label": "Raw behavior videos", "usageGb": 520},
            {"label": "Tracking outputs", "usageGb": 260},
            {"label": "Analysis notebooks", "usageGb": 80},
            {"label": "Shared reports", "usageGb": 120},
        ],
    },
    {
        "name": "Chloe Singh",
        "usageGb": 2210,
        "details": [
            {"label": "Raw imaging sessions", "usageGb": 1280},
            {"label": "Preprocessed stacks", "usageGb": 610},
            {"label": "Model outputs", "usageGb": 230},
            {"label": "Manuscript figures", "usageGb": 90},
        ],
    },
    {
        "name": "Daniel Rossi",
        "usageGb": 760,
        "details": [
            {"label": "Electrophysiology recordings", "usageGb": 420},
            {"label": "Spike sorting results", "usageGb": 180},
            {"label": "Analysis notebooks", "usageGb": 95},
            {"label": "Archived exports", "usageGb": 65},
        ],
    },
    {
        "name": "Eva Nguyen",
        "usageGb": 1325,
        "details": [
            {"label": "Raw calcium imaging", "usageGb": 730},
            {"label": "Processed traces", "usageGb": 310},
            {"label": "Model checkpoints", "usageGb": 210},
            {"label": "Figures and tables", "usageGb": 75},
        ],
    },
    {
        "name": "Felix Meyer",
        "usageGb": 540,
        "details": [
            {"label": "Raw pilot data", "usageGb": 260},
            {"label": "Processed data", "usageGb": 150},
            {"label": "Analysis scripts", "usageGb": 40},
            {"label": "Temporary exports", "usageGb": 90},
        ],
    },
]


def write_json() -> Path:
    payload = {
        "serverCapacityGb": SERVER_CAPACITY_GB,
        "lastUpdated": date.today().strftime("%B %d, %Y"),
        "members": MEMBERS,
    }

    json_path = DATA_DIR / "storage.json"

    with json_path.open("w", encoding="utf-8") as file:
        json.dump(payload, file, indent=2)
        file.write("\n")

    return json_path


def write_excel() -> Path | None:
    try:
        import pandas as pd
    except ImportError:
        return None

    rows = []

    for member in MEMBERS:
        for detail in member["details"]:
            rows.append(
                {
                    "name": member["name"],
                    "total_usage_gb": member["usageGb"],
                    "category": detail["label"],
                    "category_usage_gb": detail["usageGb"],
                }
            )

    excel_path = DATA_DIR / "storage_report.xlsx"
    pd.DataFrame(rows).to_excel(excel_path, index=False)

    return excel_path


def main() -> None:
    json_path = write_json()
    excel_path = write_excel()

    print(f"Saved website data to: {json_path}")

    if excel_path is None:
        print("Excel report skipped. Install pandas and openpyxl to create .xlsx.")
        print("Example: pip install pandas openpyxl")
    else:
        print(f"Saved Excel report to: {excel_path}")


if __name__ == "__main__":
    main()
