# PomoWatch Test Plan

## Session Management Tests

### Current Session Management
- **Test Case 1.1**: On clicking "Start Break" / "Start Work"
  - Current session gets an entry and is shown
  - Session appears in the current session display
  - Timer starts counting down/up appropriately
  - Session type (work/break) is correctly set
  - Today's progress statistics are updated

- **Test Case 1.2**: On clicking "Stop" or "Reset"
  - Stop the existing session
  - Save the session to the database
  - Refresh the recent sessions list to show the last session
  - Clear the current session display
  - Session appears in the session history
  - Today's progress statistics are updated

- **Test Case 1.3**: On clicking "Pause"
  - Pause the existing running session
  - Session status changes to "paused"
  - Timer stops but session remains active
  - If user clicks start buttons after pause, stop existing timer and refresh the list
  - Then start the new timer
  - Today's progress statistics are updated

### Session Deletion Tests
- **Test Case 2.1**: On deleting a session
  - Delete confirmation popup appears
  - On confirmation, session is deleted from database
  - Session list is refreshed on closing the popup
  - Deleted session no longer appears in the list
  - Today's progress statistics are updated

- **Test Case 2.2**: On using "Clear All" button
  - Clear All confirmation modal appears
  - Modal shows session count and explains current session preservation
  - On confirmation, all completed sessions are deleted from database
  - Current running session is preserved
  - Session list is refreshed to show remaining sessions
  - Today's progress statistics are updated

### Statistics Updates
- **Test Case 3.1**: Today's Progress Statistics Updates
  - On all session actions (start, stop, reset, pause, delete, clear all)
  - Today's progress statistics are updated in real-time
  - Statistics reflect current session counts and durations
  - Progress bars and counters update immediately
  - Statistics persist across page refreshes

## Test Scenarios

### Scenario 1: Complete Work Session Cycle
1. Click "Start Work" → Current session shows work session
2. Let timer run for a few seconds
3. Click "Stop" → Session saved, appears in recent sessions, current session cleared
4. Verify today's statistics updated

### Scenario 2: Pause and Resume Session Flow
1. Click "Start Work" → Current session shows work session
2. Let timer run for a few seconds
3. Click "Pause" → Session status changes to "paused", timer stops
4. Click "Start Break" → Previous session stopped and saved, new break session starts
5. Verify session list refreshed with paused session
6. Verify today's statistics updated

### Scenario 3: Session Deletion Flow
1. Create multiple sessions (work and break)
2. Delete a specific session → Confirm deletion in modal
3. Verify session list refreshed on modal close, deleted session removed
4. Verify today's statistics updated

### Scenario 4: Clear All Sessions Flow
1. Create multiple sessions (including one running session)
2. Click "Clear All" → Clear All confirmation modal appears
3. Verify modal shows session count and explains current session preservation
4. Confirm action → All completed sessions deleted, current session preserved
5. Verify session list refreshed to show remaining sessions
6. Verify today's statistics updated

### Scenario 5: Statistics Real-time Updates
1. Start a work session → Verify statistics update
2. Pause session → Verify statistics update
3. Stop session → Verify statistics update
4. Delete session → Verify statistics update
5. Clear all → Verify statistics update

### Scenario 6: Current Session Preservation
1. Start a work session → Current session shows
2. Click "Clear All" → Modal appears
3. Confirm clear all → Only completed sessions deleted
4. Verify current running session is preserved and still shows
5. Verify session list shows only the current session

### Scenario 7: Settings Integration
1. Change settings (work duration, break duration, etc.)
2. Save settings → Timer stops and refreshes
3. Start new session → New settings applied
4. Verify timer uses new duration settings
5. Verify today's statistics updated with new session
