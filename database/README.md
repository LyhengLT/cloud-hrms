# Database

PostgreSQL is the system of record. In development it runs as the `db` service in
`docker-compose.yml`. In production, point `DATABASE_URL` at a managed instance:

- **AWS RDS for PostgreSQL**, or
- **Google Cloud SQL for PostgreSQL**

## Tables

`departments`, `employees`, `attendance`, `leave_requests`, `payslips`.
See [`schema.sql`](./schema.sql) for the full DDL.

## How tables are created

The backend calls `Base.metadata.create_all()` on startup, so tables are created
automatically the first time the API connects. `schema.sql` is provided as a
reference and for manual bootstrapping on a managed cloud DB.

## Cloud connection example

```
# AWS RDS
DATABASE_URL=postgresql+psycopg2://hrms:PASSWORD@mydb.abc123.ap-southeast-1.rds.amazonaws.com:5432/hrms

# Google Cloud SQL (public IP)
DATABASE_URL=postgresql+psycopg2://hrms:PASSWORD@34.x.x.x:5432/hrms
```

## Backup & recovery

- **AWS RDS:** enable automated backups (retention 7–35 days) + manual snapshots.
  Restore = create a new instance from a snapshot or point-in-time.
- **Manual dump:**
  ```
  pg_dump "$DATABASE_URL" > backup_$(date +%F).sql      # backup
  psql "$DATABASE_URL" < backup_2026-06-23.sql          # restore
  ```
