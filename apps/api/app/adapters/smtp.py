"""SMTP adapter for transactional Agentzy notifications."""

import smtplib
from email.message import EmailMessage

from app.core.config import get_settings

settings = get_settings()


def send_email(recipient: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(body)
    smtp_class = smtplib.SMTP if settings.smtp_starttls else smtplib.SMTP_SSL
    with smtp_class(settings.smtp_host, settings.smtp_port, timeout=20) as client:
        if settings.smtp_starttls:
            client.starttls()
        if settings.smtp_username:
            client.login(settings.smtp_username, settings.smtp_password or "")
        client.send_message(message)
