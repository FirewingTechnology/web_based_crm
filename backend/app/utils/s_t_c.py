import sqlite3
import csv
import os

def export_sqlite_to_csv(db_path: str, output_dir: str = "csv_export"):
    """
    Exports all tables from an SQLite database into separate CSV files.
    """
    if not os.path.exists(db_path):
        print(f"Error: Database file '{db_path}' not found.")
        return

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Connect to SQLite database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Get list of all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
    tables = [row[0] for row in cursor.fetchall()]

    print(f"Found {len(tables)} tables: {', '.join(tables)}\n")

    for table in tables:
        csv_file_path = os.path.join(output_dir, f"{table}.csv")

        # Fetch column names
        cursor.execute(f"PRAGMA table_info({table});")
        headers = [column[1] for column in cursor.fetchall()]

        # Fetch all rows
        cursor.execute(f"SELECT * FROM {table};")
        rows = cursor.fetchall()

        # Write to CSV file
        with open(csv_file_path, mode="w", newline="", encoding="utf-8") as file:
            writer = csv.writer(file)
            writer.writerow(headers)  # Write column headers
            writer.writerows(rows)     # Write data rows

        print(f"✅ Exported '{table}' ({len(rows)} rows) -> {csv_file_path}")

    conn.close()
    print(f"\n🎉 All tables successfully exported to folder: '{output_dir}/'")

if __name__ == "__main__":
    # Path to your SQLite DB file (e.g., brokeros.db)
    DB_FILE = "brokeros.db"
    
    export_sqlite_to_csv(DB_FILE)
