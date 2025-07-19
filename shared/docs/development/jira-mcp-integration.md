# JIRA MCP Integration Guide

## Overview

This guide covers the JIRA Model Context Protocol (MCP) server integration for the CaddieAI project, enabling seamless project management directly from Claude Code.

## Configuration

### MCP Server Details
- **Server Name**: `jira-api`
- **Type**: SSE (Server-Sent Events)
- **URL**: `https://caddieaiapp.atlassian.net/rest/api/3`
- **Project Key**: `ECS` (CaddieAI)
- **Status**: ✅ Active and configured

### Files
- **Configuration**: `.mcp.json` - Server metadata and capabilities
- **Environment**: `.env.mcp` - Credentials (secured in .gitignore)
- **Authentication**: Basic Auth with API token

## Available Operations

### 1. Query Project Information
```bash
# Get ECS project details
curl -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE_URL}/rest/api/3/project/ECS"
```

### 2. Search Issues
```bash
# Get recent issues from ECS project
curl -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE_URL}/rest/api/3/search?jql=project=ECS&maxResults=5"

# Filter by status
curl -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE_URL}/rest/api/3/search?jql=project=ECS AND status='To Do'"
```

### 3. Get Specific Issue
```bash
# Get issue details by key
curl -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE_URL}/rest/api/3/issue/ECS-45?fields=key,summary,status,description"
```

### 4. Create New Issue
```bash
# Create a new story
curl -X POST -H "Content-Type: application/json" \
  -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  -d '{
    "fields": {
      "project": {"key": "ECS"},
      "summary": "Issue summary",
      "description": "Issue description",
      "issuetype": {"name": "Story"}
    }
  }' \
  "${JIRA_BASE_URL}/rest/api/3/issue"
```

### 5. Update Issue Status
```bash
# Transition issue to different status
curl -X POST -H "Content-Type: application/json" \
  -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  -d '{
    "transition": {"id": "transition_id"}
  }' \
  "${JIRA_BASE_URL}/rest/api/3/issue/ECS-45/transitions"
```

## Using with Claude Code

### Quick Commands in Claude Code
When running `claude` in your CaddieAI project directory, you can ask Claude to:

1. **Query Current Work**:
   - "What JIRA tickets are currently in progress for ECS?"
   - "Show me the latest tickets for the location tracking epic"
   - "What's the status of ECS-45?"

2. **Create Development Tasks**:
   - "Create a JIRA ticket for the bug we just found in LocationService"
   - "Add a story for implementing the new chat feature"

3. **Project Planning**:
   - "What tickets are left to complete the AI Chat Integration epic?"
   - "Show me all open tickets assigned to the Round Management epic"

### MCP Server Commands
```bash
# List available MCP servers
claude mcp list

# Get server details
claude mcp get jira-api

# Remove server (if needed)
claude mcp remove "jira-api" -s local
```

## Current Project Structure

### Active Epics in ECS Project:
- **ECS-24**: Round Management (Location tracking, GPS integration)
- **ECS-25**: AI Chat Integration (Chat screens, state management)
- **ECS-26**: Course Management API (Course data, API endpoints)

### Recent Tickets:
- **ECS-45**: Chat State Management Implementation
- **ECS-44**: AI Chat Screen Implementation
- **ECS-43**: Chat API Service Implementation
- **ECS-42**: Location Service Implementation
- **ECS-41**: Course Management API endpoints

## Security Best Practices

1. **Credentials Management**:
   - ✅ `.env.mcp` is in `.gitignore`
   - ✅ API token uses Basic Auth
   - ✅ Limited scope permissions

2. **Access Control**:
   - Server configured for local project only
   - Read/write access to ECS project
   - No access to other JIRA projects

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   ```bash
   # Verify credentials
   source .env.mcp
   echo "Testing connection..."
   curl -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
     "${JIRA_BASE_URL}/rest/api/3/myself"
   ```

2. **Server Not Found**:
   ```bash
   # Check MCP server status
   claude mcp list
   
   # Re-add server if missing
   claude mcp add jira-api -s local \
     'https://caddieaiapp.atlassian.net/rest/api/3'
   ```

3. **Permission Denied**:
   - Verify API token has correct permissions
   - Check JIRA project access rights
   - Ensure token hasn't expired

### Validation Commands
```bash
# Test basic connectivity
source .env.mcp && curl -s -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE_URL}/rest/api/3/project" | head -20

# Test project access
source .env.mcp && curl -s -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE_URL}/rest/api/3/project/ECS"

# Test issue query
source .env.mcp && curl -s -u "${JIRA_USERNAME}:${JIRA_API_TOKEN}" \
  "${JIRA_BASE_URL}/rest/api/3/search?jql=project=ECS&maxResults=1"
```

## Integration Benefits

1. **Seamless Workflow**: Create and manage tickets without leaving the terminal
2. **Context Awareness**: Claude can reference specific tickets while coding
3. **Automated Documentation**: Link code changes to JIRA tickets
4. **Real-time Updates**: Query current sprint status and progress
5. **Reduced Context Switching**: Stay in development environment

## Next Steps

1. **Team Access**: Share MCP configuration with team members
2. **Workflow Automation**: Set up automatic ticket creation for bugs
3. **Sprint Integration**: Add sprint management capabilities
4. **Reporting**: Create automated progress reports

---

*Last Updated: July 19, 2025*
*MCP Server Version: Local project configuration*
*JIRA Instance: https://caddieaiapp.atlassian.net*