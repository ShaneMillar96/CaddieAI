---
description: Start implementation work based on a feature plan created by the feature-planner agent
argument-hint: <feature-file> (e.g., pin-flag.md from .claude/features/)
allowed-tools: 
  - Task
  - Write
  - Read
  - Grep
  - Glob
  - WebFetch
  - Bash
  - MultiEdit
  - Edit
  - TodoWrite
  - LS
  - NotebookEdit
---

I need to start implementation work on the feature specified in `$ARGUMENTS` from the `.claude/features/` directory. This command will orchestrate the complete implementation workflow based on the feature plan created by the feature-planner agent.

## Implementation Workflow

### 1. Load and Validate Feature Plan
First, load the feature document from `.claude/features/$ARGUMENTS` and validate that it contains:
- Complete implementation plan with recommended agents
- Database schema changes (if any)
- API endpoint specifications
- Mobile app changes required
- Testing strategy

### 2. Setup Development Environment

#### Create Feature Branch
```bash
# Extract feature name from file (remove .md extension)
FEATURE_NAME=$(echo "$ARGUMENTS" | sed 's/\.md$//')
git checkout -b feature/$FEATURE_NAME
```

#### Initialize Todo List
Create a comprehensive todo list based on the implementation phases specified in the feature document. Import all tasks from the feature plan and organize them by:
- Backend foundation tasks
- Mobile implementation tasks  
- Integration and testing tasks
- Documentation and cleanup tasks

### 3. Execute Implementation Sequence

Based on the feature document's "Recommended Agents & Sequence" section, orchestrate the implementation using the specified agents in order:

#### Phase 1: Database Changes (if required)
If the feature requires database changes:
- Launch `postgres-flyway-engineer` agent to:
  - Create Flyway migration scripts for new tables/columns
  - Update DAL models with proper Data Annotations
  - Add required indexes for performance
  - Test migration up/down scenarios

#### Phase 2: Backend Implementation (if required)
If the feature requires backend changes:
- Launch `dotnet-middleware-engineer` agent to:
  - Create new controllers and API endpoints
  - Implement business logic in service layer
  - Add AutoMapper profiles for DTOs
  - Update dependency injection configuration
  - Create unit tests for services and repositories

#### Phase 3: Mobile Implementation (if required)
If the feature requires mobile app changes:
- Launch `react-native-ui-developer` agent to:
  - Create new screens and components
  - Implement navigation flows
  - Add Redux state management (actions, reducers, selectors)
  - Integrate with backend APIs
  - Ensure cross-platform compatibility

#### Phase 4: Integration & Testing
- Launch `general-purpose` agent for:
  - End-to-end testing of the complete feature
  - Performance optimization
  - Error handling validation
  - Cross-feature integration testing

### 4. Continuous Integration

Throughout the implementation:

#### Progress Tracking
- Update the todo list in real-time as tasks complete
- Mark implementation phases as completed
- Track any blockers or issues that arise

#### Quality Assurance
- Run build and test commands after each major phase
- Validate that existing functionality remains intact
- Ensure code follows project standards from CLAUDE.md

#### Documentation Updates
- Update API documentation if new endpoints were added
- Update mobile app documentation for new screens/components
- Create or update user documentation as needed

### 5. Feature Completion Checklist

Before marking the feature as complete, verify:

#### Technical Completion
- [ ] All database migrations run successfully
- [ ] All API endpoints function correctly
- [ ] Mobile app builds and runs on both iOS and Android
- [ ] Unit tests pass with adequate coverage
- [ ] Integration tests validate end-to-end functionality

#### Code Quality
- [ ] Code follows project conventions and standards
- [ ] No eslint/tslint warnings or errors
- [ ] Backend code follows Clean Architecture principles
- [ ] Mobile code follows React Native best practices

#### User Experience
- [ ] Feature matches acceptance criteria from feature document
- [ ] UI/UX is consistent with existing app design
- [ ] Error handling provides clear user feedback
- [ ] Performance meets specified requirements

#### Documentation
- [ ] API endpoints documented (if applicable)
- [ ] Component documentation updated (if applicable)
- [ ] Feature marked as completed in planning document
- [ ] Any architectural decisions recorded

### 6. Prepare for Review

#### Create Pull Request
```bash
# Push feature branch
git push -u origin feature/$FEATURE_NAME

# Create PR using GitHub CLI (if available)
gh pr create --title "Feature: $FEATURE_NAME" --body-file ".claude/features/$ARGUMENTS" --draft
```

#### PR Preparation
- Ensure PR description includes link to feature planning document
- Add screenshots or videos for UI changes
- Include testing instructions for reviewers
- Mark as draft if still in development, ready for review when complete

### 7. Agent Coordination Strategy

This command coordinates multiple specialized agents efficiently:

#### Parallel Execution
When possible, run independent tasks in parallel:
- Database migrations can run alongside API documentation updates
- Mobile component creation can happen while backend services are being implemented
- Testing can be prepared while implementation is in progress

#### Sequential Dependencies
Respect implementation dependencies:
- Database changes must complete before backend services that depend on them
- Backend APIs must be available before mobile app integration
- Core functionality must work before optimization and polish

#### Handoff Management
Clear handoffs between agents:
- Database agent completes migrations and provides updated connection info
- Backend agent implements APIs and provides endpoint documentation
- Mobile agent integrates with confirmed working APIs
- General-purpose agent validates the complete end-to-end flow

### 8. Error Handling and Recovery

#### Common Issues
- Database migration failures: Rollback and retry with fixes
- API integration issues: Validate endpoint contracts and data formats
- Mobile build issues: Check dependency versions and platform-specific configurations
- Testing failures: Isolate issues and fix systematically

#### Recovery Strategies
- Maintain rollback points at each major phase
- Use feature flags for gradual rollout if needed
- Keep detailed logs of all implementation steps
- Have backup plans for external API dependencies

---

## Usage Examples

```bash
# Start work on a pin flag feature
@start-work pin-flag.md

# Start work on a leaderboard feature  
@start-work leaderboard.md

# Start work on a social sharing feature
@start-work social-sharing.md
```

## Integration with Feature Planning

This command is designed to work seamlessly with the output from `@agent-feature-planner`:

1. **Planning Phase**: Use `@agent-feature-planner` to create detailed feature document
2. **Implementation Phase**: Use `@start-work @{feature-name}.md` to begin development
3. **Review Phase**: Use standard PR process with feature document as reference
4. **Completion Phase**: Update feature document with final implementation notes

## Success Metrics

- **Implementation Efficiency**: Reduced time from feature plan to working code
- **Code Quality**: Consistent adherence to project standards and patterns
- **Agent Coordination**: Smooth handoffs between specialized agents
- **Documentation**: Complete and accurate implementation documentation
- **Testing Coverage**: Comprehensive validation of feature functionality

This command transforms feature plans into working code through systematic, well-coordinated implementation that leverages the specialized capabilities of multiple Claude agents.