import csv
import io
from fastapi.responses import StreamingResponse

def generate_csv_response(filename: str, fieldnames: list[str], rows: list[dict]) -> StreamingResponse:
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

def parse_leads_csv(content: str) -> list[dict]:
    output = []
    reader = csv.DictReader(io.StringIO(content))
    for row in reader:
        output.append({
            "name": row.get("Name", "").strip(),
            "phone": row.get("Phone", "").strip(),
            "email": row.get("Email", "").strip() or None,
            "source": row.get("Source", "CSV Import").strip(),
            "status": row.get("Status", "New").strip(),
            "priority": row.get("Priority", "Medium").strip(),
            "budget_min": float(row["Budget Min"]) if row.get("Budget Min") and row["Budget Min"].replace('.', '', 1).isdigit() else None,
            "budget_max": float(row["Budget Max"]) if row.get("Budget Max") and row["Budget Max"].replace('.', '', 1).isdigit() else None,
            "preferred_location": row.get("Location", "").strip() or None,
            "preferred_configuration": row.get("Configuration", "").strip() or None,
            "tags": row.get("Tags", "").strip() or None
        })
    return output
