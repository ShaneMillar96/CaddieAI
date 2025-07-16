# CaddieAI Docker Development Environment

This directory contains Docker configurations for the CaddieAI development environment.

## Directory Structure

```
docker/
├── README.md                    # This file
├── flyway/
│   └── flyway.conf             # Flyway migration configuration
├── postgres/
│   └── init/                   # PostgreSQL initialization scripts
│       ├── 01-init-database.sql
│       └── 02-performance-tuning.sql
└── pgadmin/
    └── servers.json            # pgAdmin server configuration
```

## Services

### PostgreSQL + PostGIS
- **Image**: `postgis/postgis:16-3.4`
- **Port**: 5432
- **Database**: `caddieai_dev`
- **User**: `caddieai_user`
- **Password**: `caddieai_password`

### Flyway
- **Image**: `flyway/flyway:10-alpine`
- **Purpose**: Database migrations
- **Migration Path**: `./backend/database/migrations`

### pgAdmin
- **Image**: `dpage/pgadmin4:latest`
- **Port**: 8080
- **Email**: `admin@caddieai.com`
- **Password**: `admin`

### Redis
- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Purpose**: Caching layer

## Quick Start

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service health:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f postgres
   ```

4. **Connect to database:**
   ```bash
   docker-compose exec postgres psql -U caddieai_user -d caddieai_dev
   ```

5. **Access pgAdmin:**
   - Open http://localhost:8080
   - Login with: `admin@caddieai.com` / `admin`
   - Server is pre-configured

## Common Commands

### Database Operations
```bash
# Run migrations
docker-compose run --rm flyway migrate

# Check migration status
docker-compose run --rm flyway info

# Validate migrations
docker-compose run --rm flyway validate

# Reset database
docker-compose down -v postgres
docker-compose up -d postgres flyway
```

### Database Backup/Restore
```bash
# Backup
docker-compose exec postgres pg_dump -U caddieai_user caddieai_dev > backup.sql

# Restore
docker-compose exec -T postgres psql -U caddieai_user caddieai_dev < backup.sql
```

### Troubleshooting
```bash
# Check container logs
docker-compose logs postgres
docker-compose logs flyway

# Check container status
docker-compose ps

# Restart services
docker-compose restart postgres

# Remove all containers and volumes
docker-compose down -v
```

## Environment Variables

Key environment variables (defined in `.env`):

- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `POSTGRES_PORT`: Database port
- `PGADMIN_EMAIL`: pgAdmin login email
- `PGADMIN_PASSWORD`: pgAdmin login password
- `PGADMIN_PORT`: pgAdmin web interface port

## Data Persistence

- Database data is persisted in the `postgres_data` volume
- pgAdmin settings are persisted in the `pgadmin_data` volume
- Redis data is persisted in the `redis_data` volume

## Security Notes

- **Development Only**: These configurations are for development only
- **Default Credentials**: Change default passwords in production
- **Network**: Services communicate via the `caddieai_network` bridge network
- **Firewall**: Database ports are exposed only on localhost

## PostGIS Extensions

The PostgreSQL container includes the following extensions:
- `postgis`: Core PostGIS functionality
- `postgis_topology`: Topology support
- `postgis_raster`: Raster support
- `fuzzystrmatch`: Fuzzy string matching
- `postgis_tiger_geocoder`: TIGER geocoder
- `uuid-ossp`: UUID generation

## Performance Tuning

The `02-performance-tuning.sql` script applies development-optimized settings:
- Shared buffers: 256MB
- Effective cache size: 1GB
- Work memory: 4MB
- Connection limit: 100

## Monitoring

Health checks are configured for:
- PostgreSQL: `pg_isready` command
- Redis: `redis-cli ping` command

Check health status:
```bash
docker-compose ps
```