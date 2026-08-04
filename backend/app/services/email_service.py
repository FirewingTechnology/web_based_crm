import os
import smtplib
import ssl
import socket
import logging
import json
import base64
import urllib.request
import urllib.error
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger("email_service")

# Force socket to resolve IPv4 addresses to prevent Linux container IPv6 "Network is unreachable" errors
_orig_getaddrinfo = socket.getaddrinfo
def _ipv4_only_getaddrinfo(*args, **kwargs):
    responses = _orig_getaddrinfo(*args, **kwargs)
    ipv4_responses = [r for r in responses if r[0] == socket.AF_INET]
    return ipv4_responses if ipv4_responses else responses
socket.getaddrinfo = _ipv4_only_getaddrinfo

# SMTP & HTTP API Credentials & Config
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_USER = os.getenv("SMTP_USER", "firewingtechnologiesindia@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "xlswimkesmlnrlnq").replace(" ", "")
EMAIL_FROM_NAME = os.getenv("EMAIL_FROM_NAME", "REALVION Platform")

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
MAILJET_API_KEY = os.getenv("MAILJET_API_KEY", "")
MAILJET_SECRET_KEY = os.getenv("MAILJET_SECRET_KEY", "")

CUSTOM_USER_AGENT = "REALVION-Platform/1.0 (Mozilla/5.0)"

def send_email_http_mailjet(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via Mailjet HTTP API (Port 443 - 6,000 Free Emails/Month, 100% Free)"""
    if not MAILJET_API_KEY or not MAILJET_SECRET_KEY:
        return False
    try:
        url = "https://api.mailjet.com/v3.1/send"
        auth_str = base64.b64encode(f"{MAILJET_API_KEY}:{MAILJET_SECRET_KEY}".encode("utf-8")).decode("utf-8")
        headers = {
            "Authorization": f"Basic {auth_str}",
            "Content-Type": "application/json",
            "User-Agent": CUSTOM_USER_AGENT
        }
        payload = {
            "Messages": [
                {
                    "From": {"Email": SMTP_USER, "Name": EMAIL_FROM_NAME},
                    "To": [{"Email": to_email}],
                    "Subject": subject,
                    "HTMLPart": html_content
                }
            ]
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status in [200, 201, 202]:
                logger.info(f"Email successfully delivered to {to_email} via Mailjet HTTP API")
                print(f"[MAILJET SUCCESS] Delivered to {to_email} via HTTP API")
                return True
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode('utf-8', errors='ignore')
        logger.error(f"Mailjet HTTP API failed ({http_err.code}): {err_body}")
        print(f"[MAILJET ERROR {http_err.code}] {err_body}")
    except Exception as e:
        logger.error(f"Mailjet HTTP API failed: {e}")
    return False

def send_email_http_resend(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via Resend HTTP API (Port 443 - Never Blocked by Render)"""
    if not RESEND_API_KEY:
        return False
    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
            "User-Agent": CUSTOM_USER_AGENT
        }
        payload = {
            "from": f"REALVION Platform <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status in [200, 201, 202]:
                logger.info(f"Email successfully delivered to {to_email} via Resend HTTP API")
                print(f"[RESEND SUCCESS] Delivered to {to_email} via HTTP API")
                return True
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode('utf-8', errors='ignore')
        logger.error(f"Resend HTTP API failed ({http_err.code}): {err_body}")
        print(f"[RESEND ERROR {http_err.code}] {err_body}")
    except Exception as e:
        logger.error(f"Resend HTTP API failed: {e}")
    return False

def send_email_http_brevo(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via Brevo HTTP API (Port 443 - Never Blocked by Render)"""
    if not BREVO_API_KEY:
        return False
    try:
        url = "https://api.brevo.com/v3/smtp/email"
        headers = {
            "api-key": BREVO_API_KEY,
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": CUSTOM_USER_AGENT
        }
        payload = {
            "sender": {"name": EMAIL_FROM_NAME, "email": SMTP_USER},
            "to": [{"email": to_email}],
            "subject": subject,
            "htmlContent": html_content
        }
        req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=8) as response:
            if response.status in [200, 201, 202]:
                logger.info(f"Email successfully delivered to {to_email} via Brevo HTTP API")
                print(f"[BREVO SUCCESS] Delivered to {to_email} via HTTP API")
                return True
    except urllib.error.HTTPError as http_err:
        err_body = http_err.read().decode('utf-8', errors='ignore')
        logger.error(f"Brevo HTTP API failed ({http_err.code}): {err_body}")
        print(f"[BREVO ERROR {http_err.code}] {err_body}")
    except Exception as e:
        logger.error(f"Brevo HTTP API failed: {e}")
    return False

def send_email_smtp(to_email: str, subject: str, html_content: str) -> bool:
    """
    Send an email via HTTP REST API or fallback to SMTP socket.
    Prioritizes HTTP APIs (Port 443) to bypass cloud container firewall restrictions.
    """
    # 1. Try Mailjet HTTP API if configured (6,000 Free Emails/Month)
    if MAILJET_API_KEY and MAILJET_SECRET_KEY and send_email_http_mailjet(to_email, subject, html_content):
        return True

    # 2. Try Resend HTTP API if configured
    if RESEND_API_KEY and send_email_http_resend(to_email, subject, html_content):
        return True

    # 3. Try Brevo HTTP API if configured
    if BREVO_API_KEY and send_email_http_brevo(to_email, subject, html_content):
        return True

    # 4. Fallback to raw SMTP socket connection (Fast 4-second timeout)
    if not SMTP_PASSWORD:
        logger.info(f"[EMAIL SERVICE - SIMULATED LOG] To: {to_email} | Subject: '{subject}'")
        print(f"==================================================")
        print(f"📧 EMAIL SENT (SIMULATION): {to_email}")
        print(f"SUBJECT: {subject}")
        print(f"==================================================")
        return True

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{EMAIL_FROM_NAME} <{SMTP_USER}>"
    msg["To"] = to_email
    part_html = MIMEText(html_content, "html")
    msg.attach(part_html)

    # Method A: Try Port 465 (SSL)
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, 465, context=context, timeout=4) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"Email successfully sent to {to_email} via SSL:465")
        print(f"[EMAIL SUCCESS] Delivered to {to_email} via Port 465 SSL")
        return True
    except Exception as ssl_err:
        logger.warning(f"Port 465 SSL socket connection timed out: {ssl_err}")

    # Method B: Try Port 587 (TLS)
    try:
        with smtplib.SMTP(SMTP_HOST, 587, timeout=4) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"Email successfully sent to {to_email} via TLS:587")
        print(f"[EMAIL SUCCESS] Delivered to {to_email} via Port 587 TLS")
        return True
    except Exception as tls_err:
        logger.error(f"Failed to send email to {to_email} via raw SMTP socket: {tls_err}")
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
        <p style="text-align: center; color: #64748b; font-size: 13px;">This code will expire in 15 minutes. Please do not share it with anyone.</p>
        <div class="footer">&copy; 2026 REALVION Platform. Enterprise Real Estate OS.</div>
      </div>
    </body>
    </html>
    """
    return send_email_smtp(to_email, subject, html_content)

def send_welcome_credentials_email(to_email: str, name: str, password: str, login_url: str, plan_name: str = "Professional") -> bool:
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
