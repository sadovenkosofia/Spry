import logging
import os
from datetime import datetime, timedelta
import boto3

from app.database import SessionLocal  # type: ignore
from app.reports.weekly import build_weekly_report  # type: ignore

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client("s3")
BUCKET_NAME = os.environ.get("REPORTS_BUCKET_NAME")


def get_default_week() -> str:
    today = datetime.utcnow()
    last_week = today - timedelta(days=7)
    year, week_num, _ = last_week.isocalendar()
    return f"{year}-W{week_num:02d}"


def detect_trigger(event: dict) -> str:
    if "Records" in event:
        return "sqs"
    if event.get("source") == "schedule":
        return "schedule"
    return "direct"


def handler(event, context):
    trigger_type = detect_trigger(event)

    if trigger_type == "sqs":
        import json
        record = event["Records"][0]
        body = json.loads(record["body"])
        week = body.get("week")
    else:
        week = event.get("week")

    if not week:
        week = get_default_week()

    logger.info(f"report-builder triggered trigger={trigger_type} week={week}")

    db = SessionLocal()
    try:
        csv_bytes = build_weekly_report(week, db)
    finally:
        db.close()

    s3_key = f"reports/{week}.csv"
    s3_client.put_object(
        Bucket=BUCKET_NAME,
        Key=s3_key,
        Body=csv_bytes,
        ContentType="text/csv"
    )

    logger.info(f"Report successfully uploaded to s3://{BUCKET_NAME}/{s3_key}")
    return {"statusCode": 200, "body": f"Report {week} generated"}
