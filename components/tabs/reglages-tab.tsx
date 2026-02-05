'use client'

import React from "react"

import { useState, useRef } from 'react'
import { useTheme } from 'next-themes'
import { Download, Upload, RotateCcw, Trash2, Moon, Sun, Monitor } from 'lucide-react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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

export function ReglagesTab() {
  const { data, exportToJson, importFromJson, resetData, clearAllData } = useData()
  const { theme, setTheme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // Export data
  const handleExport = () => {
    const json = exportToJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tiers-lieu-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
    toast.success('Export réussi', {
      description: 'Le fichier de sauvegarde a été téléchargé.'
    })
  }

  // Import data
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const success = importFromJson(content)
      
      if (success) {
        toast.success('Import réussi', {
          description: 'Les données ont été restaurées.'
        })
      } else {
        toast.error('Erreur d\'import', {
          description: 'Le fichier n\'est pas valide.'
        })
      }
    }
    reader.readAsText(file)
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Reset data
  const handleReset = () => {
    resetData()
    setShowResetConfirm(false)
    toast.success('Données réinitialisées', {
      description: 'Les données de démonstration ont été restaurées.'
    })
  }

  // Clear all data
  const handleClear = () => {
    clearAllData()
    setShowClearConfirm(false)
    toast.success('Données supprimées', {
      description: 'Toutes les données ont été effacées.'
    })
  }

  // Stats
  const stats = {
    joursEnregistres: data.jours.length,
    typologies: data.typologies.length,
    typologiesActives: data.typologies.filter(t => t.actif).length,
    totalVisites: data.jours.reduce((sum, j) => sum + j.total_visites, 0)
  }

  return (
    <div className="space-y-6">
      {/* Theme */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Apparence</CardTitle>
          <CardDescription>Personnalisez l'apparence de l'application</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={theme}
            onValueChange={setTheme}
            className="grid grid-cols-3 gap-4"
          >
            <Label
              htmlFor="light"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="light" id="light" className="sr-only" />
              <Sun className="mb-3 h-6 w-6" />
              <span className="text-sm font-medium">Clair</span>
            </Label>
            <Label
              htmlFor="dark"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="dark" id="dark" className="sr-only" />
              <Moon className="mb-3 h-6 w-6" />
              <span className="text-sm font-medium">Sombre</span>
            </Label>
            <Label
              htmlFor="system"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground cursor-pointer [&:has([data-state=checked])]:border-primary"
            >
              <RadioGroupItem value="system" id="system" className="sr-only" />
              <Monitor className="mb-3 h-6 w-6" />
              <span className="text-sm font-medium">Système</span>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistiques</CardTitle>
          <CardDescription>Aperçu de vos données</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{stats.joursEnregistres}</div>
              <div className="text-sm text-muted-foreground">Jours enregistrés</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{stats.totalVisites}</div>
              <div className="text-sm text-muted-foreground">Total des visites</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{stats.typologies}</div>
              <div className="text-sm text-muted-foreground">Typologies</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-2xl font-bold">{stats.typologiesActives}</div>
              <div className="text-sm text-muted-foreground">Typologies actives</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export/Import */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Sauvegarde et restauration</CardTitle>
          <CardDescription>Exportez ou importez vos données</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button onClick={handleExport} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Exporter (JSON)
            </Button>
            <div className="flex-1">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                ref={fileInputRef}
                className="hidden"
                id="import-file"
              />
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Importer (JSON)
              </Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            L'export crée un fichier de sauvegarde contenant toutes vos données (jours et typologies).
            L'import remplace toutes les données existantes.
          </p>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Zone de danger</CardTitle>
          <CardDescription>Actions irréversibles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => setShowResetConfirm(true)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Réinitialiser (démo)
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Effacer toutes les données
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            "Réinitialiser" restaure les données de démonstration.
            "Effacer" supprime définitivement toutes les données.
          </p>
        </CardContent>
      </Card>

      {/* Reset confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser les données ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action remplacera toutes vos données par les données de démonstration.
              Vos données actuelles seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Effacer toutes les données ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement toutes vos données.
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Effacer tout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
