/**
 * ERPNext Integration Debug & Test Guide
 * 
 * This file documents how to debug and test the ERPNext financial report integration
 * according to the spec requirements.
 */

// ============================================================================
// DEBUGGING CHECKLIST
// ============================================================================

/*
When reports fail, follow this debugging sequence:

1. CHECK REQUEST PHASE
   - Look for "[v0] runReport request:" log
   - Verify report name is correct (exact match with ERPNext)
   - Verify filters are present and correct format
   - Check for "ignoreAsync: true/false"

2. CHECK INITIAL RESPONSE PHASE
   - Look for "[v0] Report initial response:" log
   - If isPrepared: true → go to POLLING PHASE
   - If has columns and data → report is synchronous (good)
   - If empty → may indicate permission issue

3. CHECK POLLING PHASE (if async)
   - Look for "[v0] Polling Prepared Report (attempt N/10):" logs
   - Verify docname is extracted: [v0] Prepared Report docname: XXX
   - Each attempt logs status check
   - Status should eventually be "Completed"
   - If "Error" → report generation failed on server
   - If timeout → may need more time or increased MAX_RETRIES

4. CHECK FINAL RESULT PHASE
   - Look for "[v0] Prepared Report completed successfully on attempt X/10"
   - Verify cache was set: reportCache.set(cacheKey, ...)
   - Result should have columns and data arrays

5. CHECK FALLBACK PHASE
   - If all polls fail after max retries
   - Look for "[v0] Prepared Report exceeded max retries (10). Aborting."
   - Should return empty { columns: [], data: [] }
   - Dashboard should show warning, not crash
*/

// ============================================================================
// FILTER VALIDATION REQUIREMENTS
// ============================================================================

/*
Financial Statement Reports require:
- company (required)
- period_start_date (required, ISO format YYYY-MM-DD)
- period_end_date (required, ISO format YYYY-MM-DD)
- periodicity (default "Monthly")
- accumulated_values (default 0)

DO NOT include:
- from_date / to_date (deprecated in newer ERPNext versions)
- from_fiscal_year / to_fiscal_year (causes async conversion)
- include_default_book_entries (causes async conversion)

Aging Reports require:
- company (required)

That's it. Keep filters minimal.
*/

// ============================================================================
// PREPARED REPORT BYPASS TESTING
// ============================================================================

/*
To test if ignore_prepared_report=True works on your instance:

1. In browser console or via curl:
   
   curl -H "Authorization: Token YOUR_API_KEY:YOUR_API_SECRET" \
     "https://your-erp.example.com/api/method/frappe.desk.query_report.run?report_name=Profit%20and%20Loss%20Statement&ignore_prepared_report=True"

2. If response has "columns" and "data" → bypass works
3. If response has "prepared_report: true" → bypass doesn't help, fall back to polling

The code tries bypass first, then falls back to polling automatically.
*/

// ============================================================================
// POLLING ENDPOINT VERIFICATION
// ============================================================================

/*
The polling endpoint must be exactly:
  GET /api/resource/Prepared Report/{docname}

Example:
  curl -H "Authorization: Token YOUR_API_KEY:YOUR_API_SECRET" \
    "https://your-erp.example.com/api/resource/Prepared%20Report/PRP-2024-00123"

Response should have:
  {
    "data": {
      "status": "Completed",
      "report_result": "{...JSON...}",
      ...other fields...
    }
  }

Statuses:
- "Queued" → keep polling
- "Running" → keep polling
- "Completed" → parse report_result
- "Error" → stop, report failed
*/

// ============================================================================
// TOKEN LIMIT ENFORCEMENT (300 tokens for AI)
// ============================================================================

/*
The AI insights must respect 300-token limit:

1. Data processor extracts ONLY totals from reports
   - E.g., total_income, total_expense, net_profit
   - NOT individual account rows

2. Consolidated summary is passed to AI
   - lib/ai-report-processor.ts creates compact JSON
   - consolidateReportSummaries() formats it

3. AI prompt in lib/gemini-client.ts limits output to 600 tokens
   - maxOutputTokens: 600 (conservative for summary)

4. Frontend ensures insights generated ONCE
   - Not on every data change
   - Not on auto-refresh
   - Only after explicit fetch + all reports loaded
*/

// ============================================================================
// FRONTEND STATE MACHINE
// ============================================================================

/*
Dashboard must follow this exact flow:

Idle
  ↓
User selects company + date range
  ↓
Ready (Fetch button enabled)
  ↓
User clicks Fetch
  ↓
Fetching (button disabled, loader shown)
  ↓
All reports loaded (success or warning)
  ↓
AI insights generated ONCE
  ↓
Stable (Refresh button available)

Key rules:
- NO auto-fetch on mount
- NO continuous polling (5-minute interval removed)
- NO fetch if filters incomplete
- NO AI insights until all reports done
*/

// ============================================================================
// RATE LIMIT ENFORCEMENT
// ============================================================================

/*
The system enforces:
- Max 10 polling attempts per report
- 2-3 seconds delay between attempts
- 5-minute cache (no re-fetch within 5 min for same report)
- No concurrent fetches (isFetchingRef prevents duplicates)

Max time per report: 10 attempts × 3 sec = 30 seconds
If longer, increase MAX_RETRIES in async-report-handler.ts
*/

// ============================================================================
// EXPECTED LOGS FOR SUCCESSFUL FLOW
// ============================================================================

/*
Here's what you should see for a successful fetch:

[v0] runReport request: {reportName: "Profit and Loss Statement", ...}
[v0] Attempting report with ignore_prepared_report=True bypass
[v0] Report initial response: {isPrepared: true, hasPreparedName: true}
[v0] Report "Profit and Loss Statement" is async (prepared_report: true)
[v0] Prepared Report docname: PRP-2024-00456
[v0] Starting polling: /api/resource/Prepared Report/PRP-2024-00456
[v0] Polling Prepared Report (attempt 1/10): PRP-2024-00456
[v0] Attempt 1/10: Status is "Running", continuing to poll...
[v0] Polling Prepared Report (attempt 2/10): PRP-2024-00456
[v0] Attempt 2/10: Status is "Completed", continuing to parse...
[v0] Prepared Report "PRP-2024-00456" completed successfully on attempt 2/10
[v0] Polling complete - result structure: {hasColumns: true, hasData: true, rowCount: 42}

Then for AI:
[v0] All reports loaded, generating AI insights once...
[v0] Consolidated data for AI (token-optimized): {report: "Profit and Loss", totals: {...}}
*/

export const DEBUG_GUIDE = "See comments above"
