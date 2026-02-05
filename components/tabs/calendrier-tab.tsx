'use client'

import { useState, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns'
import { fr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Trash2, Save, Minus, Plus, AlertCircle } from 'lucide-react'
import { useData } from '@/lib/data-context'
import { useIsMobile } from '@/hooks/use-mobile'
import type { JourData, TypologieCount } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from '@/components/ui/drawer'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'with-data' | 'without-data'

export function CalendrierTab() {
  const { data, saveJour, deleteJour } = useData()
  const isMobile = useIsMobile()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Build a map of dates with data
  const dataMap = useMemo(() => {
    const map = new Map<string, JourData>()
    data.jours.forEach(jour => {
      map.set(jour.date, jour)
    })
    return map
  }, [data.jours])

  // Get days for the calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { locale: fr })
    const end = endOfWeek(endOfMonth(currentMonth), { locale: fr })
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Navigation
  const goToPreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1))
  const goToNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1))
  const goToToday = () => {
    setCurrentMonth(new Date())
    setSelectedDay(new Date())
  }

  // Filter days
  const shouldShowDay = (date: Date) => {
    if (filter === 'all') return true
    const dateStr = format(date, 'yyyy-MM-dd')
    const hasData = dataMap.has(dateStr)
    return filter === 'with-data' ? hasData : !hasData
  }

  // Day click handler
  const handleDayClick = (date: Date) => {
    if (date > new Date()) return
    setSelectedDay(date)
  }

  // Get data for selected day
  const selectedDayData = selectedDay
    ? dataMap.get(format(selectedDay, 'yyyy-MM-dd'))
    : undefined

  // Day editor state
  const [editCounts, setEditCounts] = useState<Record<string, number>>({})
  const [editNote, setEditNote] = useState('')
  const [editEstimee, setEditEstimee] = useState(false)
  const [editOverrideTotal, setEditOverrideTotal] = useState(false)
  const [editManualTotal, setEditManualTotal] = useState(0)

  // Reset edit state when selected day changes
  const initEditState = () => {
    if (selectedDayData) {
      const record: Record<string, number> = {}
      selectedDayData.typologies.forEach(t => {
        record[t.typologie_id] = t.count
      })
      setEditCounts(record)
      setEditNote(selectedDayData.note)
      setEditEstimee(selectedDayData.estimee)
      setEditOverrideTotal(selectedDayData.override_total)
      setEditManualTotal(selectedDayData.total_visites)
    } else {
      setEditCounts({})
      setEditNote('')
      setEditEstimee(false)
      setEditOverrideTotal(false)
      setEditManualTotal(0)
    }
  }

  // Initialize edit state when opening
  const handleOpenEdit = (date: Date) => {
    setSelectedDay(date)
    const dayData = dataMap.get(format(date, 'yyyy-MM-dd'))
    if (dayData) {
      const record: Record<string, number> = {}
      dayData.typologies.forEach(t => {
        record[t.typologie_id] = t.count
      })
      setEditCounts(record)
      setEditNote(dayData.note)
      setEditEstimee(dayData.estimee)
      setEditOverrideTotal(dayData.override_total)
      setEditManualTotal(dayData.total_visites)
    } else {
      setEditCounts({})
      setEditNote('')
      setEditEstimee(false)
      setEditOverrideTotal(false)
      setEditManualTotal(0)
    }
  }

  // Active typologies
  const activeTypologies = useMemo(() =>
    data.typologies.filter(t => t.actif).sort((a, b) => a.ordre - b.ordre),
    [data.typologies]
  )

  // Calculate sum
  const editCalculatedSum = useMemo(() => {
    return activeTypologies.reduce((sum, t) => sum + (editCounts[t.id] || 0), 0)
  }, [activeTypologies, editCounts])

  // Update count
  const updateEditCount = (id: string, delta: number) => {
    setEditCounts(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }))
  }

  const setEditCount = (id: string, value: number) => {
    setEditCounts(prev => ({
      ...prev,
      [id]: Math.max(0, value)
    }))
  }

  // Save handler
  const handleSave = () => {
    if (!selectedDay) return

    const typologies: TypologieCount[] = activeTypologies.map(t => ({
      typologie_id: t.id,
      count: editCounts[t.id] || 0
    }))

    const jour: JourData = {
      date: format(selectedDay, 'yyyy-MM-dd'),
      total_visites: editOverrideTotal ? editManualTotal : editCalculatedSum,
      override_total: editOverrideTotal,
      typologies,
      note: editNote,
      estimee: editEstimee,
      derniere_maj: new Date().toISOString()
    }

    saveJour(jour)
    setSelectedDay(null)
    toast.success('Données enregistrées')
  }

  // Delete handler
  const handleDelete = () => {
    if (!selectedDay) return
    deleteJour(format(selectedDay, 'yyyy-MM-dd'))
    setShowDeleteConfirm(false)
    setSelectedDay(null)
    toast.success('Données supprimées')
  }

  // Editor content
  const EditorContent = () => (
    <div className="space-y-4 py-4">
      {/* Typologies */}
      <div className="space-y-2">
        <Label className="font-medium">Typologies</Label>
        {activeTypologies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune typologie active.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {activeTypologies.map(typologie => (
              <div
                key={typologie.id}
                className="flex items-center justify-between gap-2 p-2 rounded-md border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: typologie.couleur }}
                  />
                  <span className="text-sm truncate">{typologie.nom}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 bg-transparent"
                    onClick={() => updateEditCount(typologie.id, -1)}
                    disabled={(editCounts[typologie.id] || 0) === 0}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <Input
                    type="number"
                    min={0}
                    value={editCounts[typologie.id] || 0}
                    onChange={(e) => setEditCount(typologie.id, parseInt(e.target.value) || 0)}
                    className="w-14 text-center h-7 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 bg-transparent"
                    onClick={() => updateEditCount(typologie.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="space-y-2 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center justify-between">
          <Label className="font-medium">Total</Label>
          <span className="text-2xl font-bold text-primary">
            {editOverrideTotal ? editManualTotal : editCalculatedSum}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Switch
            id="edit-override"
            checked={editOverrideTotal}
            onCheckedChange={setEditOverrideTotal}
          />
          <Label htmlFor="edit-override" className="text-sm">Mode manuel</Label>
        </div>

        {editOverrideTotal && (
          <>
            <Input
              type="number"
              min={0}
              value={editManualTotal}
              onChange={(e) => setEditManualTotal(parseInt(e.target.value) || 0)}
              className="h-8"
            />
            {editManualTotal !== editCalculatedSum && (
              <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3 w-3" />
                <span>Différence : {editManualTotal - editCalculatedSum}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Options */}
      <div className="flex items-center gap-2">
        <Switch
          id="edit-estimee"
          checked={editEstimee}
          onCheckedChange={setEditEstimee}
        />
        <Label htmlFor="edit-estimee" className="text-sm">Donnée estimée</Label>
      </div>

      {/* Note */}
      <div className="space-y-2">
        <Label className="font-medium">Note</Label>
        <Textarea
          placeholder="Événement, remarques..."
          value={editNote}
          onChange={(e) => setEditNote(e.target.value)}
          rows={2}
        />
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Calendrier</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les jours</SelectItem>
                  <SelectItem value="with-data">Avec données</SelectItem>
                  <SelectItem value="without-data">Sans données</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Aujourd'hui
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Calendar */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: fr })}
            </h2>
            <Button variant="ghost" size="icon" onClick={goToNextMonth}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(date => {
              const dateStr = format(date, 'yyyy-MM-dd')
              const dayData = dataMap.get(dateStr)
              const isCurrentMonth = isSameMonth(date, currentMonth)
              const isSelected = selectedDay && isSameDay(date, selectedDay)
              const isFuture = date > new Date()
              const showDay = shouldShowDay(date)

              if (!showDay && isCurrentMonth) {
                return (
                  <div
                    key={dateStr}
                    className="aspect-square p-1"
                  />
                )
              }

              return (
                <button
                  key={dateStr}
                  onClick={() => handleOpenEdit(date)}
                  disabled={isFuture || !isCurrentMonth}
                  className={cn(
                    'aspect-square p-1 rounded-lg relative transition-colors',
                    'hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring',
                    isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/40',
                    isSelected && 'bg-primary/10 ring-2 ring-primary',
                    isToday(date) && 'ring-1 ring-primary/50',
                    isFuture && 'cursor-not-allowed opacity-50',
                    !isCurrentMonth && 'pointer-events-none'
                  )}
                >
                  <div className="flex flex-col items-center justify-center h-full gap-0.5">
                    <span className={cn(
                      'text-sm font-medium',
                      isToday(date) && 'text-primary font-bold'
                    )}>
                      {format(date, 'd')}
                    </span>
                    {dayData && isCurrentMonth && (
                      <>
                        <span className={cn(
                          'text-xs font-semibold',
                          dayData.estimee ? 'text-amber-500' : 'text-primary'
                        )}>
                          {dayData.total_visites}
                        </span>
                        {dayData.estimee && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-500" />
                        )}
                      </>
                    )}
                    {!dayData && isCurrentMonth && !isFuture && (
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Données saisies</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Données estimées</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span>Pas de données</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day editor - Dialog on desktop, Drawer on mobile */}
      {isMobile ? (
        <Drawer open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {selectedDay && format(selectedDay, 'EEEE dd MMMM yyyy', { locale: fr })}
              </DrawerTitle>
              <DrawerDescription>
                Modifier les données de ce jour
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto max-h-[60vh]">
              <EditorContent />
            </div>
            <DrawerFooter className="flex-row gap-2">
              {selectedDayData && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => setSelectedDay(null)}
              >
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                <Save className="mr-2 h-4 w-4" />
                Enregistrer
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedDay && format(selectedDay, 'EEEE dd MMMM yyyy', { locale: fr })}
              </DialogTitle>
              <DialogDescription>
                Modifier les données de ce jour
              </DialogDescription>
            </DialogHeader>
            <EditorContent />
            <DialogFooter className="flex-row gap-2 sm:justify-between">
              {selectedDayData && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" onClick={() => setSelectedDay(null)}>
                  Annuler
                </Button>
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer les données ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement les données du{' '}
              {selectedDay && format(selectedDay, 'dd MMMM yyyy', { locale: fr })}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
