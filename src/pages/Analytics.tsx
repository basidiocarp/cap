import { Alert, Card, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core'
import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { myceliumApi } from '../lib/api'

interface GainData {
  total_commands?: number
  total_input?: number
  total_output?: number
  total_saved?: number
  avg_savings_pct?: number
  by_command?: [string, number, number, number, number][]
  by_day?: [string, number][]
}

export function Analytics() {
  const [gain, setGain] = useState<GainData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    myceliumApi
      .gain()
      .then((data) => setGain(data as GainData))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Group
        justify='center'
        mt='xl'
      >
        <Loader />
      </Group>
    )
  }

  if (error) {
    return (
      <Alert
        color='red'
        title='Error'
      >
        {error}
      </Alert>
    )
  }

  if (!gain) {
    return <Text c='dimmed'>No analytics data available.</Text>
  }

  const dailyData = (gain.by_day ?? []).map(([date, saved]) => ({ date, saved }))

  const commandData = (gain.by_command ?? []).map(([cmd, input, output, pct]) => ({
    cmd,
    input,
    output,
    savings: pct,
  }))

  return (
    <Stack>
      <Title order={2}>Analytics</Title>

      <Grid>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card
            padding='lg'
            shadow='sm'
            withBorder
          >
            <Text
              c='dimmed'
              size='xs'
            >
              Total Commands
            </Text>
            <Title order={3}>{gain.total_commands?.toLocaleString() ?? '\u2014'}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card
            padding='lg'
            shadow='sm'
            withBorder
          >
            <Text
              c='dimmed'
              size='xs'
            >
              Tokens Saved
            </Text>
            <Title order={3}>{gain.total_saved?.toLocaleString() ?? '\u2014'}</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card
            padding='lg'
            shadow='sm'
            withBorder
          >
            <Text
              c='dimmed'
              size='xs'
            >
              Avg Savings
            </Text>
            <Title order={3}>{gain.avg_savings_pct?.toFixed(1) ?? '\u2014'}%</Title>
          </Card>
        </Grid.Col>
        <Grid.Col span={{ base: 6, md: 3 }}>
          <Card
            padding='lg'
            shadow='sm'
            withBorder
          >
            <Text
              c='dimmed'
              size='xs'
            >
              Input Tokens
            </Text>
            <Title order={3}>{gain.total_input?.toLocaleString() ?? '\u2014'}</Title>
          </Card>
        </Grid.Col>
      </Grid>

      {dailyData.length > 0 && (
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Daily Token Savings
          </Title>
          <ResponsiveContainer
            height={300}
            width='100%'
          >
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='date' />
              <YAxis />
              <Tooltip />
              <Line
                dataKey='saved'
                name='Tokens Saved'
                stroke='#339af0'
                strokeWidth={2}
                type='monotone'
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {commandData.length > 0 && (
        <Card
          padding='lg'
          shadow='sm'
          withBorder
        >
          <Title
            mb='md'
            order={4}
          >
            Savings by Command
          </Title>
          <ResponsiveContainer
            height={300}
            width='100%'
          >
            <BarChart data={commandData}>
              <CartesianGrid strokeDasharray='3 3' />
              <XAxis dataKey='cmd' />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey='input'
                fill='#868e96'
                name='Input Tokens'
              />
              <Bar
                dataKey='output'
                fill='#339af0'
                name='Output Tokens'
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </Stack>
  )
}
