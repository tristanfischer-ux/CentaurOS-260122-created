# Offline Mode Test Checklist

## Prerequisites
- Device with network toggle capability
- App installed and running
- At least one task created

## Test Cases

### 1. Offline Detection
- [ ] Turn off airplane mode → Banner shows "Offline mode" (amber)
- [ ] Turn on airplane mode → Banner disappears
- [ ] Connection type changes (wifi→cellular) → No interruption
- [ ] Slow/unstable connection → Appropriate behavior

### 2. Offline Task Creation
- [ ] Go offline
- [ ] Create a new task manually → Task saves locally
- [ ] Edit task title → Changes persist
- [ ] Edit task notes → Changes persist
- [ ] Change assignee → Changes persist
- [ ] Change due date → Changes persist
- [ ] Go online → No data loss

### 3. Voice Recording Offline
- [ ] Go offline
- [ ] Record voice → Recording saves locally
- [ ] See "Pending transcription" status
- [ ] Go online → Recording transcribes
- [ ] Transcript appears in UI

### 4. Task Extraction Offline
- [ ] Go offline
- [ ] Enter text in WHAT tab
- [ ] Submit for extraction → Job queues
- [ ] See "Pending AI" indicator
- [ ] Go online → Extraction runs
- [ ] Tasks appear in UI

### 5. WHY Flow Offline
- [ ] Go offline
- [ ] Start WHY conversation
- [ ] User messages save locally
- [ ] See "Pending AI" for response
- [ ] Go online → AI responds
- [ ] Conversation continues normally

### 6. Sync Behavior
- [ ] Queue multiple jobs offline
- [ ] Go online → Jobs process in priority order
- [ ] "Syncing..." indicator shows
- [ ] Jobs complete → "Pending" count decreases
- [ ] All jobs complete → Banner hides

### 7. Retry Logic
- [ ] Queue a job
- [ ] Cause it to fail (invalid data)
- [ ] Job retries automatically
- [ ] After 3 failures → Marked as failed
- [ ] Error visible in UI

### 8. Manual Sync
- [ ] Have pending jobs
- [ ] Be online
- [ ] Tap "Sync now" → Jobs process immediately

### 9. Cached Data Viewing
- [ ] Load marketplace data while online
- [ ] Go offline
- [ ] Marketplace data still viewable
- [ ] Can browse cached profiles
- [ ] Actions that need network show appropriate error

### 10. Edge Cases
- [ ] Rapid online/offline toggling → No crashes
- [ ] Very large audio file → Handles gracefully
- [ ] Many pending jobs (10+) → UI remains responsive
- [ ] App restart with pending jobs → Jobs persist

## Performance Checks
- [ ] Storage usage reasonable (<50MB typical)
- [ ] No memory leaks with many jobs
- [ ] UI smooth during sync

## Results

| Test | Pass | Fail | Notes |
|------|------|------|-------|
| 1. Offline Detection | | | |
| 2. Offline Task Creation | | | |
| 3. Voice Recording Offline | | | |
| 4. Task Extraction Offline | | | |
| 5. WHY Flow Offline | | | |
| 6. Sync Behavior | | | |
| 7. Retry Logic | | | |
| 8. Manual Sync | | | |
| 9. Cached Data Viewing | | | |
| 10. Edge Cases | | | |

## Issues Found

1.
2.
3.

## Sign-off

Tested by: _______________
Date: _______________
Build: _______________
