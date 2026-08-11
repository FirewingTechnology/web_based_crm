from datetime import datetime, timezone, timedelta
from app.database import SessionLocal, engine, Base
from app.models import (
    User, UserRole, Builder, Project, ProjectStatus, Lead, LeadNote, LeadStatusHistory,
    LeadStatus, LeadPriority, Followup, FollowupType, FollowupStatus, BrokerProfile,
    SalesTarget, Booking, BookingStatus, Commission, PayoutStatus, ActivityLog, Notification,
    Organization, Subscription
)
from app.utils.security import get_password_hash

def seed_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        print("[SEED] Starting database seeding for REALVION...")

        # 0. Create Seed Organization & Subscription
        seed_org = Organization(
            name="REALVION Corporate HQ",
            slug="realvion-corporate-hq",
            company_type="Real Estate Advisory",
            is_active=True
        )
        db.add(seed_org)
        db.commit()
        db.refresh(seed_org)

        seed_sub = Subscription(
            organization_id=seed_org.id,
            status="Active",
            start_date=datetime.now(timezone.utc),
            end_date=datetime.now(timezone.utc) + timedelta(days=365),
            auto_renew=True
        )
        db.add(seed_sub)
        db.commit()

        # 1. Create Users
        superadmin_user = User(
            name="Platform Owner",
            email="superadmin@realvion.com",
            hashed_password=get_password_hash("SuperAdmin@123"),
            role=UserRole.SUPERADMIN,
            phone="+91 99999 88888",
            firm_name="REALVION Master Control",
            is_active=True
        )
        admin_user = User(
            organization_id=seed_org.id,
            name="Aman Sharma",
            email="admin@brokeros.com",
            hashed_password=get_password_hash("Admin@123"),
            role=UserRole.ADMIN,
            phone="+91 98100 11223",
            firm_name="BrokerOS Corporate HQ",
            is_active=True
        )

        manager_user = User(
            organization_id=seed_org.id,
            name="Priya Patel",
            email="manager@brokeros.com",
            hashed_password=get_password_hash("Manager@123"),
            role=UserRole.MANAGER,
            phone="+91 98200 22334",
            firm_name="BrokerOS Corporate HQ",
            is_active=True
        )
        sales_user = User(
            organization_id=seed_org.id,
            name="Rohan Gupta",
            email="sales@brokeros.com",
            hashed_password=get_password_hash("Sales@123"),
            role=UserRole.SALES_EXECUTIVE,
            phone="+91 98300 33445",
            firm_name="BrokerOS Corporate HQ",
            is_active=True
        )
        sales_user2 = User(
            organization_id=seed_org.id,
            name="Neha Singh",
            email="rahul@brokeros.com",
            hashed_password=get_password_hash("Sales@123"),
            role=UserRole.SALES_EXECUTIVE,
            phone="+91 98400 44556",
            firm_name="BrokerOS Corporate HQ",
            is_active=True
        )
        broker_org = Organization(
            name="Apex Realty Advisors",
            slug="apex-realty-advisors",
            company_type="Brokerage Firm",
            is_active=True
        )
        db.add(broker_org)
        db.commit()
        db.refresh(broker_org)

        broker_user = User(
            organization_id=broker_org.id,
            name="Karan Malhotra",
            email="broker@brokeros.com",
            hashed_password=get_password_hash("Broker@123"),
            role=UserRole.BROKER,
            phone="+91 98500 55667",
            firm_name="Apex Realty Advisors",
            is_active=True
        )

        db.add_all([superadmin_user, admin_user, manager_user, sales_user, sales_user2, broker_user])
        db.commit()

        for u in [superadmin_user, admin_user, manager_user, sales_user, sales_user2, broker_user]:
            db.refresh(u)


        # 2. Broker Profile
        broker_profile = BrokerProfile(
            user_id=broker_user.id,
            firm_name="Apex Realty Advisors",
            contact_person="Karan Malhotra",
            phone="+91 98500 55667",
            email="broker@brokeros.com",
            address="Suite 402, Signature Towers, Gurugram",
            commission_rate=1.5,
            total_deals=1,
            total_revenue_generated=15000000.0,
            performance_score=4.8
        )
        db.add(broker_profile)
        db.commit()
        db.refresh(broker_profile)

        # 3. Builders
        b1 = Builder(
            name="Godrej Properties",
            company="Godrej Properties Ltd",
            contact_person="Vikram Ahuja",
            phone="+91 98765 43210",
            email="vikram@godrejproperties.com",
            address="Godrej One, Vikhroli East, Mumbai",
            commission_rate=3.5,
            notes="Tier 1 Developer. Prompt payouts within 30 days of booking."
        )
        b2 = Builder(
            name="Lodha Group",
            company="Macrotech Developers",
            contact_person="Sunita Sharma",
            phone="+91 98123 45678",
            email="sunita@lodhagroup.com",
            address="Lodha Excelus, NM Joshi Marg, Mumbai",
            commission_rate=4.0,
            notes="Special incentive scheme for 3BHK and 4BHK luxury units."
        )
        b3 = Builder(
            name="DLF Limited",
            company="DLF Home Developers",
            contact_person="Rajesh Verma",
            phone="+91 97111 22334",
            email="verma-rajesh@dlf.in",
            address="DLF Shopping Mall, Arjun Nagar, Gurugram",
            commission_rate=3.0,
            notes="High demand NRI preferred projects in NCR region."
        )
        b4 = Builder(
            name="Prestige Group",
            company="Prestige Estates Projects Ltd",
            contact_person="Ananya Rao",
            phone="+91 99000 11223",
            email="ananya@prestigeconstructions.com",
            address="Prestige Falcon Towers, MG Road, Bengaluru",
            commission_rate=3.5,
            notes="Strong presence in South India & upcoming NCR expansion."
        )
        db.add_all([b1, b2, b3, b4])
        db.commit()
        for b in [b1, b2, b3, b4]:
            db.refresh(b)

        # 4. Projects
        p1 = Project(
            name="Godrej Woods",
            builder_id=b1.id,
            location="Sector 43, Noida",
            configuration="2, 3 & 4 BHK Apartments",
            min_price=125.0, # 1.25 Cr
            max_price=280.0, # 2.80 Cr
            possession_date="Dec 2027",
            rera_id="UPRERAPRJ7712",
            status=ProjectStatus.UNDER_CONSTRUCTION,
            amenities="Forest Trail, Swimming Pool, Clubhouse, EV Charging, Tennis Court",
            brochure_url="https://example.com/brochures/godrej_woods.pdf",
            description="Luxury urban forest residence in the heart of Noida."
        )
        p2 = Project(
            name="Lodha Trump Tower",
            builder_id=b2.id,
            location="Lower Parel, Mumbai",
            configuration="3 & 4 BHK Super Luxury Residences",
            min_price=450.0, # 4.50 Cr
            max_price=890.0, # 8.90 Cr
            possession_date="Ready to Move",
            rera_id="P51900001339",
            status=ProjectStatus.READY_TO_MOVE,
            amenities="Private Jet Concierge, Infinity Pool, Spa, Private Elevator",
            brochure_url="https://example.com/brochures/trump_tower.pdf",
            description="Iconic 75-storey golden curtain glass tower in South Mumbai."
        )
        p3 = Project(
            name="DLF One Midtown",
            builder_id=b3.id,
            location="Moti Nagar, Central Delhi",
            configuration="2, 3 & 4 BHK Premium Condos",
            min_price=210.0, # 2.10 Cr
            max_price=450.0,
            possession_date="June 2026",
            rera_id="DLRERA2021P0007",
            status=ProjectStatus.UNDER_CONSTRUCTION,
            amenities="Green Belt, Temperature Controlled Pool, Multi-cuisine Restaurant",
            description="Ultra luxury living surrounded by 128 acres of greenery in Delhi."
        )
        p4 = Project(
            name="Prestige Falcon City",
            builder_id=b4.id,
            location="Kanakapura Road, Bangalore",
            configuration="2 & 3 BHK High-rise Flats",
            min_price=95.0,
            max_price=165.0,
            possession_date="Ready to Move",
            rera_id="PRM/KA/RERA/1251/310/PR/170913/000114",
            status=ProjectStatus.READY_TO_MOVE,
            amenities="Forum Mall, Metro Connectivity, Cricket Pitch, Amphitheatre",
            description="Integrated township with integrated shopping mall & metro station."
        )
        db.add_all([p1, p2, p3, p4])
        db.commit()
        for p in [p1, p2, p3, p4]:
            db.refresh(p)

        # 5. Leads
        now = datetime.now(timezone.utc)
        l1 = Lead(
            name="Amitabh Mehra",
            phone="+91 98111 99887",
            email="amitabh.m@gmail.com",
            source="99acres",
            status=LeadStatus.SITE_VISIT,
            priority=LeadPriority.HIGH,
            budget_min=150.0,
            budget_max=250.0,
            preferred_location="Sector 43, Noida",
            preferred_configuration="3 BHK",
            assigned_to_id=sales_user.id,
            created_by_id=admin_user.id,
            tags="VIP, NRI, High Intent"
        )
        l2 = Lead(
            name="Siddharth Kapoor",
            phone="+91 97222 88776",
            email="sid.kapoor@techcorp.io",
            source="Referral",
            status=LeadStatus.BOOKED,
            priority=LeadPriority.URGENT,
            budget_min=120.0,
            budget_max=160.0,
            preferred_location="Sector 43, Noida",
            preferred_configuration="3 BHK",
            assigned_to_id=sales_user.id,
            created_by_id=sales_user.id,
            tags="Ready Buyer, Instant Token"
        )
        l3 = Lead(
            name="Dr. Suniti Deshmukh",
            phone="+91 99333 77665",
            email="suniti.d@hospital.org",
            source="Facebook Ads",
            status=LeadStatus.NEGOTIATION,
            priority=LeadPriority.HIGH,
            budget_min=400.0,
            budget_max=600.0,
            preferred_location="Lower Parel, Mumbai",
            preferred_configuration="3 BHK Super Luxury",
            assigned_to_id=sales_user2.id,
            created_by_id=manager_user.id,
            tags="Doctor, Cash Buyer"
        )
        l4 = Lead(
            name="Rajiv Singhania",
            phone="+91 98444 66554",
            email="singhania.r@textiles.com",
            source="Direct Walk-in",
            status=LeadStatus.QUALIFIED,
            priority=LeadPriority.MEDIUM,
            budget_min=200.0,
            budget_max=350.0,
            preferred_location="Central Delhi",
            preferred_configuration="4 BHK",
            assigned_to_id=sales_user.id,
            created_by_id=admin_user.id,
            tags="Investor"
        )
        l5 = Lead(
            name="Vikramaditya Rao",
            phone="+91 97555 55443",
            email="vikram.rao@fintech.co",
            source="Website",
            status=LeadStatus.NEW,
            priority=LeadPriority.MEDIUM,
            budget_min=90.0,
            budget_max=140.0,
            preferred_location="Bangalore South",
            preferred_configuration="2 BHK",
            assigned_to_id=sales_user2.id,
            created_by_id=sales_user2.id,
            tags="First Time Buyer"
        )

        db.add_all([l1, l2, l3, l4, l5])
        db.commit()
        for l in [l1, l2, l3, l4, l5]:
            db.refresh(l)

        # 6. Lead Notes & Status History
        db.add_all([
            LeadNote(lead_id=l1.id, created_by_id=sales_user.id, note_text="Looking for East facing Vastu compliant unit on 10th+ floor."),
            LeadNote(lead_id=l2.id, created_by_id=sales_user.id, note_text="Transferred token payment of ₹5,00,000 via RTGS."),
            LeadStatusHistory(lead_id=l1.id, changed_by_id=sales_user.id, old_status="New", new_status="Site Visit Scheduled", remarks="Chauffeur site visit confirmed for Sunday 11 AM."),
            LeadStatusHistory(lead_id=l2.id, changed_by_id=sales_user.id, old_status="Negotiation", new_status="Booked", remarks="Deal closed at ₹1.50 Cr flat price.")
        ])
        db.commit()

        # 7. Followups (Today, Pending, Overdue, Completed)
        f1 = Followup(
            lead_id=l1.id,
            assigned_to_id=sales_user.id,
            type=FollowupType.SITE_VISIT,
            status=FollowupStatus.PENDING,
            title="Chauffeur pickup site visit to Godrej Woods",
            scheduled_at=now + timedelta(hours=3),
            notes="Driver Ramesh assigned. Pickup from Radisson Blu Noida."
        )
        f2 = Followup(
            lead_id=l3.id,
            assigned_to_id=sales_user2.id,
            type=FollowupType.CALL,
            status=FollowupStatus.OVERDUE,
            title="Discuss 10:90 subvention scheme details for Lodha Trump Tower",
            scheduled_at=now - timedelta(days=1),
            notes="Client requested updated price sheet with GST breakdown."
        )
        f3 = Followup(
            lead_id=l4.id,
            assigned_to_id=sales_user.id,
            type=FollowupType.WHATSAPP,
            status=FollowupStatus.COMPLETED,
            title="Send floor plans & RERA allotment document PDF",
            scheduled_at=now - timedelta(hours=5),
            completed_at=now - timedelta(hours=4),
            notes="Brochure sent via WhatsApp Business.",
            outcome="Client acknowledged and requested face-to-face meeting."
        )

        db.add_all([f1, f2, f3])
        db.commit()

        # 8. Bookings & Commission
        bk1 = Booking(
            booking_number="BK-2026-1001",
            lead_id=l2.id,
            project_id=p1.id,
            builder_id=b1.id,
            assigned_executive_id=sales_user.id,
            broker_id=broker_profile.id,
            unit_number="Tower B - 1402",
            booking_amount=500000.0, # 5 Lakhs token
            total_deal_value=15000000.0, # 1.5 Cr
            booking_date=now - timedelta(days=2),
            status=BookingStatus.CONFIRMED,
            notes="Booking confirmed under Independence Month Scheme."
        )
        db.add(bk1)
        db.commit()
        db.refresh(bk1)

        c1 = Commission(
            booking_id=bk1.id,
            builder_commission_rate=3.5,
            builder_commission_amount=525000.0, # 3.5% of 1.5 Cr = 5.25 L
            executive_commission_rate=0.5,
            executive_commission_amount=75000.0, # 0.5% = 75k
            broker_commission_rate=1.5,
            broker_commission_amount=225000.0, # 1.5% = 2.25 L
            company_margin_amount=225000.0, # Remaining 2.25 L
            payout_status=PayoutStatus.PENDING,
            remarks="Invoice #INV-2026-881 raised to Godrej Properties."
        )
        db.add(c1)
        db.commit()

        # 9. Sales Targets for Current Month
        curr_month = now.strftime("%Y-%m")
        st1 = SalesTarget(
            user_id=sales_user.id,
            month_year=curr_month,
            target_amount=300.0, # 3 Crores target
            achieved_amount=150.0, # 1.5 Crores achieved
            target_bookings=4,
            achieved_bookings=1
        )
        st2 = SalesTarget(
            user_id=sales_user2.id,
            month_year=curr_month,
            target_amount=250.0, # 2.5 Crores target
            achieved_amount=0.0,
            target_bookings=3,
            achieved_bookings=0
        )
        db.add_all([st1, st2])
        db.commit()

        # 10. Initial Activity Logs & System Notifications
        db.add(ActivityLog(
            user_id=admin_user.id,
            user_name=admin_user.name,
            action="SYSTEM_INIT",
            module="System",
            details="BrokerOS Lite database initialized with enterprise master records."
        ))
        db.add(Notification(
            user_id=sales_user.id,
            title="New High-Priority Lead Assigned",
            message="Lead 'Amitabh Mehra' looking for 3 BHK in Noida assigned to you.",
            type="info"
        ))
        db.add(Notification(
            user_id=admin_user.id,
            title="New Booking Token Received",
            message="Booking BK-2026-1001 for ₹1.50 Cr created by Rohan Gupta.",
            type="success"
        ))
        db.commit()

        print("[SEED] Database seeding completed successfully!")
        print("--------------------------------------------------")
        print("Default Credentials:")
        print("Admin:            admin@brokeros.com    / Admin@123")
        print("Manager:          manager@brokeros.com  / Manager@123")
        print("Sales Executive:  sales@brokeros.com    / Sales@123")
        print("Broker:           broker@brokeros.com   / Broker@123")
        print("--------------------------------------------------")

    except Exception as e:
        db.rollback()
        print(f"[SEED ERROR] Error seeding database: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
