import os
import pickle
import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, 'datasets', 'my_data.xlsx')
PICKLE_PATH = os.path.join(BASE_DIR, 'datasets', 'embeddings.pkl')

# Load precomputed embeddings
with open(PICKLE_PATH, 'rb') as f:
    dataset_text, dataset_embeddings = pickle.load(f)

# Load embedding model
model = SentenceTransformer('all-MiniLM-L6-v2')

def load_dataset(path=DATASET_PATH):
    df = pd.read_excel(path)
    return df

def query_ai(query_text, top_n=5):
    query_text_lower = query_text.lower()

    # Load dataset fresh for numeric queries
    df = pd.read_excel(DATASET_PATH)

    # Convert numeric columns safely
    numeric_cols = ["Revenue", "Expenses", "Profit/Loss", "Budget Allocation", "Forecasted Growth %"]
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce")  # convert strings/N/A → NaN

    # Helper to safely get row with max/min ignoring NaNs
    def safe_idxmax(column):
        if column in df.columns and df[column].dropna().any():
            return df[column].idxmax()
        return None

    def safe_idxmin(column):
        if column in df.columns and df[column].dropna().any():
            return df[column].idxmin()
        return None

    # --- Numeric queries ---
    if "highest profit" in query_text_lower or "max profit" in query_text_lower:
        idx = safe_idxmax("Profit/Loss")
        if idx is not None:
            row = df.loc[idx].to_dict()
            return (
                f"The highest profit is {row['Profit/Loss']:,} in the {row['Department']} "
                f"department for {row['Month']}. Revenue was {row['Revenue']:,}, "
                f"expenses were {row['Expenses']:,}, and risk is {row['Risk Flag']}."
            )
        return "No valid profit data found."

    if "lowest profit" in query_text_lower or "highest loss" in query_text_lower:
        idx = safe_idxmin("Profit/Loss")
        if idx is not None:
            row = df.loc[idx].to_dict()
            return (
                f"The highest loss is {row['Profit/Loss']:,} in the {row['Department']} "
                f"department for {row['Month']}. Revenue was {row['Revenue']:,}, "
                f"expenses were {row['Expenses']:,}, and risk is {row['Risk Flag']}."
            )
        return "No valid profit data found."

    if "highest revenue" in query_text_lower:
        idx = safe_idxmax("Revenue")
        if idx is not None:
            row = df.loc[idx].to_dict()
            return (
                f"The highest revenue is {row['Revenue']:,} in the {row['Department']} "
                f"department for {row['Month']}. Expenses were {row['Expenses']:,}, "
                f"profit/loss was {row['Profit/Loss']:,}, and risk is {row['Risk Flag']}."
            )
        return "No valid revenue data found."

    if "lowest revenue" in query_text_lower:
        idx = safe_idxmin("Revenue")
        if idx is not None:
            row = df.loc[idx].to_dict()
            return (
                f"The lowest revenue is {row['Revenue']:,} in the {row['Department']} "
                f"department for {row['Month']}. Expenses were {row['Expenses']:,}, "
                f"profit/loss was {row['Profit/Loss']:,}, and risk is {row['Risk Flag']}."
            )
        return "No valid revenue data found."

    if "highest expenses" in query_text_lower:
        idx = safe_idxmax("Expenses")
        if idx is not None:
            row = df.loc[idx].to_dict()
            return (
                f"The highest expenses are {row['Expenses']:,} in the {row['Department']} "
                f"department for {row['Month']}. Revenue was {row['Revenue']:,}, "
                f"profit/loss was {row['Profit/Loss']:,}, and risk is {row['Risk Flag']}."
            )
        return "No valid expenses data found."

    if "lowest expenses" in query_text_lower:
        idx = safe_idxmin("Expenses")
        if idx is not None:
            row = df.loc[idx].to_dict()
            return (
                f"The lowest expenses are {row['Expenses']:,} in the {row['Department']} "
                f"department for {row['Month']}. Revenue was {row['Revenue']:,}, "
                f"profit/loss was {row['Profit/Loss']:,}, and risk is {row['Risk Flag']}."
            )
        return "No valid expenses data found."

    if "risk" in query_text_lower:
        risks = df["Risk Flag"].dropna().unique().tolist()
        return f"The risk levels in the dataset are: {', '.join(risks)}."

    # --- Forecast / revenue prediction ---
    # --- Revenue Forecast for a specific department ---
    if "predict revenue" in query_text_lower:
    # Try to extract department from the query
        department = None
        for dept in df["Department"].dropna().unique():
            if dept.lower() in query_text_lower:
                department = dept
                break
        if department:
            dept_data = df[df["Department"] == department].sort_values("Month")
            if not dept_data.empty:
                last_row = dept_data.iloc[-1]
                predicted = last_row["Revenue"] * (1 + (last_row.get("Forecasted Growth %", 0) / 100))
                return (
                    f"Predicted revenue for {department} next month is ${predicted:,.0f} "
                    f"(based on last known revenue ${last_row['Revenue']:,} and "
                    f"forecasted growth {last_row.get('Forecasted Growth %', 0)}%)."
                )
            return f"No revenue data available for {department}."
        else:
            return "Please specify a valid department to predict revenue."


    # --- Default semantic similarity search ---
    query_embedding = model.encode([query_text])
    similarities = np.dot(dataset_embeddings, query_embedding.T).flatten()
    top_indices = similarities.argsort()[-top_n:][::-1]
    results = [dataset_text[i] for i in top_indices]
    return "Top relevant entries: " + "; ".join(results[:top_n])




def check_alerts(df):
    alerts = []

    # Budget overrun (High)
    budget_overrun = df[df['Expenses'] > df['Budget Allocation']]
    for idx, row in budget_overrun.iterrows():
        alerts.append({
            'message': f"Budget overrun in {row['Department']} ({row['Month']}): Expenses ${row['Expenses']} > Budget ${row['Budget Allocation']}",
            'severity': 'high'
        })

    # Revenue drop (Medium)
    df_sorted = df.sort_values(['Department', 'Month'])
    for dept, group in df_sorted.groupby('Department'):
        prev_rev = None
        for _, row in group.iterrows():
            if prev_rev is not None and row['Revenue'] < prev_rev * 0.8:
                alerts.append({
                    'message': f"Revenue drop in {dept} ({row['Month']}): ${row['Revenue']} from previous ${prev_rev}",
                    'severity': 'medium'
                })
            prev_rev = row['Revenue']

    # High risk flag (High)
    high_risk = df[df['Risk Flag'].str.lower() == 'high']
    for idx, row in high_risk.iterrows():
        alerts.append({
            'message': f"High risk detected in {row['Department']} ({row['Month']})",
            'severity': 'high'
        })

    return alerts
