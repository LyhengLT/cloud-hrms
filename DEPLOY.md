# Deploying Cloud HRMS to AWS (EC2 + RDS, Free Tier)

This guide deploys the app on **one EC2 instance** running Docker Compose
(backend + frontend), with **PostgreSQL on Amazon RDS** as the managed cloud
database. Everything below fits inside the AWS Free Tier.

```
Internet ──▶ EC2 (t3.micro)                      RDS PostgreSQL (db.t3.micro)
             ├─ frontend container :80  ─────────▶  private endpoint :5432
             └─ backend  container :8000  ───────┘
```

---

## 0. Prerequisites

- An AWS account (Free Tier eligible).
- The project pushed to GitHub, **or** you'll copy it to the server with `scp`.
- An SSH key pair (you'll create one in step 2).
- Region: pick one near you, e.g. `ap-southeast-1` (Singapore). Use the **same
  region** for RDS and EC2.

> Free Tier covers: `db.t3.micro` RDS (750 hrs/mo, 20 GB), `t2.micro`/`t3.micro`
> EC2 (750 hrs/mo). Stop/terminate when your demo is done to avoid charges.

---

## 1. Create the RDS PostgreSQL database

AWS Console → **RDS** → **Create database**.

1. **Engine:** PostgreSQL.
2. **Template:** Free tier.
3. **DB instance identifier:** `hrms-db`
4. **Master username:** `hrms`
5. **Master password:** choose a strong one — call it `<DB_PASSWORD>`.
6. **Instance class:** `db.t3.micro`. **Storage:** 20 GB gp3.
7. **Public access:** **No** (the EC2 instance will reach it privately).
8. **VPC:** default. Note the **Availability Zone**.
9. **Additional config → Initial database name:** `hrms`.
10. **Backups:** enable automated backups (retention 7 days) — this is your
    *automatic backup & recovery* requirement. ✅
11. Create. Wait until status = **Available**, then copy the **Endpoint**
    (looks like `hrms-db.abc123.ap-southeast-1.rds.amazonaws.com`).

Keep this — your connection string will be:
```
postgresql+psycopg2://hrms:<DB_PASSWORD>@<RDS_ENDPOINT>:5432/hrms
```

---

## 2. Launch the EC2 instance

AWS Console → **EC2** → **Launch instance**.

1. **Name:** `hrms-server`
2. **AMI:** Amazon Linux 2023 (or Ubuntu 22.04).
3. **Instance type:** `t3.micro` (or `t2.micro`).
4. **Key pair:** Create new → name `hrms-key` → download `hrms-key.pem`.
5. **Network → Security group:** create one named `hrms-sg` with inbound rules:
   - SSH (22) — **My IP** only
   - HTTP (80) — Anywhere (0.0.0.0/0)
   - Custom TCP (8000) — Anywhere *(optional, to hit Swagger directly)*
6. Launch. Note the instance's **Public IPv4** address → `<EC2_IP>`.

---

## 3. Let EC2 reach RDS (security groups)

The RDS database must accept connections from the EC2 instance.

1. EC2 → **Security Groups** → copy the **group ID** of `hrms-sg`
   (e.g. `sg-0abc...`).
2. RDS → your `hrms-db` → **Connectivity & security** → click its VPC security
   group → **Edit inbound rules** → **Add rule**:
   - Type: **PostgreSQL** (5432)
   - Source: **Custom** → paste `hrms-sg`'s group ID
3. Save. Now only your app server can talk to the database.

---

## 4. Connect and install Docker

From your Mac:
```bash
chmod 400 ~/Downloads/hrms-key.pem
ssh -i ~/Downloads/hrms-key.pem ec2-user@<EC2_IP>
```

On the server (Amazon Linux 2023):
```bash
sudo dnf update -y
sudo dnf install -y docker git
sudo systemctl enable --now docker
sudo usermod -aG docker ec2-user
# install docker compose plugin
sudo mkdir -p /usr/libexec/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/libexec/docker/cli-plugins/docker-compose
sudo chmod +x /usr/libexec/docker/cli-plugins/docker-compose
exit   # log out and back in so the docker group applies
```
> Ubuntu instead? Use `sudo apt update && sudo apt install -y docker.io git`,
> then the same compose-plugin steps, and user `ubuntu` instead of `ec2-user`.

Reconnect:
```bash
ssh -i ~/Downloads/hrms-key.pem ec2-user@<EC2_IP>
docker --version && docker compose version   # verify
```

---

## 5. Get the code onto the server

**Option A — GitHub (recommended):**
```bash
git clone https://github.com/<you>/<repo>.git cloud
cd cloud
```

**Option B — copy from your Mac** (run locally, not on the server):
```bash
scp -i ~/Downloads/hrms-key.pem -r ~/Documents/BIU/cloud ec2-user@<EC2_IP>:~/cloud
```

---

## 6. Point the app at RDS (production override)

The default `docker-compose.yml` runs a local Postgres container. For production
we drop it and point the backend at RDS instead. On the server, inside the
project folder, create **`docker-compose.prod.yml`**:

```bash
cat > docker-compose.prod.yml <<'YAML'
services:
  backend:
    environment:
      DATABASE_URL: ${DATABASE_URL}
      JWT_SECRET: ${JWT_SECRET}
      SEED_ON_START: "true"
    depends_on: []        # no local db dependency in prod

  frontend:
    depends_on:
      - backend

# Disable the local db container in production
  db:
    profiles: ["disabled"]
YAML
```

Create the `.env` with your real RDS values:
```bash
cat > .env <<'ENV'
DATABASE_URL=postgresql+psycopg2://hrms:<DB_PASSWORD>@<RDS_ENDPOINT>:5432/hrms
JWT_SECRET=replace-with-a-long-random-string
ENV
```
Generate a strong secret with: `openssl rand -hex 32`.

---

## 7. Build and run

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

- `-d` runs in the background.
- On first start the backend creates the tables on RDS and seeds the demo
  accounts.

Check it:
```bash
docker compose ps
docker compose logs -f backend      # watch for "Application startup complete"
```

Open in your browser:
- **App:** `http://<EC2_IP>/`
- **API docs:** `http://<EC2_IP>:8000/docs`

Log in with `admin@hrms.com / admin123` (change this password after first login).

---

## 8. (Recommended) HTTPS with a domain

Plain HTTP is fine for a class demo. For a real URL + HTTPS:

1. Point a domain/subdomain's A-record at `<EC2_IP>` (Route 53 or any registrar).
2. Add a reverse proxy with auto-TLS. Simplest is **Caddy** on the host:
   ```bash
   # example Caddyfile — proxies your domain to the frontend container
   your-domain.com {
     reverse_proxy localhost:80
   }
   ```
   Caddy fetches a free Let's Encrypt certificate automatically.
3. Open port 443 in `hrms-sg`.

---

## 9. Day-to-day operations

```bash
# update after pushing new code
git pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

# logs
docker compose logs -f backend

# stop / start
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**Database backup & recovery (RDS):**
- Automated daily backups are already on (step 1).
- Manual snapshot: RDS → `hrms-db` → **Actions → Take snapshot**.
- Restore: **Actions → Restore to point in time** (creates a new instance);
  update `DATABASE_URL` to the new endpoint.
- Manual SQL dump from the server:
  ```bash
  docker run --rm postgres:16-alpine pg_dump "$DATABASE_URL" > backup_$(date +%F).sql
  ```

---

## 10. Cost control (important for students)

- **Stop** the EC2 instance when not demoing (you keep the disk, pay nothing for
  compute on Free Tier anyway, but it protects your hours).
- When the project is graded, **terminate EC2** and **delete the RDS instance**
  (take a final snapshot first if you want to keep the data).
- Set a **Billing alarm** (Billing → Budgets) at $1 to catch surprises.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Backend log: `could not connect to server` | RDS security group isn't allowing `hrms-sg`; recheck step 3. Confirm endpoint + password in `.env`. |
| `password cannot be longer than 72 bytes` | Old image — rebuild: `... up --build`. `bcrypt==4.0.1` is pinned in `requirements.txt`. |
| Browser can't load site | Port 80 not open in `hrms-sg`, or containers not running (`docker compose ps`). |
| Login fails | DB seeded against a different RDS instance, or you changed `DATABASE_URL`. Check `docker compose logs backend`. |
| Want a clean DB | `down` then on RDS drop/recreate the `hrms` database, or restore a snapshot. |
