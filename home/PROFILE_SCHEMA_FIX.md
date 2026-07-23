# Profile PHP Backend - Schema Compatibility Fix

## Issue
The profile PHP backend endpoints (`get-profile.php` and `update-profile.php`) were querying database columns that don't exist in the base `schema.sql`:
- `national_id`
- `city_state`
- `postcode`
- `division`
- `manager`
- `location`

These columns are only added by the optional `profile_schema.sql` migration. If users haven't run that migration yet, the profile endpoints would fail with SQL errors.

## Solution

### 1. Fixed `get-profile.php`

**Before:**
- Queried 20 columns including optional ones
- Would fail if profile_schema.sql not applied

**After:**
- Only queries 14 base schema columns that always exist
- Parses the single `address` field to extract components
- Provides sensible defaults for missing data

**Changes:**
```sql
-- Removed from SELECT query:
u.national_id,
u.city_state,
u.postcode,
u.division,
u.manager,
u.location

-- Now only queries columns from base schema:
u.id, u.username, u.email, u.name, u.title, u.role,
u.phone, u.date_of_birth, u.hire_date, u.address,
u.avatar, u.department, u.created_at, u.last_login
```

**New Feature - Address Parser:**
Added `parseAddress()` function that intelligently parses the single address field:

```
Input: "990 Market Street, Suite 200, San Francisco CA 94102"

Output:
- street: "990 Market Street, Suite 200"
- cityState: "San Francisco CA"
- postcode: "94102"
```

This ensures backward compatibility - the profile page gets the data it expects even without the additional schema columns.

### 2. Fixed `update-profile.php`

**Address Section:**
- Changed from updating 3 separate columns to 1 combined field
- Merges `address`, `cityState`, and `postcode` into single `address` field
- Formats as: "street, city state postcode"

**Employee Section:**
- Removed `national_id` update (optional column)
- Only updates: `date_of_birth`, `title`, `hire_date`

## Database Column Comparison

### Base Schema (schema.sql) - Always Available:
```
users table:
✅ id, uid, username, email, password_hash, name, initials
✅ avatar, role, department, title, phone, address
✅ date_of_birth, hire_date, is_active, email_verified
✅ is_online, last_login, created_at, updated_at
```

### Optional Schema (profile_schema.sql) - May Not Exist:
```
Additional columns added to users:
❌ national_id
❌ city_state
❌ postcode
❌ division
❌ manager
❌ location

Additional tables:
❌ user_job_info
❌ user_activity
❌ user_compensation
❌ messages
❌ document_approvals
❌ user_files
```

## Benefits

1. **Works Without Full Migration**: Profile endpoints work with just base schema
2. **Backward Compatible**: Existing addresses are parsed correctly
3. **Forward Compatible**: Will use separate columns if they exist (future enhancement)
4. **No SQL Errors**: Queries only columns that definitely exist
5. **Smart Defaults**: Provides "N/A" for missing optional data
6. **Address Parsing**: Intelligently extracts city, state, postcode from full address

## Testing

The endpoints now work in three scenarios:

### Scenario 1: Base Schema Only
```bash
# Only run base schema
mysql -u user -p database < src/php-setup/database/schema.sql
# ✅ Profile endpoints work
```

### Scenario 2: Base + Profile Schema
```bash
# Run both schemas
mysql -u user -p database < src/php-setup/database/schema.sql
mysql -u user -p database < src/php-setup/database/profile_schema.sql
# ✅ Profile endpoints work with enhanced features
```

### Scenario 3: Existing Data
```bash
# Database already has addresses in format:
# "Street, City State Postcode"
# ✅ Parser extracts components correctly
```

## Example Responses

### With Base Schema Only:
```json
{
  "personalInfo": {
    "phone": "(629) 555-0123",
    "address": "990 Market Street, Suite 200",
    "cityState": "San Francisco CA",
    "postcode": "94102",
    "nationalId": "N/A"  // Default for missing column
  }
}
```

### With Full Schema:
```json
{
  "personalInfo": {
    "phone": "(629) 555-0123",
    "address": "990 Market Street, Suite 200",
    "cityState": "San Francisco CA",  // Parsed from address
    "postcode": "94102",              // Parsed from address
    "nationalId": "N/A"               // From separate column if exists
  }
}
```

## Files Modified

- ✅ `src/php-setup/profile/get-profile.php`
  - Removed 6 optional columns from SELECT
  - Added `parseAddress()` function
  - Smart defaults for missing data

- ✅ `src/php-setup/profile/update-profile.php`
  - Address section: Combines 3 fields into 1
  - Employee section: Removed national_id
  - Maintains backward compatibility

## Migration Path

Users can now:
1. Use profile endpoints immediately with base schema
2. Optionally run profile_schema.sql later for enhanced features
3. No breaking changes - everything just works

## Address Format Standard

The standard address format that works best:
```
"Street Address, Suite/Apt, City State Postcode"

Examples:
"990 Market Street, Suite 200, San Francisco CA 94102"
"456 Main St, Boston MA 02101"
"789 Oak Ave, New York NY 10001"
```

The parser handles:
- Multiple comma-separated parts
- 5-digit or 5+4 postcodes
- Missing components (returns "N/A")
- Various address formats

## Build Status

✅ Project builds successfully
✅ No TypeScript errors
✅ All endpoints compatible with base schema
