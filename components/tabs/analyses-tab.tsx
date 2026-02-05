'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
  eachDayOfInterval,
  isSameDay,
  addDays,
  subDays,
  parseISO
} from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  CalendarIcon,
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip
} from 'recharts'
import { useData } from '@/lib/data-context'
import type { PeriodType, KPIData, ChartDataPoint, Insight } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { cn } from '@/lib/utils'

export function AnalysesTab() {
  const { data } = useData()
  
  // Filters state
  const [period, setPeriod] = useState<PeriodType>('semaine')
  const [referenceDate, setReferenceDate] = useState(new Date())
  const [selectedTypologies, setSelectedTypologies] = useState<string[]>([])
  const [showDetails, setShowDetails] = useState(false)
  const [showTrendLine, setShowTrendLine] = useState(false)
  const [chartType, setChartType] = useState<'simple' | 'stacked'>('simple')

  // Get active typologies
  const activeTypologies = useMemo(() =>
    data.typologies.filter(t => t.actif).sort((a, b) => a.ordre - b.ordre),
    [data.typologies]
  )

  // Calculate period bounds
  const periodBounds = useMemo(() => {
    let start: Date
    let end: Date
    let prevStart: Date
    let prevEnd: Date

    switch (period) {
      case 'jour':
        start = referenceDate
        end = referenceDate
        prevStart = subDays(referenceDate, 1)
        prevEnd = subDays(referenceDate, 1)
        break
      case 'semaine':
        start = startOfWeek(referenceDate, { locale: fr })
        end = endOfWeek(referenceDate, { locale: fr })
        prevStart = startOfWeek(subWeeks(referenceDate, 1), { locale: fr })
        prevEnd = endOfWeek(subWeeks(referenceDate, 1), { locale: fr })
        break
      case 'mois':
        start = startOfMonth(referenceDate)
        end = endOfMonth(referenceDate)
        prevStart = startOfMonth(subMonths(referenceDate, 1))
        prevEnd = endOfMonth(subMonths(referenceDate, 1))
        break
      case 'annee':
        start = startOfYear(referenceDate)
        end = endOfYear(referenceDate)
        prevStart = startOfYear(subYears(referenceDate, 1))
        prevEnd = endOfYear(subYears(referenceDate, 1))
        break
    }

    // Don't go beyond today
    const today = new Date()
    if (end > today) end = today

    return { start, end, prevStart, prevEnd }
  }, [period, referenceDate])

  // Get data for current period
  const periodData = useMemo(() => {
    const { start, end } = periodBounds
    const startStr = format(start, 'yyyy-MM-dd')
    const endStr = format(end, 'yyyy-MM-dd')
    
    return data.jours.filter(j => j.date >= startStr && j.date <= endStr)
  }, [data.jours, periodBounds])

  // Get data for previous period
  const prevPeriodData = useMemo(() => {
    const { prevStart, prevEnd } = periodBounds
    const startStr = format(prevStart, 'yyyy-MM-dd')
    const endStr = format(prevEnd, 'yyyy-MM-dd')
    
    return data.jours.filter(j => j.date >= startStr && j.date <= endStr)
  }, [data.jours, periodBounds])

  // Calculate KPIs
  const kpiData: KPIData = useMemo(() => {
    const typologiesToInclude = selectedTypologies.length > 0
      ? selectedTypologies
      : activeTypologies.map(t => t.id)

    // Calculate totals
    let totalPeriode = 0
    let jourMax: { date: string; total: number } | null = null
    let jourMin: { date: string; total: number } | null = null
    const typologieTotals: Record<string, number> = {}

    periodData.forEach(jour => {
      let jourTotal = 0
      jour.typologies.forEach(t => {
        if (typologiesToInclude.includes(t.typologie_id)) {
          jourTotal += t.count
          typologieTotals[t.typologie_id] = (typologieTotals[t.typologie_id] || 0) + t.count
        }
      })
      
      totalPeriode += jourTotal
      
      if (!jourMax || jourTotal > jourMax.total) {
        jourMax = { date: jour.date, total: jourTotal }
      }
      if (!jourMin || jourTotal < jourMin.total) {
        jourMin = { date: jour.date, total: jourTotal }
      }
    })

    // Top 3 typologies
    const top3Typologies = Object.entries(typologieTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([id, count]) => {
        const typ = activeTypologies.find(t => t.id === id)
        return {
          id,
          nom: typ?.nom || 'Inconnu',
          count,
          percentage: totalPeriode > 0 ? Math.round((count / totalPeriode) * 100) : 0
        }
      })

    // Previous period total
    let prevTotal = 0
    prevPeriodData.forEach(jour => {
      jour.typologies.forEach(t => {
        if (typologiesToInclude.includes(t.typologie_id)) {
          prevTotal += t.count
        }
      })
    })

    const evolutionPrecedente = prevTotal > 0
      ? Math.round(((totalPeriode - prevTotal) / prevTotal) * 100)
      : null

    // Days with/without data
    const allDays = eachDayOfInterval({ start: periodBounds.start, end: periodBounds.end })
    const joursAvecDonnees = periodData.length
    const joursSansDonnees = allDays.filter(d => d <= new Date()).length - joursAvecDonnees

    return {
      totalPeriode,
      moyenneParJour: joursAvecDonnees > 0 ? Math.round(totalPeriode / joursAvecDonnees) : 0,
      jourMax,
      jourMin,
      top3Typologies,
      evolutionPrecedente,
      joursAvecDonnees,
      joursSansDonnees
    }
  }, [periodData, prevPeriodData, periodBounds, selectedTypologies, activeTypologies])

  // Chart data
  const chartData: ChartDataPoint[] = useMemo(() => {
    const { start, end } = periodBounds
    const days = eachDayOfInterval({ start, end }).filter(d => d <= new Date())
    const typologiesToInclude = selectedTypologies.length > 0
      ? selectedTypologies
      : activeTypologies.map(t => t.id)

    const dataMap = new Map(data.jours.map(j => [j.date, j]))

    return days.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const jour = dataMap.get(dateStr)
      
      const point: ChartDataPoint = {
        date: dateStr,
        label: format(date, period === 'annee' ? 'MMM' : 'dd/MM', { locale: fr }),
        total: 0
      }

      if (jour) {
        jour.typologies.forEach(t => {
          if (typologiesToInclude.includes(t.typologie_id)) {
            const typ = activeTypologies.find(ty => ty.id === t.typologie_id)
            if (typ) {
              point[typ.nom] = t.count
              point.total += t.count
            }
          }
        })
      }

      return point
    })
  }, [periodBounds, data.jours, period, selectedTypologies, activeTypologies])

  // Calculate moving average for trend line
  const trendData = useMemo(() => {
    if (!showTrendLine || chartData.length < 7) return chartData

    return chartData.map((point, index) => {
      const windowStart = Math.max(0, index - 6)
      const window = chartData.slice(windowStart, index + 1)
      const avg = window.reduce((sum, p) => sum + p.total, 0) / window.length

      return {
        ...point,
        moyenne7j: Math.round(avg)
      }
    })
  }, [chartData, showTrendLine])

  // Generate insights
  const insights: Insight[] = useMemo(() => {
    const result: Insight[] = []

    if (kpiData.top3Typologies.length > 0) {
      const top = kpiData.top3Typologies[0]
      result.push({
        type: 'info',
        message: `La typologie la plus fréquente est "${top.nom}" avec ${top.count} entrées (${top.percentage}%).`
      })
    }

    if (kpiData.jourMax) {
      result.push({
        type: 'info',
        message: `Le pic de fréquentation est le ${format(parseISO(kpiData.jourMax.date), 'dd MMMM', { locale: fr })} avec ${kpiData.jourMax.total} visiteurs.`
      })
    }

    if (kpiData.joursSansDonnees > 0) {
      result.push({
        type: 'warning',
        message: `${kpiData.joursSansDonnees} jour(s) sans données sur cette période.`
      })
    }

    // Anomaly detection
    if (chartData.length > 5) {
      const totals = chartData.map(d => d.total).filter(t => t > 0)
      if (totals.length > 2) {
        const mean = totals.reduce((a, b) => a + b, 0) / totals.length
        const std = Math.sqrt(totals.map(t => Math.pow(t - mean, 2)).reduce((a, b) => a + b, 0) / totals.length)
        const threshold = mean + 2 * std

        const anomalies = chartData.filter(d => d.total > threshold)
        if (anomalies.length > 0) {
          result.push({
            type: 'anomaly',
            message: `${anomalies.length} jour(s) avec une fréquentation anormalement élevée détecté(s).`
          })
        }
      }
    }

    return result
  }, [kpiData, chartData])

  // Export CSV
  const exportCSV = () => {
    const headers = ['Date', 'Total', ...activeTypologies.map(t => t.nom)]
    const rows = chartData.map(point => {
      const row = [point.date, point.total.toString()]
      activeTypologies.forEach(t => {
        row.push(((point[t.nom] as number) || 0).toString())
      })
      return row
    })

    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `frequentation_${format(periodBounds.start, 'yyyy-MM-dd')}_${format(periodBounds.end, 'yyyy-MM-dd')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Navigation
  const navigatePeriod = (direction: 'prev' | 'next') => {
    let newDate: Date
    switch (period) {
      case 'jour':
        newDate = direction === 'prev' ? subDays(referenceDate, 1) : addDays(referenceDate, 1)
        break
      case 'semaine':
        newDate = direction === 'prev' ? subWeeks(referenceDate, 1) : addDays(referenceDate, 7)
        break
      case 'mois':
        newDate = direction === 'prev' ? subMonths(referenceDate, 1) : addDays(referenceDate, 32)
        break
      case 'annee':
        newDate = direction === 'prev' ? subYears(referenceDate, 1) : addDays(referenceDate, 366)
        break
    }
    if (newDate <= new Date()) {
      setReferenceDate(newDate)
    }
  }

  // Period label
  const periodLabel = useMemo(() => {
    switch (period) {
      case 'jour':
        return format(referenceDate, 'EEEE dd MMMM yyyy', { locale: fr })
      case 'semaine':
        return `Semaine du ${format(periodBounds.start, 'dd MMM', { locale: fr })} au ${format(periodBounds.end, 'dd MMM yyyy', { locale: fr })}`
      case 'mois':
        return format(referenceDate, 'MMMM yyyy', { locale: fr })
      case 'annee':
        return format(referenceDate, 'yyyy')
    }
  }, [period, referenceDate, periodBounds])

  // Build chart config
  const chartConfig = useMemo(() => {
    const config: Record<string, { label: string; color: string }> = {
      total: { label: 'Total', color: '#10b981' }
    }
    activeTypologies.forEach((t, i) => {
      config[t.nom] = { label: t.nom, color: t.couleur }
    })
    if (showTrendLine) {
      config.moyenne7j = { label: 'Moyenne 7j', color: '#6b7280' }
    }
    return config
  }, [activeTypologies, showTrendLine])

  // Toggle typologie selection
  const toggleTypologie = (id: string) => {
    setSelectedTypologies(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id)
      }
      return [...prev, id]
    })
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Analyses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            {/* Period selector */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jour">Jour</SelectItem>
                  <SelectItem value="semaine">Semaine</SelectItem>
                  <SelectItem value="mois">Mois</SelectItem>
                  <SelectItem value="annee">Année</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => navigatePeriod('prev')}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[200px] justify-start bg-transparent">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      <span className="truncate capitalize">{periodLabel}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={referenceDate}
                      onSelect={(date) => date && setReferenceDate(date)}
                      locale={fr}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigatePeriod('next')}
                  disabled={periodBounds.end >= new Date()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Typologie filter */}
            <div className="flex flex-wrap gap-2">
              {activeTypologies.map(t => (
                <Badge
                  key={t.id}
                  variant={selectedTypologies.length === 0 || selectedTypologies.includes(t.id) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  style={{
                    backgroundColor: selectedTypologies.length === 0 || selectedTypologies.includes(t.id) ? t.couleur : undefined,
                    borderColor: t.couleur
                  }}
                  onClick={() => toggleTypologie(t.id)}
                >
                  {t.nom}
                </Badge>
              ))}
              {selectedTypologies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTypologies([])}
                  className="h-6 text-xs"
                >
                  Tout afficher
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total période</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.totalPeriode}</div>
            {kpiData.evolutionPrecedente !== null && (
              <p className={cn(
                'text-xs flex items-center gap-1',
                kpiData.evolutionPrecedente >= 0 ? 'text-emerald-600' : 'text-red-600'
              )}>
                {kpiData.evolutionPrecedente >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {kpiData.evolutionPrecedente >= 0 ? '+' : ''}{kpiData.evolutionPrecedente}% vs période précédente
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Moyenne / jour</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.moyenneParJour}</div>
            <p className="text-xs text-muted-foreground">
              Sur {kpiData.joursAvecDonnees} jour(s) de données
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Jour max</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpiData.jourMax?.total || '-'}</div>
            <p className="text-xs text-muted-foreground">
              {kpiData.jourMax ? format(parseISO(kpiData.jourMax.date), 'dd MMM', { locale: fr }) : '-'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Top typologie</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {kpiData.top3Typologies[0]?.percentage || 0}%
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">
              {kpiData.top3Typologies[0]?.nom || '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {kpiData.top3Typologies[0]?.count || 0} entrées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Fréquentation</CardTitle>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="chart-type"
                  checked={chartType === 'stacked'}
                  onCheckedChange={(v) => setChartType(v ? 'stacked' : 'simple')}
                />
                <Label htmlFor="chart-type" className="text-sm">Empilé</Label>
              </div>
              {(period === 'mois' || period === 'annee') && (
                <div className="flex items-center gap-2">
                  <Switch
                    id="trend-line"
                    checked={showTrendLine}
                    onCheckedChange={setShowTrendLine}
                  />
                  <Label htmlFor="trend-line" className="text-sm">Tendance</Label>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 || chartData.every(d => d.total === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              Aucune donnée pour cette période
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'simple' && showTrendLine ? (
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="total"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981', r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="moyenne7j"
                      stroke="#6b7280"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="label" className="text-xs" tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    {chartType === 'stacked' ? (
                      activeTypologies
                        .filter(t => selectedTypologies.length === 0 || selectedTypologies.includes(t.id))
                        .map(t => (
                          <Bar
                            key={t.id}
                            dataKey={t.nom}
                            stackId="a"
                            fill={t.couleur}
                          />
                        ))
                    ) : (
                      <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                    )}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-start gap-2 p-3 rounded-lg text-sm',
                    insight.type === 'info' && 'bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200',
                    insight.type === 'warning' && 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200',
                    insight.type === 'anomaly' && 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'
                  )}
                >
                  {insight.type === 'info' && <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  {insight.type === 'anomaly' && <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
                  <span>{insight.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Détail</CardTitle>
              <CardDescription>
                {chartData.length} jour(s) dans la période
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="show-details"
                  checked={showDetails}
                  onCheckedChange={setShowDetails}
                />
                <Label htmlFor="show-details" className="text-sm">Typologies</Label>
              </div>
              <Button variant="outline" size="sm" onClick={exportCSV}>
                <Download className="mr-2 h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {showDetails && activeTypologies
                    .filter(t => selectedTypologies.length === 0 || selectedTypologies.includes(t.id))
                    .map(t => (
                      <TableHead key={t.id} className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: t.couleur }}
                          />
                          <span className="truncate max-w-[80px]">{t.nom}</span>
                        </div>
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {chartData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={showDetails ? 2 + activeTypologies.length : 2} className="text-center text-muted-foreground">
                      Aucune donnée
                    </TableCell>
                  </TableRow>
                ) : (
                  chartData.map(point => (
                    <TableRow key={point.date}>
                      <TableCell className="font-medium">
                        {format(parseISO(point.date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {point.total}
                      </TableCell>
                      {showDetails && activeTypologies
                        .filter(t => selectedTypologies.length === 0 || selectedTypologies.includes(t.id))
                        .map(t => (
                          <TableCell key={t.id} className="text-right">
                            {(point[t.nom] as number) || 0}
                          </TableCell>
                        ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
