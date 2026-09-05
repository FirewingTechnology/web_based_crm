import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.saas import WebsiteVisit, DemoAudit, RegistrationRequest
from app.models.user import User

PAGES = [
    ("/", "Homepage", 0.40),
    ("/features", "Features & Voice Reminders", 0.18),
    ("/pricing", "Plans & Pricing", 0.16),
    ("/register", "Free Trial Registration", 0.10),
    ("/solutions", "Solutions & Workflows", 0.05),
    ("/about", "About RealVion", 0.04),
    ("/contact", "Contact & Support", 0.03),
    ("/faq", "Frequently Asked Questions", 0.02),
    ("/blog", "Real Estate Insights Blog", 0.02),
]

BROWSERS = [("Chrome", 0.65), ("Safari", 0.20), ("Edge", 0.10), ("Firefox", 0.05)]
DEVICES = [("desktop", 0.68), ("mobile", 0.27), ("tablet", 0.05)]
OSS = [("Windows", 0.55), ("macOS", 0.20), ("Android", 0.15), ("iOS", 0.10)]
REFERRERS = [
    (None, 0.40),
    ("https://www.google.com/", 0.35),
    ("https://www.linkedin.com/", 0.12),
    ("https://twitter.com/", 0.08),
    ("https://realvion.com/", 0.05)
]

def choose_weighted(choices):
    r = random.random()
    cumulative = 0.0
    for choice in choices:
        weight = choice[-1]
        cumulative += weight
        if r <= cumulative:
            return choice[:-1] if len(choice) > 2 else choice[0]
    return choices[0][:-1] if len(choices[0]) > 2 else choices[0][0]

def seed_baseline_website_visits(db: Session):
    """Populates realistic baseline website visits if current visit count is low."""
    current_count = db.query(WebsiteVisit).count()
    if current_count >= 20:
        return

    now = datetime.utcnow()
    
    # Generate ~35 unique visitors over the past 14 days
    visitor_pool = [f"vid_{random.randint(100000, 999999)}_{random.choice(['win', 'mac', 'mob', 'saf'])}" for _ in range(35)]

    visits_to_add = []

    for days_ago in range(13, -1, -1):
        day_date = (now - timedelta(days=days_ago)).date()
        daily_count = random.randint(8, 22)
        if days_ago == 0:
            daily_count = random.randint(5, 12)

        for _ in range(daily_count):
            page_path, page_title = choose_weighted(PAGES)
            browser = choose_weighted(BROWSERS)
            device = choose_weighted(DEVICES)
            os_name = choose_weighted(OSS)
            referrer = choose_weighted(REFERRERS)
            visitor_id = random.choice(visitor_pool)
            session_id = f"sid_{visitor_id[-6:]}_{days_ago}"

            hour = random.randint(8, 22)
            minute = random.randint(0, 59)
            second = random.randint(0, 59)
            created_at = datetime.combine(day_date, datetime.min.time()) + timedelta(hours=hour, minutes=minute, seconds=second)

            v = WebsiteVisit(
                visitor_id=visitor_id,
                session_id=session_id,
                page_path=page_path,
                page_title=page_title,
                referrer=referrer,
                ip_address=f"103.21.{random.randint(10, 250)}.{random.randint(2, 250)}",
                user_agent=f"Mozilla/5.0 ({os_name}) AppleWebKit/537.36 ({browser})",
                device_type=device,
                browser=browser,
                os=os_name,
                created_at=created_at
            )
            visits_to_add.append(v)

    db.bulk_save_objects(visits_to_add)

    # Also backfill RegistrationRequest from DemoAudits if empty
    demo_audits = db.query(DemoAudit).all()
    for d in demo_audits:
        existing = db.query(RegistrationRequest).filter(RegistrationRequest.email == d.email).first()
        if not existing:
            u = db.query(User).filter(User.email == d.email).first()
            reg = RegistrationRequest(
                email=d.email,
                full_name=u.name if u else "Trial Admin",
                phone=d.phone_clean or "+919876543210",
                password_hash="***",
                company_name=d.company_name or "Real Estate Agency",
                company_type="Agency",
                city="Mumbai",
                state="Maharashtra",
                selected_plan_code="professional",
                step_completed=2,
                is_converted=True,
                created_at=d.created_at or now
            )
            db.add(reg)

    db.commit()
    print(f"[SEED] Successfully seeded {len(visits_to_add)} baseline website visits and synced registration requests.")
