# 🛠️ Server Scripts

## Cleanup Test Files

### Purpose
Safely remove test/development uploaded files from the `uploads/submissions` directory.

### Usage

```bash
# Preview what will be deleted (safe)
node scripts/cleanup-test-files.js

# Actually delete the files (destructive)
node scripts/cleanup-test-files.js --confirm
```

### What it does
- Lists all files in `uploads/submissions`
- Shows file sizes and total space used
- Requires `--confirm` flag to actually delete files
- Provides detailed logging of the cleanup process

### ⚠️ Warning
- This permanently deletes all uploaded files
- Database records will still exist (users will see "file not found" errors)
- Only use during development/testing or before production deployment

### When to use
- ✅ Cleaning up test files before production
- ✅ Starting fresh during development
- ✅ Freeing up disk space from test uploads
- ❌ Never use on production data without backup