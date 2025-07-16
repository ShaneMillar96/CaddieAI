# Database Migration: [Migration Name]

**Migration**: `V[version]__[Description].sql`  
**Version**: [e.g., V1.4.0]  
**Date**: [YYYY-MM-DD]  
**Author**: [Developer Name]  
**Status**: [Applied / Pending / Rolled Back]  
**Related Feature**: [Link to feature documentation]

## Overview

Brief description of what this migration does and why it's needed.

## Migration Details

### Migration File
- **File**: `V[version]__[Description].sql`
- **Location**: `backend/database/migrations/`
- **Size**: [Estimated execution time]
- **Complexity**: [Low / Medium / High]

### Type of Changes
- [ ] Create new tables
- [ ] Add columns to existing tables
- [ ] Modify existing columns
- [ ] Drop columns
- [ ] Create indexes
- [ ] Drop indexes
- [ ] Insert seed data
- [ ] Update existing data
- [ ] Create stored procedures/functions
- [ ] Add constraints
- [ ] Remove constraints

## Database Schema Changes

### New Tables
```sql
CREATE TABLE new_table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    column1 VARCHAR(255) NOT NULL,
    column2 INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Modified Tables
```sql
ALTER TABLE existing_table 
ADD COLUMN new_column VARCHAR(100);

ALTER TABLE existing_table 
ALTER COLUMN existing_column TYPE TEXT;
```

### New Indexes
```sql
CREATE INDEX idx_table_column ON table_name(column_name);
CREATE INDEX idx_table_geom ON table_name USING GIST(geometry_column);
```

### Constraints
```sql
ALTER TABLE table_name 
ADD CONSTRAINT constraint_name CHECK (column_name > 0);
```

### Triggers
```sql
CREATE TRIGGER trigger_name
    BEFORE UPDATE ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Data Changes

### Seed Data
```sql
INSERT INTO table_name (column1, column2) VALUES
('value1', 'value2'),
('value3', 'value4');
```

### Data Transformations
```sql
UPDATE table_name 
SET column1 = CASE 
    WHEN condition1 THEN 'value1'
    WHEN condition2 THEN 'value2'
    ELSE column1
END;
```

## Impact Analysis

### Affected Tables
- `table1`: [Description of impact]
- `table2`: [Description of impact]
- `table3`: [Description of impact]

### Affected Features
- **Feature 1**: [How it's affected]
- **Feature 2**: [How it's affected]
- **Feature 3**: [How it's affected]

### Breaking Changes
- [ ] API changes required
- [ ] Frontend changes required
- [ ] Configuration changes required
- [ ] Third-party integration changes required

### Performance Impact
- **Execution Time**: [Estimated time]
- **Downtime**: [Expected downtime]
- **Resource Usage**: [Memory, CPU, disk usage]
- **Query Performance**: [Impact on existing queries]

## Dependencies

### Prerequisites
- [ ] Previous migration V[x.x.x] must be applied
- [ ] Database backup completed
- [ ] Feature flags disabled
- [ ] Maintenance window scheduled

### Post-Migration Requirements
- [ ] Update application configuration
- [ ] Restart application services
- [ ] Verify data integrity
- [ ] Update documentation

## Testing

### Pre-Migration Testing
- [ ] Test migration on development database
- [ ] Test migration on staging database
- [ ] Verify rollback procedure
- [ ] Performance testing with production data volume

### Post-Migration Testing
- [ ] Data integrity verification
- [ ] Application functionality testing
- [ ] Performance regression testing
- [ ] Integration testing

### Test Queries
```sql
-- Verify new tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'new_table_name';

-- Check data integrity
SELECT COUNT(*) FROM table_name WHERE condition;

-- Verify indexes exist
SELECT indexname FROM pg_indexes WHERE tablename = 'table_name';
```

## Rollback Plan

### Rollback Conditions
- Migration fails during execution
- Data corruption detected
- Performance degradation
- Application errors after migration

### Rollback Steps
1. **Immediate Actions**:
   ```sql
   -- Remove new tables
   DROP TABLE IF EXISTS new_table_name;
   
   -- Remove new columns
   ALTER TABLE existing_table DROP COLUMN IF EXISTS new_column;
   ```

2. **Data Recovery**:
   ```sql
   -- Restore data from backup if needed
   -- Revert data transformations
   ```

3. **Verification**:
   ```sql
   -- Verify rollback completed successfully
   -- Check application functionality
   ```

### Rollback Time
- **Estimated Time**: [Time to complete rollback]
- **Complexity**: [Low / Medium / High]
- **Risk Level**: [Low / Medium / High]

## Execution Plan

### Pre-Execution Checklist
- [ ] Database backup completed
- [ ] Migration tested on staging
- [ ] Rollback plan prepared
- [ ] Team notified of maintenance window
- [ ] Monitoring tools configured

### Execution Steps
1. **Preparation**:
   - Stop application services
   - Create database backup
   - Verify database state

2. **Migration Execution**:
   - Execute migration script
   - Monitor progress
   - Verify completion

3. **Post-Migration**:
   - Restart application services
   - Verify functionality
   - Monitor performance

### Monitoring
- Monitor database performance metrics
- Watch for application errors
- Track query execution times
- Monitor resource usage

## Validation

### Data Validation Queries
```sql
-- Check record counts
SELECT COUNT(*) FROM table_name;

-- Verify data relationships
SELECT t1.id, t2.id FROM table1 t1 
JOIN table2 t2 ON t1.foreign_key = t2.id;

-- Check data integrity
SELECT * FROM table_name WHERE validation_condition;
```

### Application Validation
- [ ] API endpoints respond correctly
- [ ] Database queries execute successfully
- [ ] Performance metrics within acceptable range
- [ ] No error logs related to database

## Documentation Updates

### Code Changes Required
- [ ] Update Entity Framework models
- [ ] Update repository interfaces
- [ ] Update service layer
- [ ] Update API controllers

### Documentation Updates
- [ ] Update database schema documentation
- [ ] Update API documentation
- [ ] Update feature documentation
- [ ] Update CLAUDE.md if needed

## Communication

### Stakeholder Notification
- **Development Team**: [Notification details]
- **QA Team**: [Testing requirements]
- **Operations Team**: [Deployment considerations]
- **Business Users**: [Impact and timeline]

### Maintenance Window
- **Scheduled Time**: [Date and time]
- **Duration**: [Expected duration]
- **Impact**: [Service availability]
- **Communication**: [How users will be notified]

## Post-Migration Review

### Success Criteria
- [ ] Migration completed without errors
- [ ] All tests passing
- [ ] Performance within acceptable limits
- [ ] No data loss or corruption
- [ ] Application functioning normally

### Lessons Learned
- What went well
- What could be improved
- Recommendations for future migrations

### Follow-up Actions
- [ ] Monitor performance for 24 hours
- [ ] Update monitoring dashboards
- [ ] Document any issues encountered
- [ ] Update migration procedures

## Related Documentation

- [Database Schema](../features/database/schema.md)
- [Feature Documentation](../features/feature-name.md)
- [Previous Migration](./V1.3.0__Previous_Migration.md)
- [Migration Guidelines](../development/database-migrations.md)

---

*This migration documentation should be updated based on actual execution results.*