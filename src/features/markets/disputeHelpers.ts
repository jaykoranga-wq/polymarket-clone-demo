export function extractDisputeData(timelineData: {
  data: { action: number; bondAmount: string; timestamp: number; identifier: string }[]
}) {
  const resolutions = timelineData?.data || []
  const latestPropose = [...resolutions]
    .reverse()
    .find((r: { action: number; bondAmount: string }) => r.action === 1 && r.bondAmount != null)

  if (latestPropose) {
    const bondMajor = parseFloat(latestPropose.bondAmount)
    // Convert to minor units string
    const bondMinor = BigInt(Math.round(bondMajor * 1_000_000)).toString()
    return {
      bondAmount: bondMinor,
      bondAmountUSDC: bondMajor,
      proposedTimestamp: latestPropose.timestamp,
      identifier: latestPropose.identifier,
    }
  }
  return null
}
