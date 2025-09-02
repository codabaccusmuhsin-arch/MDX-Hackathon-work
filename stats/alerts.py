def check_alerts(df):
    alerts = []

    # Budget overrun
    budget_overrun = df[df['Expenses'] > df['Budget Allocation']]
    for idx, row in budget_overrun.iterrows():
        alerts.append(f"Budget overrun in {row['Department']} ({row['Month']}): Expenses ${row['Expenses']} > Budget ${row['Budget Allocation']}")

    # Revenue drop (example: 20% drop compared to previous month)
    df_sorted = df.sort_values(['Department', 'Month'])
    for dept, group in df_sorted.groupby('Department'):
        prev_rev = None
        for _, row in group.iterrows():
            if prev_rev is not None and row['Revenue'] < prev_rev * 0.8:
                alerts.append(f"Revenue drop in {dept} ({row['Month']}): ${row['Revenue']} from previous ${prev_rev}")
            prev_rev = row['Revenue']

    # High risk flag
    high_risk = df[df['Risk Flag'].str.lower() == 'high']
    for idx, row in high_risk.iterrows():
        alerts.append(f"High risk detected in {row['Department']} ({row['Month']})")

    return alerts
