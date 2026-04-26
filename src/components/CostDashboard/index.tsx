import { Alert, Card, Grid, Group, Progress, Stack, Text } from '@mantine/core'
import { useEffect, useState } from 'react'

import type { BudgetStatus, CostSummary } from '../../api/costs'
import { getBudgetStatus, getCostSummary } from '../../api/costs'
import { KpiCard } from '../KpiCard'

export function CostDashboard() {
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [status, setStatus] = useState<BudgetStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [summaryData, statusData] = await Promise.all([getCostSummary(), getBudgetStatus()])
        setSummary(summaryData)
        setStatus(statusData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cost data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
    const interval = setInterval(loadData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <Text>Loading cost data...</Text>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert
        color='red'
        title='Error Loading Cost Data'
      >
        {error}
      </Alert>
    )
  }

  const percentUsed = status && status.status !== 'ok' && 'percent' in status && status.limit_usd ? (status.percent / 100) * 100 : 0

  return (
    <Stack gap='md'>
      {status && status.status !== 'ok' && (
        <Alert
          color={status.status === 'warning' ? 'yellow' : 'red'}
          title={status.status === 'warning' ? 'Budget Warning' : 'Budget Exceeded'}
        >
          {status.status === 'warning' ? (
            <>
              You have reached {Math.round(('percent' in status ? status.percent : 0) * 10) / 10}% of your budget limit.
              <br />
              Current spend: ${status.spent_usd.toFixed(2)} / ${status.limit_usd?.toFixed(2)}
            </>
          ) : (
            <>
              You have exceeded your budget limit.
              <br />
              Current spend: ${status.spent_usd.toFixed(2)} / ${status.limit_usd?.toFixed(2)}
            </>
          )}
        </Alert>
      )}

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='blue'
            label='Today'
            value={`$${summary?.today_usd.toFixed(2) || '0.00'}`}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='blue'
            label='This Week'
            value={`$${summary?.week_usd.toFixed(2) || '0.00'}`}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <KpiCard
            accent='blue'
            label='This Month'
            value={`$${summary?.month_usd.toFixed(2) || '0.00'}`}
          />
        </Grid.Col>
      </Grid>

      {status && (status.status === 'warning' || status.status === 'exceeded') && (
        <Card
          padding='lg'
          radius='md'
          shadow='sm'
          withBorder
        >
          <Stack gap='sm'>
            <Group justify='space-between'>
              <Text
                c='dimmed'
                size='xs'
              >
                Budget Usage
              </Text>
              <Text size='sm'>{Math.round(percentUsed * 10) / 10}% of limit</Text>
            </Group>
            <Progress
              color={status.status === 'warning' ? 'yellow' : 'red'}
              value={percentUsed}
            />
          </Stack>
        </Card>
      )}
    </Stack>
  )
}
