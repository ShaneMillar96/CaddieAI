# CaddieAI Documentation

This directory contains comprehensive documentation for the CaddieAI project, organized to support continuous development and feature tracking.

## Directory Structure

```
shared/docs/
├── README.md                   # This file - documentation overview
├── ARCHITECTURE.md             # High-level architecture documentation
├── features/                   # Feature-specific documentation
│   ├── database/              # Database and migration documentation
│   ├── ai/                    # AI features documentation
│   ├── location/              # GPS and location features
│   └── course-management/     # Course data management
├── api/                       # API documentation
│   ├── endpoints/             # Individual endpoint documentation
│   ├── models/                # Data models and DTOs
│   └── authentication/        # Auth and security documentation
├── development/               # Development processes
│   ├── setup/                 # Environment setup guides
│   ├── testing/               # Testing strategies and examples
│   └── deployment/            # Deployment procedures
└── changelog/                 # Feature implementation tracking
    ├── migrations/            # Database migration logs
    ├── features/              # Feature implementation log
    └── decisions/             # Architecture decision records
```

## Documentation Standards

### File Naming Convention
- Use lowercase with hyphens for file names: `feature-name.md`
- Include version numbers for API documentation: `v1-endpoints.md`
- Use descriptive names that indicate content: `database-schema.md`

### Content Guidelines
- Start each document with a clear overview
- Include implementation details and code examples
- Document dependencies and prerequisites
- Add testing information and coverage details
- Include troubleshooting and common issues
- Reference related documentation and external resources

### Update Process
1. **Feature Implementation**: Create/update feature documentation
2. **API Changes**: Update relevant API documentation
3. **Database Changes**: Update migration logs and schema docs
4. **Testing**: Document test coverage and procedures
5. **Review**: Include documentation review in PR process

## Quick Navigation

### For Developers
- **Getting Started**: `development/setup/`
- **Architecture**: `ARCHITECTURE.md`
- **Database**: `features/database/`
- **Testing**: `development/testing/`

### For API Consumers
- **API Endpoints**: `api/endpoints/`
  - [Course Management API](api/endpoints/course-endpoints.md)
- **Data Models**: `api/models/`
  - [Course Models](api/models/course-models.md)
- **Authentication**: `api/authentication/`

### For Project Management
- **Feature Progress**: `changelog/features/`
  - [Course Management API v1.0.0](changelog/features/course-management-api-v1.0.0.md)
- **Architecture Decisions**: `changelog/decisions/`
- **Migration History**: `changelog/migrations/`

## Contributing to Documentation

### New Features
1. Create feature documentation in appropriate `features/` subdirectory
2. Update `CLAUDE.md` with new standards or processes
3. Add changelog entry in `changelog/features/`
4. Update API documentation if applicable

### Bug Fixes
1. Update relevant feature documentation
2. Add troubleshooting section if needed
3. Document testing procedures

### Architecture Changes
1. Update `ARCHITECTURE.md`
2. Create decision record in `changelog/decisions/`
3. Update affected feature documentation
4. Update `CLAUDE.md` development standards

## Maintenance

### Regular Reviews
- Monthly documentation audits
- Update outdated information
- Verify links and references
- Check for missing documentation

### Version Control
- All documentation is version controlled with code
- Use meaningful commit messages for documentation changes
- Link documentation updates to related code changes

## Templates

Standard templates are available for:
- **Feature Documentation**: `_templates/feature-template.md`
- **API Endpoints**: `_templates/api-endpoint-template.md`
- **Architecture Decisions**: `_templates/decision-record-template.md`
- **Migration Documentation**: `_templates/migration-template.md`

---

*This documentation structure supports the continuous evolution of CaddieAI while maintaining clarity and accessibility for all team members.*