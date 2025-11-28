import PredictionClient from "./PredictionClient";

// Force dynamic rendering to ensure runtime environment variables are read
// instead of being statically baked (as undefined) at build time.
export const dynamic = "force-dynamic";

// This is a Server Component by default in App Router
export default function Page() {
  // Read env vars at runtime (server-side)
  const alertAppUrl = process.env.ALERT_APP_URL;
  const chartId = process.env.CHART_ID;
  const chartsBaseUrl = process.env.CHARTS_BASE_URL;

  return (
    <PredictionClient
      alertAppUrl={alertAppUrl}
      chartId={chartId}
      chartsBaseUrl={chartsBaseUrl}
    />
  );
}
