"""Command-Line Interface for Bengal Safety Map Administration."""
import sys
import argparse
from bengal_safety_map.core.database import engine, Base, SessionLocal
from bengal_safety_map.services.etl.pipeline import ETLPipeline
from bengal_safety_map.services.packaging.offline_packager import OfflinePackager
from bengal_safety_map.models import RawRecord


def cmd_db_init(args):
    """Initializes database schema tables."""
    print("Creating database schema tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")


def cmd_seed_demo(args):
    """Ingests synthetic demonstration dataset."""
    print("Executing synthetic demo ingestion pipeline...")
    db = SessionLocal()
    try:
        pipeline = ETLPipeline(db)
        result = pipeline.run_synthetic_demo_pipeline(fixture_path=args.fixture)
        print(f"Demo seed completed successfully:")
        print(f"  - Source Run ID: {result['run_id']}")
        print(f"  - Records Read: {result['records_read']}")
        print(f"  - Records Written: {result['records_written']}")
        print(f"  - Records Quarantined: {result['records_quarantined']}")
        print(f"  - Release ID: {result['release_id']}")
    finally:
        db.close()


def cmd_package_build(args):
    """Generates an offline downloadable bundle."""
    print(f"Generating offline package for area '{args.area}'...")
    db = SessionLocal()
    try:
        packager = OfflinePackager(db)
        pkg = packager.generate_pilot_package(area_code=args.area)
        print(f"Package generated successfully:")
        print(f"  - Package ID: {pkg.id}")
        print(f"  - Record Count: {pkg.record_count}")
        print(f"  - File Size: {pkg.file_size_bytes} bytes")
        print(f"  - SHA-256 Checksum: {pkg.sha256_checksum}")
        print(f"  - Expires: {pkg.expires_at}")
    finally:
        db.close()


def cmd_quarantine_list(args):
    """Lists quarantined records and rejection reasons."""
    db = SessionLocal()
    try:
        records = db.query(RawRecord).filter_by(parse_status="quarantined").all()
        print(f"Found {len(records)} quarantined records:")
        for r in records:
            print(f"  [{r.id}] Source: {r.source_id} | Reason: {r.quarantine_reason}")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Bengal Safety Map Management CLI")
    subparsers = parser.add_subparsers(dest="subcommand", required=True)

    # db init
    p_db = subparsers.add_parser("db", help="Database management")
    p_db_subs = p_db.add_subparsers(dest="action", required=True)
    p_db_subs.add_parser("init", help="Initialize tables")

    # seed demo
    p_seed = subparsers.add_parser("seed", help="Seed data")
    p_seed_subs = p_seed.add_subparsers(dest="action", required=True)
    p_seed_demo = p_seed_subs.add_parser("demo", help="Ingest synthetic pilot demo dataset")
    p_seed_demo.add_argument("--fixture", default="data/fixtures/demo_pilot_data.json", help="Path to demo fixture")

    # package build
    p_pkg = subparsers.add_parser("package", help="Offline package management")
    p_pkg_subs = p_pkg.add_subparsers(dest="action", required=True)
    p_pkg_build = p_pkg_subs.add_parser("build", help="Build offline package")
    p_pkg_build.add_argument("--area", default="kolkata_metro", help="Area code")

    # quarantine list
    p_quar = subparsers.add_parser("quarantine", help="Quarantine inspection")
    p_quar_subs = p_quar.add_subparsers(dest="action", required=True)
    p_quar_subs.add_parser("list", help="List quarantined records")

    args = parser.parse_args()

    if args.subcommand == "db" and args.action == "init":
        cmd_db_init(args)
    elif args.subcommand == "seed" and args.action == "demo":
        cmd_seed_demo(args)
    elif args.subcommand == "package" and args.action == "build":
        cmd_package_build(args)
    elif args.subcommand == "quarantine" and args.action == "list":
        cmd_quarantine_list(args)


if __name__ == "__main__":
    main()
