import sqlite3
import json
from datetime import datetime

DATABASE = "database.db"


def get_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_database():
    conn = get_connection()

    conn.execute("""
        CREATE TABLE IF NOT EXISTS simulations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            strategy TEXT NOT NULL,
            allocation TEXT NOT NULL,
            request_matrix TEXT NOT NULL,
            available TEXT NOT NULL,
            result TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def save_simulation(
    strategy,
    allocation,
    request_matrix,
    available,
    result
):
    conn = get_connection()

    conn.execute("""
        INSERT INTO simulations
        (
            strategy,
            allocation,
            request_matrix,
            available,
            result,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        strategy,
        json.dumps(allocation),
        json.dumps(request_matrix),
        json.dumps(available),
        json.dumps(result),
        datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    ))

    conn.commit()
    conn.close()


def get_simulations():
    conn = get_connection()

    rows = conn.execute("""
        SELECT *
        FROM simulations
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    simulations = []

    for row in rows:
        simulations.append({
            "id": row["id"],
            "strategy": row["strategy"],
            "allocation": json.loads(row["allocation"]),
            "request_matrix": json.loads(row["request_matrix"]),
            "available": json.loads(row["available"]),
            "result": json.loads(row["result"]),
            "created_at": row["created_at"]
        })

    return simulations