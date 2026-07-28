import pandas as pd
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "AM Wise Dump.xlsx"

df = pd.read_excel(DATA_FILE)

def get_all_data():
    return df