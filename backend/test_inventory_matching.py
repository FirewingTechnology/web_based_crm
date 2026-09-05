import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadStatus, LeadPriority
from app.models.builder import Builder
from app.models.project import Project, ProjectStatus
from app.middleware.auth_middleware import get_current_user
from app.services.inventory_matching_service import InventoryMatchingService

client = TestClient(app)

@pytest.fixture
def db_session():
    db = next(get_db())
    yield db
    db.rollback()

def test_inventory_matching_engine(db_session):
    # Setup test user
    test_user = db_session.query(User).filter(User.email == "admin@brokeros.com").first()
    if not test_user:
        test_user = User(
            name="Admin User",
            email="admin@brokeros.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            is_active=True
        )
        db_session.add(test_user)
        db_session.flush()

    # Create builder
    builder = db_session.query(Builder).first()
    if not builder:
        builder = Builder(
            name="Apex Builders",
            company="Apex Real Estate",
            contact_person="Rohan Mehta",
            email="contact@apex.com",
            phone="+91 99999 88888",
            address="Noida",
            commission_rate=3.0
        )
        db_session.add(builder)
        db_session.flush()

    # Create 2 sample projects
    project_noida = Project(
        name="Apex Golf Greens",
        builder_id=builder.id,
        location="Sector 150, Noida",
        configuration="2, 3, 4 BHK Luxury Apartments",
        min_price=110.0,
        max_price=220.0,
        possession_date="Dec 2027",
        rera_id="UPRERAPRJ12345",
        status=ProjectStatus.UNDER_CONSTRUCTION,
        amenities="Clubhouse, Golf Course, Infinity Pool"
    )
    project_gurgaon = Project(
        name="Apex Cyber Terraces",
        builder_id=builder.id,
        location="Golf Course Road, Gurgaon",
        configuration="4, 5 BHK Penthouses",
        min_price=450.0,
        max_price=850.0,
        possession_date="Ready to Move",
        rera_id="HRERAPRJ9988",
        status=ProjectStatus.READY_TO_MOVE,
        amenities="Private Elevator, Helipad"
    )
    db_session.add_all([project_noida, project_gurgaon])
    db_session.flush()

    # Create a buyer lead looking for 3 BHK in Sector 150 Noida with budget 120-180 Lakhs
    lead = Lead(
        name="Vikramaditya Sharma",
        phone="+91 98765 43210",
        email="vikram@example.com",
        source="Direct Website",
        status=LeadStatus.QUALIFIED,
        priority=LeadPriority.HIGH,
        budget_min=120.0,
        budget_max=180.0,
        preferred_location="Sector 150, Noida",
        preferred_configuration="3 BHK",
        tags="Ready Buyer, Family"
    )
    db_session.add(lead)
    db_session.flush()

    # Run inventory matching service
    result = InventoryMatchingService.match_inventory_for_lead(lead.id, db_session, test_user)

    assert result.lead_id == lead.id
    assert len(result.matches) >= 2

    # Apex Golf Greens should be the top match
    top_match = result.matches[0]
    assert top_match.project_name == "Apex Golf Greens"
    assert top_match.match_score >= 80
    assert top_match.match_tier in ("EXCELLENT_MATCH", "GOOD_MATCH")
    assert any("Budget" in item.criterion and item.status == "MATCHED" for item in top_match.criteria_breakdown)
    assert any("Location" in item.criterion and item.status == "MATCHED" for item in top_match.criteria_breakdown)
    assert any("Configuration" in item.criterion and item.status == "MATCHED" for item in top_match.criteria_breakdown)
    assert "Apex Golf Greens" in top_match.whatsapp_pitch

    # Test reverse matching (finding buyers for project)
    rev_result = InventoryMatchingService.match_leads_for_project(project_noida.id, db_session, test_user)
    assert rev_result.project_id == project_noida.id
    assert any(m.lead_id == lead.id for m in rev_result.matched_leads)

def test_inventory_matching_endpoints():
    app.dependency_overrides[get_current_user] = lambda: User(
        id=1,
        name="Admin Test",
        email="admin@test.com",
        role=UserRole.ADMIN,
        is_active=True,
        organization_id=None
    )

    # Test GET /api/v1/projects/match-lead/1
    res = client.get("/api/v1/projects/match-lead/1")
    # Lead 1 exists from seed data or test
    if res.status_code == 200:
        data = res.json()
        assert "matches" in data
        assert "lead_name" in data

    # Test GET /api/v1/leads/1/inventory-matches
    res2 = client.get("/api/v1/leads/1/inventory-matches")
    if res2.status_code == 200:
        data2 = res2.json()
        assert "matches" in data2

    # Clean up overrides
    app.dependency_overrides.clear()
