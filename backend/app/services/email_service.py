"""Email notification service using SMTP."""
import smtplib
import base64
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from app.core.config import settings
from datetime import datetime
import logging
import threading

logger = logging.getLogger(__name__)


def _send_email_sync(to: list[str], subject: str, html_body: str, inline_images: dict[str, bytes] | None = None):
    """Send email synchronously (called from background thread)."""
    if not settings.EMAIL_HOST_USER or not settings.EMAIL_HOST_PASSWORD:
        logger.warning("Email not configured, skipping send")
        return

    msg = MIMEMultipart("related")
    msg["From"] = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject

    html_part = MIMEMultipart("alternative")
    html_part.attach(MIMEText(html_body, "html"))
    msg.attach(html_part)

    if inline_images:
        for cid, image_data in inline_images.items():
            img = MIMEImage(image_data, _subtype="jpeg")
            img.add_header("Content-ID", f"<{cid}>")
            img.add_header("Content-Disposition", "inline", filename=f"{cid}.jpg")
            msg.attach(img)

    try:
        with smtplib.SMTP(settings.MAIL_HOST, settings.EMAIL_PORT) as server:
            if settings.EMAIL_USE_TLS:
                server.starttls()
            server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
            server.sendmail(msg["From"], to, msg.as_string())
        logger.info(f"Email sent to {to}: {subject}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")


def send_email_async(to: list[str], subject: str, html_body: str, inline_images: dict[str, bytes] | None = None):
    """Send email in a background thread so it doesn't block the request."""
    thread = threading.Thread(target=_send_email_sync, args=(to, subject, html_body, inline_images))
    thread.daemon = True
    thread.start()


def send_alert_email(
    alert_type: str,
    message: str,
    snapshot_path: str | None = None,
    camera_name: str | None = None,
    timestamp: str | None = None,
):
    """Send an alert notification email to all configured recipients."""
    recipients = settings.alert_email_list
    if not recipients:
        return

    type_labels = {
        "unknown": "Unknown Face Detected",
        "low_attendance": "Low Attendance Warning",
        "unusual_time": "Unusual Time Entry",
        "camera_down": "Camera Offline",
    }

    type_colors = {
        "unknown": "#EF4444",
        "low_attendance": "#F59E0B",
        "unusual_time": "#9333EA",
        "camera_down": "#64748B",
    }

    label = type_labels.get(alert_type, alert_type.replace("_", " ").title())
    color = type_colors.get(alert_type, "#2563EB")

    # Format timestamp
    if timestamp:
        try:
            dt = datetime.fromisoformat(timestamp)
            time_str = dt.strftime("%b %d, %Y at %I:%M %p")
        except Exception:
            time_str = timestamp
    else:
        time_str = datetime.now().strftime("%b %d, %Y at %I:%M %p")

    camera_str = camera_name or "Unknown Camera"

    # Load snapshot image for embedding
    inline_images: dict[str, bytes] = {}
    snapshot_html = ""
    if snapshot_path:
        # snapshot_path is like "/api/v1/snapshots/face_123.jpg" — extract filename
        filename = snapshot_path.split("/")[-1] if "/" in snapshot_path else snapshot_path
        file_path = os.path.join("storage/snapshots", filename)
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                inline_images["snapshot"] = f.read()
            snapshot_html = f"""
            <div style="margin-top:20px;text-align:center;">
                <img src="cid:snapshot" alt="Detected face"
                     style="max-width:200px;border-radius:12px;border:3px solid {color};box-shadow:0 4px 12px rgba(0,0,0,0.1);" />
                <p style="color:#94A3B8;font-size:11px;margin-top:8px;">Captured face snapshot</p>
            </div>
            """

    html = f"""
    <!DOCTYPE html>
    <html>
    <body style="margin:0;padding:0;background:#F4F6FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#0F1629,#1E293B);padding:24px 32px;text-align:center;">
          <h1 style="color:#fff;font-size:20px;margin:0;">FaceTrace Alert</h1>
          <p style="color:#94A3B8;font-size:12px;margin:4px 0 0;text-transform:uppercase;letter-spacing:1px;">FaceTrace System</p>
        </div>

        <!-- Body -->
        <div style="padding:32px;">
          <div style="display:inline-block;background:{color};color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;margin-bottom:16px;">
            {label}
          </div>

          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px 0;">{message}</p>

          <!-- Details Table -->
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
            <tr>
              <td style="padding:10px 14px;background:#F8FAFC;border-radius:8px 0 0 0;border-bottom:1px solid #E2E8F0;">
                <span style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Time</span>
              </td>
              <td style="padding:10px 14px;background:#F8FAFC;border-radius:0 8px 0 0;border-bottom:1px solid #E2E8F0;">
                <span style="color:#334155;font-size:13px;font-weight:500;">{time_str}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 14px;background:#F8FAFC;border-radius:0 0 0 8px;">
                <span style="color:#94A3B8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Camera</span>
              </td>
              <td style="padding:10px 14px;background:#F8FAFC;border-radius:0 0 8px 0;">
                <span style="color:#334155;font-size:13px;font-weight:500;">{camera_str}</span>
              </td>
            </tr>
          </table>

          {snapshot_html}

          <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;" />
          <p style="color:#94A3B8;font-size:12px;margin:0;text-align:center;">
            Log in to FaceTrace to review and acknowledge this alert.
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    send_email_async(recipients, f"[FaceTrace] {label}", html, inline_images)
