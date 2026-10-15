import csv
import io
import logging
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.meeting import Meeting

log = logging.getLogger(__name__)
log.setLevel(logging.INFO)

def get_week_bounds(iso_week: str):
    """Початок понеділка (включно) і початок наступного понеділка (виключно)."""
    start = datetime.strptime(f"{iso_week}-1", "%G-W%V-%u")
    end = start + timedelta(days=7)
    return start, end


def get_prev_iso_week(iso_week: str) -> str:
    """Повертає рядок ISO-тижня для попереднього тижня."""
    start, _ = get_week_bounds(iso_week)
    prev_start = start - timedelta(days=7)
    year, week_num, _ = prev_start.isocalendar()
    return f"{year}-W{week_num:02d}"


def build_weekly_report(week: str, db: Session) -> bytes:
    """
    Приймає ISO-тиждень (наприклад, "2026-W40") та сесію БД.
    Повертає байтове представлення CSV-файлу.
    """
    start_curr, end_curr = get_week_bounds(week)
    prev_week = get_prev_iso_week(week)
    start_prev, end_prev = get_week_bounds(prev_week)

    curr_meetings = db.query(Meeting).filter(
        Meeting.starts_at >= start_curr,
        Meeting.starts_at < end_curr
    ).all()

    curr_count = len(curr_meetings)
    curr_duration_hours = sum(
        [(m.ends_at - m.starts_at).total_seconds() / 3600 for m in curr_meetings]
    )

    prev_meetings = db.query(Meeting).filter(
        Meeting.starts_at >= start_prev,
        Meeting.starts_at < end_prev
    ).all()

    prev_count = len(prev_meetings)
    prev_count = len(prev_meetings)
    prev_duration_hours = sum(
        [(m.ends_at - m.starts_at).total_seconds() / 3600 for m in prev_meetings]
    )

    log.info(
        "report data",
        extra={
            "week": week,
            "range": f"{start_curr} .. {end_curr}",
            "curr_count": curr_count,
            "prev_count": prev_count,
        },
    )

    delta_count = curr_count - prev_count
    delta_duration = curr_duration_hours - prev_duration_hours

    top_5_meetings = sorted(
        curr_meetings,
        key=lambda m: (m.ends_at - m.starts_at).total_seconds(),
        reverse=True
    )[:5]

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow(["WEEKLY REPORT", week])
    writer.writerow([])
    writer.writerow(["Metric", "Current Week", "Previous Week", "Delta"])
    writer.writerow(["Total Meetings", curr_count, prev_count, f"{delta_count:+d}"])
    writer.writerow(["Total Duration (hours)", round(curr_duration_hours, 2), round(prev_duration_hours, 2), f"{delta_duration:+.2f}"])
    writer.writerow([])

    writer.writerow(["TOP 5 LONGEST MEETINGS"])
    writer.writerow(["Title", "Start Time", "Duration (mins)", "Attendees Count"])

    for m in top_5_meetings:
        duration_mins = round((m.ends_at - m.starts_at).total_seconds() / 60, 1)
        writer.writerow([m.title, m.starts_at.isoformat(), duration_mins, m.attendee_count])

    return output.getvalue().encode('utf-8')
