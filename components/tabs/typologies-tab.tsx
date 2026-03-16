'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, ChevronRight, X } from 'lucide-react'
import { useData } from '@/lib/data-context'
import { useIsMobile } from '@/hooks/use-mobile'
import type { Typologie, SousCategorie } from '@/lib/types'
import { DEFAULT_COLORS, DEFAULT_AGE_SUBCATEGORIES } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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

const FAMILLES = ['Créatif', 'Numérique', 'Accueil', 'Autre']

// Preset subcategories
const PRESET_SUBCATEGORIES = {
  'ages': {
    label: 'Tranches d\'âge',
    items: DEFAULT_AGE_SUBCATEGORIES
  },
  'profils': {
    label: 'Profils',
    items: [
      { id: 'prof-1', nom: 'Enfants', ordre: 1 },
      { id: 'prof-2', nom: 'Adultes', ordre: 2 },
      { id: 'prof-3', nom: 'Seniors', ordre: 3 },
      { id: 'prof-4', nom: 'Professionnels', ordre: 4 },
    ]
  },
  'statuts': {
    label: 'Statuts',
    items: [
      { id: 'stat-1', nom: 'Particuliers', ordre: 1 },
      { id: 'stat-2', nom: 'Chefs d\'entreprise', ordre: 2 },
      { id: 'stat-3', nom: 'Elus', ordre: 3 },
      { id: 'stat-4', nom: 'Associations', ordre: 4 },
    ]
  }
}

