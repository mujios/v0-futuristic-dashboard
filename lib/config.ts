export const config = {
  // Local Dashboard Authentication
  dashboardUsername: process.env.DASHBOARD_USERNAME || "Administrator",
  dashboardPassword: process.env.DASHBOARD_PASS || "admin",

  // ERPNext Configuration
  erpUrl: process.env.NEXT_PUBLIC_ERP_URL || "https://demo.erpnext.com",
  erpApiKey: process.env.ERP_API_KEY,
  erpApiSecret: process.env.ERP_API_SECRIT,

  // Gemini AI Configuration
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-1.5-flash",

  // App Configuration
  nodeEnv: process.env.NODE_ENV || "development",
  appName: "ERPNext 3D Dashboards",
}

export function validateConfig(): string[] {
  const errors: string[] = []

  if (!process.env.GEMINI_API_KEY) {
    errors.push("GEMINI_API_KEY environment variable is not set")
  }

  if (!process.env.ERP_API_KEY) {
    errors.push("ERP_API_KEY environment variable is not set")
  }

  if (!process.env.ERP_API_SECRIT) {
    errors.push("ERP_API_SECRIT environment variable is not set")
  }

  return errors
}
