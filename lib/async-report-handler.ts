/**
 * Async Report Handler - Handles ERPNext prepared_report: true responses
 * When a report returns prepared_report: true, it means the report is being
 * processed asynchronously and we need to poll for the result separately
 */

// ERPNext prepared reports need 1-2 minutes to complete
// Allow 30+ retries with 60 second delays = up to 30 minutes wait time
const MAX_RETRIES = 30 // 30 retries with 60s delays = 30 minutes max wait
const RETRY_DELAY = 60000 // 60 seconds (1 minute) between retries - ERPNext needs time!
const INITIAL_WAIT_BEFORE_SEARCH = 90000 // 90 seconds (1.5 minutes) before first search - give ERPNext time to create Prepared Report
const CACHE_DURATION = 5 * 60 * 1000 // 5 minute cache

interface PreparedReportResponse {
  prepared_report: true
  name: string // Critical: Report docname for polling
  [key: string]: any
}

interface PreparedReportDocResponse {
  data?: {
    status: string
    report_result?: string // JSON string containing the actual report data
    [key: string]: any
  }
  [key: string]: any
}

interface ReportCache {
  data: any
  timestamp: number
}

const reportCache = new Map<string, ReportCache>()

/**
 * Checks if a response indicates an async prepared report
 * Can have name (direct polling) or no name (need to discover via filters)
 */
export function isPreparedReport(response: any): boolean {
  return response?.prepared_report === true
}

/**
 * Searches for Prepared Report by report name and filters
 * When prepared_report: true is returned without a name, we query the list
 */
async function findPreparedReportByFilters(
  erpUrl: string,
  reportName: string,
  filters: Record<string, any>,
  apiKey: string,
  apiSecret: string,
  retryCount = 0
): Promise<string | null> {
  if (retryCount >= MAX_RETRIES) {
    console.error(`[v0] Could not find Prepared Report for "${reportName}" after ${MAX_RETRIES} retries (${(MAX_RETRIES * RETRY_DELAY) / 1000 / 60} minutes)`)
    return null
  }

  // Wait BEFORE first attempt (give ERPNext time to create the Prepared Report)
  if (retryCount === 0) {
    console.log(`[v0] Waiting ${INITIAL_WAIT_BEFORE_SEARCH / 1000 / 60} minutes before searching for Prepared Report...`)
    await new Promise((resolve) => setTimeout(resolve, INITIAL_WAIT_BEFORE_SEARCH))
  } else {
    // Wait between retries (ERPNext needs time to complete report processing)
    console.log(`[v0] Waiting ${RETRY_DELAY / 1000 / 60} minutes before next attempt...`)
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
  }

  try {
    // Query for recently created Prepared Report matching this report
    // Filter by report_name and creation time (within last 30 seconds)
    const url = `${erpUrl}/api/resource/Prepared Report?filters=[["report_name","=","${reportName}"]]&fields=["name","status","creation"]&order_by=creation desc&limit_page_length=1`
    const token = `Token ${apiKey}:${apiSecret}`

    console.log(`[v0] Searching for Prepared Report (attempt ${retryCount + 1}/5): ${reportName}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    })

    if (!response.ok) {
      console.warn(`[v0] Prepared Report search returned ${response.status}, retrying...`)
      return findPreparedReportByFilters(erpUrl, reportName, filters, apiKey, apiSecret, retryCount + 1)
    }

    const result = await response.json()
    const records = result.data

    if (!Array.isArray(records) || records.length === 0) {
      console.log(
        `[v0] No Prepared Report found yet (attempt ${retryCount + 1}/5), retrying...`
      )
      return findPreparedReportByFilters(erpUrl, reportName, filters, apiKey, apiSecret, retryCount + 1)
    }

    const mostRecent = records[0]
    console.log(`[v0] Found Prepared Report: ${mostRecent.name} (status: ${mostRecent.status})`)

    return mostRecent.name
  } catch (error) {
    console.warn(
      `[v0] Error searching for Prepared Report (attempt ${retryCount + 1}/5):`,
      error
    )
    return findPreparedReportByFilters(erpUrl, reportName, filters, apiKey, apiSecret, retryCount + 1)
  }
}

/**
 * Polls for async report result using Prepared Report doctype
 * Correct endpoint per spec: GET /api/resource/Prepared Report/{name}
 * Retries up to MAX_RETRIES times with RETRY_DELAY between attempts
 */
export async function fetchPreparedReportResult(
  erpUrl: string,
  reportDocName: string,
  apiKey: string,
  apiSecret: string,
  retryCount = 0
): Promise<any> {
  // Check cache first
  const cacheKey = `${erpUrl}:${reportDocName}`
  const cached = reportCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[v0] Using cached result for Prepared Report "${reportDocName}"`)
    return cached.data
  }

  if (retryCount >= MAX_RETRIES) {
    console.error(
      `[v0] Prepared Report "${reportDocName}" exceeded max retries (${MAX_RETRIES} retries = ${(MAX_RETRIES * RETRY_DELAY) / 1000 / 60} minutes). Aborting.`
    )
    return { message: { result: [], columns: [] } }
  }

  // Wait before retrying (except on first attempt - we already waited in findPreparedReportByFilters)
  if (retryCount > 0) {
    console.log(`[v0] Waiting ${RETRY_DELAY / 1000 / 60} minutes before polling attempt ${retryCount + 1}/${MAX_RETRIES}...`)
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
  }

  try {
    // Use correct endpoint per spec: /api/resource/Prepared Report/{name}
    const url = `${erpUrl}/api/resource/Prepared%20Report/${encodeURIComponent(reportDocName)}`
    const token = `Token ${apiKey}:${apiSecret}`

    console.log(`[v0] Polling Prepared Report (attempt ${retryCount + 1}/${MAX_RETRIES}, elapsed ~${(retryCount * RETRY_DELAY) / 1000 / 60}min): ${reportDocName}`)

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
    })

    if (!response.ok) {
      console.warn(
        `[v0] Attempt ${retryCount + 1}/${MAX_RETRIES}: Prepared Report endpoint returned ${response.status}`
      )
      return fetchPreparedReportResult(erpUrl, reportDocName, apiKey, apiSecret, retryCount + 1)
    }

    const result: PreparedReportDocResponse = await response.json()
    const docData = result.data

    if (!docData) {
      console.warn(`[v0] Attempt ${retryCount + 1}/${MAX_RETRIES}: No document data in response`)
      return fetchPreparedReportResult(erpUrl, reportDocName, apiKey, apiSecret, retryCount + 1)
    }

    // Check status - per spec, stop on Error or continue on Completed
    if (docData.status === "Error") {
      console.error(`[v0] Prepared Report "${reportDocName}" has Error status. Aborting.`)
      return { message: { result: [], columns: [] } }
    }

    if (docData.status !== "Completed") {
      console.log(
        `[v0] Attempt ${retryCount + 1}/${MAX_RETRIES}: Status is "${docData.status}", waiting ${RETRY_DELAY / 1000 / 60}min before next poll...`
      )
      return fetchPreparedReportResult(erpUrl, reportDocName, apiKey, apiSecret, retryCount + 1)
    }

    // Status is Completed - parse report_result
    const reportResult = docData.report_result
    if (!reportResult) {
      console.warn(`[v0] Completed report has no report_result. Returning empty.`)
      return { message: { result: [], columns: [] } }
    }

    // report_result is typically a JSON string
    let parsedResult = reportResult
    if (typeof reportResult === "string") {
      try {
        parsedResult = JSON.parse(reportResult)
      } catch {
        // If not JSON, use as-is
        parsedResult = reportResult
      }
    }

    console.log(
      `[v0] Prepared Report "${reportDocName}" completed successfully on attempt ${retryCount + 1}/${MAX_RETRIES}`
    )

    // Cache the result
    reportCache.set(cacheKey, { data: parsedResult, timestamp: Date.now() })

    return parsedResult
  } catch (error) {
    console.warn(
      `[v0] Attempt ${retryCount + 1}/${MAX_RETRIES}: Error fetching Prepared Report:`,
      error
    )
    return fetchPreparedReportResult(erpUrl, reportDocName, apiKey, apiSecret, retryCount + 1)
  }
}

