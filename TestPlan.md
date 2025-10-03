# PomoWatch Test Plan

## Session Management Tests

### Current Session Management
- **Test Case 1.1**: On clicking "Start Break" / "Start Work"
  - Current session gets an entry and is shown
  - Session appears in the current session display
  - Timer starts counting down/up appropriately
  - Session type (work/break) is correctly set

- **Test Case 1.2**: On clicking "Stop" or "Reset"
  - Stop the existing session
  - Save the session to the database
  - Refresh the recent sessions list to show the last session
  - Clear the current session display
  - Session appears in the session history

### Session Deletion Tests
- **Test Case 2.1**: On deleting a session
  - Delete confirmation popup appears
  - On confirmation, session is deleted from database
  - Session list is refreshed on closing the popup
  - Deleted session no longer appears in the list

- **Test Case 2.2**: On using "Clear All" button
  - All sessions are deleted from database
  - Session list is refreshed to show empty state
  - Confirmation dialog appears before clearing all

### Statistics Updates
- **Test Case 3.1**: Today's Progress Statistics Updates
  - On all session actions (start, stop, reset, delete, clear all)
  - Today's progress statistics are updated in real-time
  - Statistics reflect current session counts and durations
  - Progress bars and counters update immediately

## Test Scenarios

### Scenario 1: Complete Work Session Cycle
1. Click "Start Work" → Current session shows work session
2. Let timer run for a few seconds
3. Click "Stop" → Session saved, appears in recent sessions, current session cleared
4. Verify today's statistics updated

### Scenario 2: Session Deletion Flow
1. Create multiple sessions (work and break)
2. Delete a specific session → Confirm deletion
3. Verify session list refreshed, deleted session removed
4. Verify today's statistics updated

### Scenario 3: Clear All Sessions
1. Create multiple sessions
2. Click "Clear All" → Confirm action
3. Verify all sessions removed from list
4. Verify today's statistics reset/updated

### Scenario 4: Statistics Real-time Updates
1. Start a work session → Verify statistics update
2. Stop session → Verify statistics update
3. Delete session → Verify statistics update
4. Clear all → Verify statistics update
