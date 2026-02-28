/**
 * Async Report Handler - Handles ERPNext prepared_report: true responses
 * When a report returns prepared_report: true, it means the report is being
 * processed asynchronously and we need to poll for the result separately
 */

const MAX_RETRIES = 30 // Max 30 retries (3 minutes with 6-second intervals)
const RETRY_DELAY = 6000 // 6 seconds between retries

interface PreparedReportResponse {
  prepared_report: true
  report_name?: string
}

interface ReportResultResponse {
  message?: {
    keys?: string[]
    result?: any[]
    columns?: any[]
    [key: string]: any
  }
  data?: any
  [key: string]: any
}

/**
 * Checks if a response indicates an async prepared report
 */
export function isPreparedReport(response: any): response is PreparedReportResponse {
  return response?.prepared_report === true
}

/**
 * Polls for async report result using get_report_result
 * Retries up to MAX_RETRIES times with RETRY_DELAY between attempts
 */
export async function fetchPreparedReportResult(
  erpUrl: string,
  reportName: string,
  apiKey: string,
  apiSecret: string,
  retryCount = 0
): Promise<ReportResultResponse> {
  if (retryCount >= MAX_RETRIES) {
    console.warn(
      `[v0] Async report "${reportName}" exceeded max retries (${MAX_RETRIES}). Returning empty result.`
    )
    return { message: { result: [], columns: [] } }
  }

  // Wait before retrying (except on first attempt)
  if (retryCount > 0) {
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY))
  }

  try {
    const url = `${erpUrl}/api/method/frappe.desk.query_report.get_report_result`
    const token = `Token ${apiKey}:${apiSecret}`

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify({ report_name: reportName }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.warn(
        `[v0] Retry ${retryCount + 1}/${MAX_RETRIES}: get_report_result returned ${response.status}`
      )
      return fetchPreparedReportResult(erpUrl, reportName, apiKey, apiSecret, retryCount + 1)
    }

    const result = await response.json()

    // If the result still indicates prepared_report, continue polling
    if (isPreparedReport(result)) {
      console.log(`[v0] Retry ${retryCount + 1}/${MAX_RETRIES}: Report still being prepared...`)
      return fetchPreparedReportResult(erpUrl, reportName, apiKey, apiSecret, retryCount + 1)
    }

    console.log(
      `[v0] Async report "${reportName}" resolved on retry ${retryCount + 1}/${MAX_RETRIES}`
    )
    return result
  } catch (error) {
    console.warn(
      `[v0] Retry ${retryCount + 1}/${MAX_RETRIES}: Error fetching report result:`,
      error
    )
    return fetchPreparedReportResult(erpUrl, reportName, apiKey, apiSecret, retryCount + 1)
  }
}

/**
 * Handles initial report request and automatically fetches if async
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
    console.log(`[v0] Report "${reportName}" is async (prepared_report: true). Polling for result...`)
    return fetchPreparedReportResult(erpUrl, reportName, apiKey, apiSecret)
  }

  // Otherwise return the initial response
  return initialResponse
}