/**
 * Handles initial report request and automatically fetches if async
 * Two cases:
 * 1. prepared_report: true with name -> poll directly
 * 2. prepared_report: true without name -> discover via filter search
 */
export async function handleReportRequest(
  initialResponse: any,
  erpUrl: string,
  reportName: string,
  apiKey: string,
  apiSecret: string,
  filters?: Record<string, any>
): Promise<any> {
  // If response indicates async processing, fetch the result
  if (isPreparedReport(initialResponse)) {
    console.log(`[v0] Report "${reportName}" is async (prepared_report: true)`)

    let reportDocName = initialResponse.name

    // Case 1: Name is included in response
    if (reportDocName) {
      console.log(`[v0] Prepared Report docname provided: ${reportDocName}`)
    } else {
      // Case 2: No name provided - discover via filter search
      console.log(`[v0] No docname provided, searching for Prepared Report by filters...`)
      reportDocName = await findPreparedReportByFilters(erpUrl, reportName, filters || {}, apiKey, apiSecret)

      if (!reportDocName) {
        console.error(`[v0] Failed to find Prepared Report for "${reportName}"`)
        return { columns: [], data: [], error: "Could not locate prepared report" }
      }
    }

    console.log(`[v0] Starting polling: /api/resource/Prepared Report/${reportDocName}`)

    // Poll the Prepared Report until complete
    const result = await fetchPreparedReportResult(erpUrl, reportDocName, apiKey, apiSecret)

    console.log("[v0] Polling complete - result structure:", {
      hasColumns: !!result?.columns,
      hasData: !!result?.data,
      rowCount: Array.isArray(result?.data) ? result.data.length : 0,
    })

    return result
  }

  // Otherwise return the initial response (already complete)
  console.log(`[v0] Report "${reportName}" returned synchronously (no prepared_report flag)`)
  return initialResponse
}