export function TypologiesTab() {
  const { data, addTypologie, updateTypologie, deleteTypologie, reorderTypologies } = useData()
  const isMobile = useIsMobile()

  // Sort typologies by ordre
  const sortedTypologies = useMemo(() =>
    [...data.typologies].sort((a, b) => a.ordre - b.ordre),
    [data.typologies]
  )

  // Dialog state
  const [showDialog, setShowDialog] = useState(false)
  const [editingTypologie, setEditingTypologie] = useState<Typologie | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [expandedTypologies, setExpandedTypologies] = useState<Set<string>>(new Set())

  // Form state
  const [formNom, setFormNom] = useState('')
  const [formCouleur, setFormCouleur] = useState(DEFAULT_COLORS[0])
  const [formActif, setFormActif] = useState(true)
  const [formFamille, setFormFamille] = useState<string>('')
  const [formSousCategories, setFormSousCategories] = useState<SousCategorie[]>([])
  const [newSousCatNom, setNewSousCatNom] = useState('')

  // Toggle expansion
  const toggleExpanded = (id: string) => {
    setExpandedTypologies(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Open dialog for new/edit
  const openDialog = (typologie?: Typologie) => {
    if (typologie) {
      setEditingTypologie(typologie)
      setFormNom(typologie.nom)
      setFormCouleur(typologie.couleur)
      setFormActif(typologie.actif)
      setFormFamille(typologie.famille || '')
      setFormSousCategories(typologie.sousCategories ? [...typologie.sousCategories] : [])
    } else {
      setEditingTypologie(null)
      setFormNom('')
      setFormCouleur(DEFAULT_COLORS[data.typologies.length % DEFAULT_COLORS.length])
      setFormActif(true)
      setFormFamille('')
      setFormSousCategories([])
    }
    setNewSousCatNom('')
    setShowDialog(true)
  }

  // Add subcategory
  const addSousCategorie = () => {
    if (!newSousCatNom.trim()) return
    const newSousCat: SousCategorie = {
      id: crypto.randomUUID(),
      nom: newSousCatNom.trim(),
      ordre: formSousCategories.length + 1
    }
    setFormSousCategories([...formSousCategories, newSousCat])
    setNewSousCatNom('')
  }

  // Remove subcategory
  const removeSousCategorie = (id: string) => {
    setFormSousCategories(formSousCategories.filter(sc => sc.id !== id))
  }

  // Add preset subcategories
  const addPresetSousCategories = (presetKey: keyof typeof PRESET_SUBCATEGORIES) => {
    const preset = PRESET_SUBCATEGORIES[presetKey]
    const existingNames = new Set(formSousCategories.map(sc => sc.nom.toLowerCase()))
    const newItems = preset.items
      .filter(item => !existingNames.has(item.nom.toLowerCase()))
      .map((item, index) => ({
        ...item,
        id: crypto.randomUUID(),
        ordre: formSousCategories.length + index + 1
      }))
    setFormSousCategories([...formSousCategories, ...newItems])
    toast.success(`${newItems.length} sous-catégorie(s) ajoutée(s)`)
  }

  // Save typologie
  const handleSave = () => {
    if (!formNom.trim()) {
      toast.error('Le nom est requis')
      return
    }

    const reorderedSousCats = formSousCategories.map((sc, index) => ({
      ...sc,
      ordre: index + 1
    }))

    if (editingTypologie) {
      updateTypologie({
        ...editingTypologie,
        nom: formNom.trim(),
        couleur: formCouleur,
        actif: formActif,
        famille: formFamille || undefined,
        sousCategories: reorderedSousCats.length > 0 ? reorderedSousCats : undefined
      })
      toast.success('Typologie modifiée')
    } else {
      addTypologie({
        nom: formNom.trim(),
        couleur: formCouleur,
        actif: formActif,
        famille: formFamille || undefined,
        sousCategories: reorderedSousCats.length > 0 ? reorderedSousCats : undefined
      })
      toast.success('Typologie créée')
    }

    setShowDialog(false)
  }

  // Delete typologie
  const handleDelete = (id: string) => {
    deleteTypologie(id)
    setDeleteConfirm(null)
    toast.success('Typologie supprimée')
  }

  // Toggle active
  const toggleActive = (typologie: Typologie) => {
    updateTypologie({ ...typologie, actif: !typologie.actif })
    toast.success(typologie.actif ? 'Typologie désactivée' : 'Typologie activée')
  }

  // Reorder
  const moveTypologie = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= sortedTypologies.length) return

    const newList = [...sortedTypologies]
    const temp = newList[index]
    newList[index] = newList[newIndex]
    newList[newIndex] = temp

    reorderTypologies(newList)
  }

  // Group by famille
  const groupedTypologies = useMemo(() => {
    const groups: Record<string, Typologie[]> = {}
    sortedTypologies.forEach(t => {
      const famille = t.famille || 'Sans famille'
      if (!groups[famille]) groups[famille] = []
      groups[famille].push(t)
    })
    return groups
  }, [sortedTypologies])

  // Form content
  const FormContent = () => (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="nom">Nom *</Label>
        <Input
          id="nom"
          value={formNom}
          onChange={(e) => setFormNom(e.target.value)}
          placeholder="ex: Fablab, Céramiste..."
        />
      </div>

      <div className="space-y-2">
        <Label>Couleur</Label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormCouleur(color)}
              className={cn(
                'w-8 h-8 rounded-full transition-transform',
                formCouleur === color && 'ring-2 ring-offset-2 ring-primary scale-110'
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Label htmlFor="custom-color" className="text-sm text-muted-foreground">Personnalisée :</Label>
          <Input
            id="custom-color"
            type="color"
            value={formCouleur}
            onChange={(e) => setFormCouleur(e.target.value)}
            className="w-12 h-8 p-0.5 cursor-pointer"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="famille">Famille (optionnel)</Label>
        <Select value={formFamille} onValueChange={setFormFamille}>
          <SelectTrigger>
            <SelectValue placeholder="Choisir une famille" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Aucune</SelectItem>
            {FAMILLES.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="actif"
          checked={formActif}
          onCheckedChange={setFormActif}
        />
        <Label htmlFor="actif">Active</Label>
      </div>

      {/* Sous-catégories */}
      <div className="space-y-3 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label>Sous-catégories</Label>
          <span className="text-xs text-muted-foreground">{formSousCategories.length} élément(s)</span>
        </div>
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESET_SUBCATEGORIES).map(([key, preset]) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => addPresetSousCategories(key as keyof typeof PRESET_SUBCATEGORIES)}
            >
              <Plus className="h-3 w-3 mr-1" />
              {preset.label}
            </Button>
          ))}
        </div>

        {/* Current subcategories */}
        {formSousCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formSousCategories.map(sc => (
              <Badge
                key={sc.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {sc.nom}
                <button
                  type="button"
                  onClick={() => removeSousCategorie(sc.id)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add new subcategory */}
        <div className="flex gap-2">
          <Input
            value={newSousCatNom}
            onChange={(e) => setNewSousCatNom(e.target.value)}
            placeholder="Nouvelle sous-catégorie..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSousCategorie()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            onClick={addSousCategorie}
            disabled={!newSousCatNom.trim()}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Typologies</CardTitle>
              <CardDescription>
                {data.typologies.length} typologie(s) - {data.typologies.filter(t => t.actif).length} active(s)
              </CardDescription>
            </div>
            <Button onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle typologie
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* List */}
      {sortedTypologies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Aucune typologie</p>
              <p className="text-sm mt-1">Créez votre première typologie pour commencer à saisir des données.</p>
            </div>
            <Button className="mt-4" onClick={() => openDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Créer une typologie
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {sortedTypologies.map((typologie, index) => (
                <Collapsible
                  key={typologie.id}
                  open={expandedTypologies.has(typologie.id)}
                  onOpenChange={() => toggleExpanded(typologie.id)}
                >
                  <div
                    className={cn(
                      'rounded-lg border transition-colors',
                      !typologie.actif && 'opacity-60 bg-muted/30'
                    )}
                  >
                    <div className="flex items-center gap-3 p-3">
                      {/* Drag handle / reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveTypologie(index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveTypologie(index, 'down')}
                          disabled={index === sortedTypologies.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Expand trigger for subcategories */}
                      {typologie.sousCategories && typologie.sousCategories.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <ChevronRight
                              className={cn(
                                'h-4 w-4 transition-transform',
                                expandedTypologies.has(typologie.id) && 'rotate-90'
                              )}
                            />
                          </Button>
                        </CollapsibleTrigger>
                      )}

                      {/* Color indicator */}
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: typologie.couleur }}
                      />

                      {/* Name and badges */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">{typologie.nom}</span>
                          {typologie.famille && (
                            <Badge variant="secondary" className="text-xs">
                              {typologie.famille}
                            </Badge>
                          )}
                          {typologie.sousCategories && typologie.sousCategories.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {typologie.sousCategories.length} sous-cat.
                            </Badge>
                          )}
                          {!typologie.actif && (
                            <Badge variant="outline" className="text-xs">
                              Inactive
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => toggleActive(typologie)}
                        >
                          {typologie.actif ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openDialog(typologie)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(typologie.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Subcategories display */}
                    <CollapsibleContent>
                      {typologie.sousCategories && typologie.sousCategories.length > 0 && (
                        <div className="px-4 pb-3 pl-16">
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {typologie.sousCategories.map(sc => (
                              <Badge key={sc.id} variant="secondary" className="text-xs">
                                {sc.nom}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats by famille */}
      {Object.keys(groupedTypologies).length > 1 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Répartition par famille</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Object.entries(groupedTypologies).map(([famille, typologies]) => (
                <div key={famille} className="p-3 rounded-lg bg-muted/50">
                  <div className="font-medium text-sm">{famille}</div>
                  <div className="text-2xl font-bold mt-1">{typologies.length}</div>
                  <div className="text-xs text-muted-foreground">
                    {typologies.filter(t => t.actif).length} active(s)
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog - Desktop */}
      {!isMobile && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTypologie ? 'Modifier la typologie' : 'Nouvelle typologie'}
              </DialogTitle>
              <DialogDescription>
                {editingTypologie ? 'Modifiez les informations de cette typologie.' : 'Créez une nouvelle catégorie de public.'}
              </DialogDescription>
            </DialogHeader>
            <FormContent />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {editingTypologie ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Drawer - Mobile */}
      {isMobile && (
        <Drawer open={showDialog} onOpenChange={setShowDialog}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>
                {editingTypologie ? 'Modifier la typologie' : 'Nouvelle typologie'}
              </DrawerTitle>
              <DrawerDescription>
                {editingTypologie ? 'Modifiez les informations de cette typologie.' : 'Créez une nouvelle catégorie de public.'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto">
              <FormContent />
            </div>
            <DrawerFooter>
              <Button onClick={handleSave}>
                {editingTypologie ? 'Enregistrer' : 'Créer'}
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette typologie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la typologie et toutes les données associées dans l'historique. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
