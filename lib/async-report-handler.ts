/**
 * Async Report Handler - Handles ERPNext prepared_report: true responses
 * When a report returns prepared_report: true, it means the report is being
 * processed asynchronously and we need to poll for the result separately
 */

const MAX_RETRIES = 10 // Max 10 retries per spec (30 seconds with 3-second intervals)
const RETRY_DELAY = 3000 // 3 seconds between retries per spec
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
 */
export function isPreparedReport(response: any): response is PreparedReportResponse {
  return response?.prepared_report === true && typeof response?.name === "string"
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
      `[v0] Prepared Report "${reportDocName}" exceeded max retries (${MAX_RETRIES}). Aborting.`
    )
    return { message: { result: [], columns: [] } }
  }

  // Wait before retrying (except on first attempt)
  if (retryCount > 0) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
  }

  try {
    // Use correct endpoint per spec: /api/resource/Prepared Report/{name}
    const url = `${erpUrl}/api/resource/Prepared%20Report/${encodeURIComponent(reportDocName)}`
    const token = `Token ${apiKey}:${apiSecret}`

    console.log(`[v0] Polling Prepared Report (attempt ${retryCount + 1}/${MAX_RETRIES}): ${reportDocName}`)

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
        `[v0] Attempt ${retryCount + 1}/${MAX_RETRIES}: Status is "${docData.status}", continuing to poll...`
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
 * Per spec: Extract name from response and poll Prepared Report doctype
 */
export async function handleReportRequest(
  initialResponse: any,
  erpUrl: string,
  reportName: string,
  apiKey: string,
  apiSecret: string
): Promise<any> {
  // If response indicates async processing, fetch the result
  if (isPreparedReport(initialResponse)) {
    console.log(`[v0] Report "${reportName}" is async (prepared_report: true)`)
    console.log(`[v0] Prepared Report docname: ${initialResponse.name}`)
    console.log(`[v0] Starting polling: /api/resource/Prepared Report/${initialResponse.name}`)

    // Use the docname from the response to poll the Prepared Report
    const result = await fetchPreparedReportResult(erpUrl, initialResponse.name, apiKey, apiSecret)

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
