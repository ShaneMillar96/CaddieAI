---
description: Orchestrate complete Jira ticket workflow with ultrathinking analysis
argument-hint: <ticket-id> (e.g., ECS-39)
allowed-tools: 
  - mcp__jira-mcp__get-ticket
  - mcp__jira-mcp__update-ticket
  - mcp__jira-mcp__search-tickets
  - mcp__jira-mcp__link-tickets
  - mcp__jira-mcp__create-ticket
  - mcp__jira-mcp__get-test-steps
  - mcp__jira-mcp__add-test-steps
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
---

I need to work on Jira ticket $ARGUMENTS from the CaddieAI ECS project. Please orchestrate the following comprehensive workflow using ultrathinking for deep analysis:

## 1. Retrieve and Analyze Ticket
First, use the JIRA MCP to get comprehensive information about ticket $ARGUMENTS from the ECS project.

## 2. Analyze Ticket Information
Using the JIRA MCP get-ticket tool, analyze:
- Full ticket description and acceptance criteria
- Current status and story points
- Sprint assignment and priority
- Related tickets and dependencies
- Any test steps if it's a test ticket

### JIRA MCP Workflow:
1. Use `mcp__jira-mcp__get-ticket` with ticket_id: $ARGUMENTS
2. If it's a test ticket, use `mcp__jira-mcp__get-test-steps` to retrieve detailed test scenarios
3. Use `mcp__jira-mcp__search-tickets` to find related tickets by issue type or criteria
4. Plan to use `mcp__jira-mcp__update-ticket` later to add implementation notes and PR links

## 3. Perform Deep Codebase Analysis with Ultrathinking

Think step by step about the codebase structure and requirements. Launch multiple parallel Task agents to analyze:

**Architecture Analysis Agent**:
- Examine the overall project structure across all language implementations (TypeScript, Java, C#)
- Identify architectural patterns and conventions
- Map out the component hierarchy and dependencies

**Implementation Pattern Agent**:
- Study existing controllers, models, and utilities
- Understand naming conventions and code style
- Identify reusable components and utilities
- Analyze error handling patterns

**Testing Strategy Agent**:
- Examine existing test files and testing patterns
- Identify testing frameworks and conventions
- Understand test coverage expectations
- Map out unit, integration, and e2e test requirements

**API Contract Agent**:
- Analyze existing API endpoints and their contracts
- Understand request/response formats
- Identify validation rules and error responses
- Study authentication and authorization patterns

**Security and Performance Agent**:
- Identify security considerations
- Analyze performance implications
- Review data validation and sanitization
- Consider rate limiting and caching strategies

## 4. Create Detailed Implementation Plan with Extended Thinking

Using ultrathinking, develop a comprehensive implementation plan that includes:

### Technical Design
- Detailed technical approach with rationale for each decision
- Architecture diagrams (if applicable)
- Data flow and sequence diagrams
- API contract specifications

### Implementation Tasks
Break down the implementation into granular, actionable tasks:
- Backend implementation steps
- Frontend changes (if applicable)
- Database modifications (if needed)
- Configuration updates
- Documentation requirements

### Testing Strategy
- Unit test scenarios with edge cases
- Integration test requirements
- E2E test scenarios
- Performance testing considerations
- Security testing checklist

### Risk Assessment
- Potential breaking changes
- Backward compatibility concerns
- Performance impact analysis
- Security vulnerabilities
- Rollback strategy

## 5. Document the Comprehensive Plan

### Update Jira Ticket
Add a detailed comment to the Jira ticket with:
- High-level implementation approach
- Estimated timeline
- Key technical decisions
- Testing strategy summary
- Review criteria

### Create Local Documentation
Create a comprehensive markdown file at `/work/$ARGUMENTS-<short-description>-plan.md` containing:

```markdown
# $ARGUMENTS: [Ticket Title]

## Executive Summary
[Brief overview of the feature/fix and its business value]

## Technical Design
### Overview
[Technical approach and architecture decisions]

### Implementation Details
[Detailed technical specifications]

### API Changes
[Endpoint specifications, request/response formats]

### Data Model Changes
[Database or model modifications]

## Implementation Plan
### Phase 1: [Component Name]
- [ ] Task 1
- [ ] Task 2
...

### Phase 2: [Component Name]
- [ ] Task 1
- [ ] Task 2
...

## Testing Strategy
### Unit Tests
- Test scenario 1
- Test scenario 2
...

### Integration Tests
- Test scenario 1
- Test scenario 2
...

### E2E Tests
- User flow 1
- User flow 2
...

## Security Considerations
[Security analysis and mitigation strategies]

## Performance Considerations
[Performance impact and optimization strategies]

## Rollback Plan
[Steps to rollback if issues arise]

## Review Checklist
- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] Documentation updated
- [ ] Security review completed
- [ ] Performance impact assessed
```

## 6. Prepare Development Environment

### Create Feature Branch
```bash
git checkout -b feature/$ARGUMENTS-<short-description>
```

### Initialize Todo List
Create a comprehensive TodoWrite list with all implementation tasks identified in the plan, organized by priority and dependencies.

### Set Up Initial Structure
Create any necessary directories or placeholder files based on the implementation plan.

## 7. Create Draft Pull Request

### Push Feature Branch
```bash
git push -u origin feature/$ARGUMENTS-<short-description>
```

### Create Draft PR Manually
Since GitHub MCP is not available, create the PR manually using the GitHub web interface:
- Title: `$ARGUMENTS: [Ticket Title from Jira]`
- Body: Include link to Jira ticket and implementation plan summary
- Set as draft PR for early feedback
- The PR will automatically use the `.github/pull_request_template.md`

Suggested PR body template:
```markdown
## Jira Ticket
https://caddieaiapp.atlassian.net/browse/$ARGUMENTS

## Implementation Plan Summary
[Auto-populate from the local plan document]

## Notes
This is a draft PR for early feedback. The implementation is in progress.

---
*This PR was created as part of the automated Jira workflow*
```

### Update Jira Ticket
Use the JIRA MCP update-ticket tool to add the PR link to the ticket description or comments for traceability.

---

Throughout this entire process, use ultrathinking and multiple parallel agents to ensure comprehensive analysis and planning. The goal is to create a rock-solid implementation plan that anticipates edge cases, maintains code quality, and delivers value efficiently.
