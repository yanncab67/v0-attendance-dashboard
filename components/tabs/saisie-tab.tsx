'use client'

import { useState, useMemo } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, Copy, RotateCcw, Save, AlertCircle, Minus, Plus } from 'lucide-react'
import { useData } from '@/lib/data-context'
import type { JourData, TypologieCount } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function SaisieTab() {
  const { data, saveJour } = useData()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const dateStr = format(selectedDate, 'yyyy-MM-dd')

  // Get existing data for this day
  const existingJour = data.jours.find(j => j.date === dateStr)
  
  // Active typologies sorted by order
  const activeTypologies = useMemo(() => 
    data.typologies
      .filter(t => t.actif)
      .sort((a, b) => a.ordre - b.ordre),
    [data.typologies]
  )

  // Form state
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    if (existingJour) {
      const record: Record<string, number> = {}
      existingJour.typologies.forEach(t => {
        record[t.typologie_id] = t.count
      })
      return record
    }
    return {}
  })
  
  const [note, setNote] = useState(existingJour?.note || '')
  const [estimee, setEstimee] = useState(existingJour?.estimee || false)
  const [overrideTotal, setOverrideTotal] = useState(existingJour?.override_total || false)
  const [manualTotal, setManualTotal] = useState(existingJour?.total_visites || 0)

  // Calculate sum
  const calculatedSum = useMemo(() => {
    return activeTypologies.reduce((sum, t) => sum + (counts[t.id] || 0), 0)
  }, [activeTypologies, counts])

  // Update form when date changes
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return
    setSelectedDate(date)
    const newDateStr = format(date, 'yyyy-MM-dd')
    const jour = data.jours.find(j => j.date === newDateStr)
    
    if (jour) {
      const record: Record<string, number> = {}
      jour.typologies.forEach(t => {
        record[t.typologie_id] = t.count
      })
      setCounts(record)
      setNote(jour.note)
      setEstimee(jour.estimee)
      setOverrideTotal(jour.override_total)
      setManualTotal(jour.total_visites)
    } else {
      setCounts({})
      setNote('')
      setEstimee(false)
      setOverrideTotal(false)
      setManualTotal(0)
    }
  }

  // Update count for a typologie
  const updateCount = (id: string, delta: number) => {
    setCounts(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }))
  }

  const setCount = (id: string, value: number) => {
    setCounts(prev => ({
      ...prev,
      [id]: Math.max(0, value)
    }))
  }

  // Save handler
  const handleSave = () => {
    const typologies: TypologieCount[] = activeTypologies.map(t => ({
      typologie_id: t.id,
      count: counts[t.id] || 0
    }))

    const jour: JourData = {
      date: dateStr,
      total_visites: overrideTotal ? manualTotal : calculatedSum,
      override_total: overrideTotal,
      typologies,
      note,
      estimee,
      derniere_maj: new Date().toISOString()
    }

    saveJour(jour)
    toast.success('Données enregistrées', {
      description: `Données du ${format(selectedDate, 'dd MMMM yyyy', { locale: fr })} sauvegardées.`
    })
  }

  // Duplicate from yesterday
  const handleDuplicate = () => {
    const yesterday = subDays(selectedDate, 1)
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd')
    const yesterdayJour = data.jours.find(j => j.date === yesterdayStr)

    if (!yesterdayJour) {
      toast.error('Aucune donnée hier', {
        description: 'Il n\'y a pas de données à copier depuis la veille.'
      })
      return
    }

    const record: Record<string, number> = {}
    yesterdayJour.typologies.forEach(t => {
      record[t.typologie_id] = t.count
    })
    setCounts(record)
    setNote(yesterdayJour.note)
    setEstimee(yesterdayJour.estimee)
    toast.success('Données copiées', {
      description: `Données du ${format(yesterday, 'dd MMMM', { locale: fr })} copiées.`
    })
  }

  // Reset
  const handleReset = () => {
    setCounts({})
    setNote('')
    setEstimee(false)
    setOverrideTotal(false)
    setManualTotal(0)
    toast.info('Formulaire réinitialisé')
  }

  // Find most used typography for shortcut
  const mostUsedTypologie = useMemo(() => {
    const totals: Record<string, number> = {}
    data.jours.forEach(jour => {
      jour.typologies.forEach(t => {
        totals[t.typologie_id] = (totals[t.typologie_id] || 0) + t.count
      })
    })
    
    let maxId = activeTypologies[0]?.id
    let maxCount = 0
    Object.entries(totals).forEach(([id, count]) => {
      if (count > maxCount && activeTypologies.find(t => t.id === id)) {
        maxId = id
        maxCount = count
      }
    })
    
    return activeTypologies.find(t => t.id === maxId)
  }, [data.jours, activeTypologies])

  return (
    <div className="space-y-6">
      {/* Date selector */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Saisie des entrées</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto justify-start bg-transparent">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={fr}
                  disabled={(date) => date > new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
      </Card>

      {/* Entry form */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Typologies list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Typologies</CardTitle>
              {mostUsedTypologie && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateCount(mostUsedTypologie.id, 1)}
                        className="text-xs"
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        {mostUsedTypologie.nom}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Raccourci : +1 pour la typologie la plus utilisée</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {activeTypologies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Aucune typologie active.</p>
                <p className="text-sm">Créez des typologies dans l'onglet "Typologies".</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeTypologies.map(typologie => (
                  <div
                    key={typologie.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: typologie.couleur }}
                      />
                      <span className="font-medium truncate">{typologie.nom}</span>
                      {typologie.famille && (
                        <Badge variant="secondary" className="hidden sm:inline-flex text-xs">
                          {typologie.famille}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateCount(typologie.id, -1)}
                        disabled={(counts[typologie.id] || 0) === 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min={0}
                        value={counts[typologie.id] || 0}
                        onChange={(e) => setCount(typologie.id, parseInt(e.target.value) || 0)}
                        className="w-16 text-center h-8"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateCount(typologie.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side panel */}
        <div className="space-y-6">
          {/* Totals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Total</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl font-bold text-primary">
                {overrideTotal ? manualTotal : calculatedSum}
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="override"
                  checked={overrideTotal}
                  onCheckedChange={setOverrideTotal}
                />
                <Label htmlFor="override" className="text-sm">Mode manuel</Label>
              </div>
              
              {overrideTotal && (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min={0}
                    value={manualTotal}
                    onChange={(e) => setManualTotal(parseInt(e.target.value) || 0)}
                    placeholder="Total manuel"
                  />
                  {manualTotal !== calculatedSum && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Différence : {manualTotal - calculatedSum}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="estimee"
                  checked={estimee}
                  onCheckedChange={setEstimee}
                />
                <Label htmlFor="estimee" className="text-sm">Donnée estimée</Label>
              </div>
            </CardContent>
          </Card>

          {/* Note */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Note du jour</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Événement, météo, remarques..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Last update info */}
          {existingJour && (
            <p className="text-xs text-muted-foreground text-center">
              Dernière mise à jour : {format(parseISO(existingJour.derniere_maj), 'dd/MM/yyyy HH:mm', { locale: fr })}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Copier la veille
              </Button>
              <Button variant="outline" onClick={handleReset}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            </div>
            <Button onClick={handleSave} className="sm:w-auto">
              <Save className="mr-2 h-4 w-4" />
              Enregistrer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
