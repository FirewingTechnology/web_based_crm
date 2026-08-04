import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger("email_service")

# SMTP Credentials & Config (Can be configured via env)
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "firewingtechnologiesindia@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "xlswimkesmlnrlnq").replace(" ", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "REALVION Platform")


def send_email_smtp(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email via SMTP. Falls back to mock logger if SMTP password is not configured.
    """
    if not SMTP_PASSWORD:
        logger.info(f"[EMAIL SERVICE - SIMULATED LOG] To: {to_email} | Subject: '{subject}'")
        print(f"==================================================")
        print(f"📧 EMAIL SENT (SIMULATION): {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"==================================================")
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{EMAIL_FROM_NAME} <{SMTP_USER}>"
        msg["To"] = to_email

        part_html = MIMEText(html_content, "html")
        msg.attach(part_html)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        
        logger.info(f"Email successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False

def send_otp_email(to_email: str, otp_code: str) -> bool:
    subject = f"{otp_code} is your REALVION Verification Code"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #050505; color: #e2e8f0; margin: 0; padding: 40px; }}
        .card {{ max-width: 500px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
        .brand {{ font-size: 24px; font-weight: bold; color: #C8A45D; text-align: center; margin-bottom: 24px; letter-spacing: 2px; }}
        .code {{ font-size: 36px; font-weight: 800; color: #C8A45D; text-align: center; letter-spacing: 6px; padding: 16px; background: rgba(200, 164, 93, 0.1); border-radius: 8px; margin: 24px 0; }}
        .footer {{ font-size: 12px; color: #64748b; text-align: center; margin-top: 32px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">REALVION</div>
        <h2 style="text-align: center; color: #f8fafc;">Verify Your Email Address</h2>
        <p style="text-align: center; color: #94a3b8;">Use the verification code below to complete your registration:</p>
        <div class="code">{otp_code}</div>
        <p style="text-align: center; color: #64748b; font-size: 13px;">This code will expire in 10 minutes. Please do not share it with anyone.</p>
        <div class="footer">&copy; 2026 REALVION Platform. Enterprise Real Estate OS.</div>
      </div>
    </body>
    </html>
    """
    return send_email_smtp(to_email, subject, html_content)

def send_welcome_credentials_email(to_email: str, name: str, password: str, login_url: str, plan_name: str) -> bool:
    subject = f"Welcome to REALVION — Account Activated ({plan_name} Plan)"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #050505; color: #e2e8f0; margin: 0; padding: 40px; }}
        .card {{ max-width: 550px; margin: 0 auto; background: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 32px; }}
        .brand {{ font-size: 24px; font-weight: bold; color: #C8A45D; text-align: center; margin-bottom: 20px; }}
        .btn {{ display: block; width: 200px; margin: 24px auto; padding: 14px 24px; background: linear-gradient(135deg, #C8A45D, #E5C17C); color: #000; text-align: center; font-weight: bold; text-decoration: none; border-radius: 8px; }}
        .creds {{ background: #1e293b; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #C8A45D; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">REALVION</div>
        <h2 style="color: #f8fafc;">Welcome, {name}!</h2>
        <p>Your subscription to the <strong>REALVION {plan_name} Plan</strong> has been successfully activated.</p>
        <p>Here are your administrator access credentials:</p>
        <div class="creds">
          <p><strong>Portal URL:</strong> <a href="{login_url}" style="color: #C8A45D;">{login_url}</a></p>
          <p><strong>Username / Email:</strong> {to_email}</p>
          <p><strong>Password:</strong> {password}</p>
        </div>
        <a href="{login_url}" class="btn">Log In to Workspace</a>
        <p style="color: #64748b; font-size: 13px; text-align: center;">We recommend updating your password upon your first login.</p>
      </div>
    </body>
    </html>
    """
    return send_email_smtp(to_email, subject, html_content)
