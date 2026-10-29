from datetime import datetime, timedelta, timezone

from app.database import SessionLocal
from app.models.meeting import Meeting

UTC = timezone.utc


def m(title, start, minutes, attendees):
    return Meeting(
        title=title,
        starts_at=start,
        ends_at=start + timedelta(minutes=minutes),
        attendee_count=attendees,
    )


meetings = [
    # Week 2026-W41 (5-11 Oct)
    m("Sprint planning", datetime(2026, 10, 5, 9, 0, tzinfo=UTC), 90, 8),
    m("Daily standup", datetime(2026, 10, 6, 9, 0, tzinfo=UTC), 15, 6),
    m("Design review", datetime(2026, 10, 6, 13, 0, tzinfo=UTC), 60, 5),
    m("Client demo", datetime(2026, 10, 7, 15, 0, tzinfo=UTC), 120, 12),
    m("Architecture discussion", datetime(2026, 10, 8, 11, 0, tzinfo=UTC), 75, 4),
    m("Retrospective", datetime(2026, 10, 9, 14, 0, tzinfo=UTC), 45, 8),
    m("1:1 with manager", datetime(2026, 10, 9, 16, 0, tzinfo=UTC), 30, 2),
    # Week 2026-W40 (28 Sep - 4 Oct)
    m("Sprint planning", datetime(2026, 9, 28, 9, 0, tzinfo=UTC), 60, 8),
    m("Daily standup", datetime(2026, 9, 29, 9, 0, tzinfo=UTC), 15, 6),
    m("Team sync", datetime(2026, 10, 1, 12, 0, tzinfo=UTC), 45, 7),
    m("Retrospective", datetime(2026, 10, 2, 14, 0, tzinfo=UTC), 30, 8),
]

db = SessionLocal()
try:
    db.add_all(meetings)
    db.commit()
    print(f"Added {len(meetings)} meetings")
finally:
    db.close()
