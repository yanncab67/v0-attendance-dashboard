"use client";

import { useState, useMemo, useEffect } from "react";
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { useData } from "@/lib/data-context";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Typologie } from "@/lib/types";
import { DEFAULT_COLORS } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
  DrawerDescription,
} from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FAMILLES = ["Créatif", "Numérique", "Accueil", "Autre", "test"];

// Form content component (défini en dehors pour éviter les re-renders)
function FormContent({
  formNom,
  setFormNom,
  formCouleur,
  setFormCouleur,
  formActif,
  setFormActif,
  formFamille,
  setFormFamille,
}: {
  formNom: string;
  setFormNom: (val: string) => void;
  formCouleur: string;
  setFormCouleur: (val: string) => void;
  formActif: boolean;
  setFormActif: (val: boolean) => void;
  formFamille: string;
  setFormFamille: (val: string) => void;
}) {
  return (
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
          {DEFAULT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormCouleur(color)}
              className={cn(
                "w-8 h-8 rounded-full transition-transform",
                formCouleur === color &&
                  "ring-2 ring-offset-2 ring-primary scale-110",
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Label
            htmlFor="custom-color"
            className="text-sm text-muted-foreground"
          >
            Personnalisée :
          </Label>
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
            {FAMILLES.map((f) => (
              <SelectItem key={f} value={f}>
                {f}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Switch id="actif" checked={formActif} onCheckedChange={setFormActif} />
        <Label htmlFor="actif">Active</Label>
      </div>
    </div>
  );
}

export function TypologiesTab() {
  const {
    data,
    addTypologie,
    updateTypologie,
    deleteTypologie,
    reorderTypologies,
  } = useData();
  const isMobile = useIsMobile();

  // Sort typologies by ordre
  const sortedTypologies = useMemo(
    () => [...data.typologies].sort((a, b) => a.ordre - b.ordre),
    [data.typologies],
  );

  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editingTypologie, setEditingTypologie] = useState<Typologie | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Form state
  const [formNom, setFormNom] = useState("");
  const [formCouleur, setFormCouleur] = useState(DEFAULT_COLORS[0]);
  const [formActif, setFormActif] = useState(true);
  const [formFamille, setFormFamille] = useState<string>("");

  // Reset form when dialog closes
  useEffect(() => {
    if (!showDialog) {
      setEditingTypologie(null);
      setFormNom("");
      setFormCouleur(DEFAULT_COLORS[0]);
      setFormActif(true);
      setFormFamille("");
    }
  }, [showDialog]);

  // Open dialog for new/edit
  const openDialog = (typologie?: Typologie) => {
    if (typologie) {
      setEditingTypologie(typologie);
      setFormNom(typologie.nom);
      setFormCouleur(typologie.couleur);
      setFormActif(typologie.actif);
      setFormFamille(typologie.famille || "");
    } else {
      setEditingTypologie(null);
      setFormNom("");
      setFormCouleur(
        DEFAULT_COLORS[data.typologies.length % DEFAULT_COLORS.length],
      );
      setFormActif(true);
      setFormFamille("");
    }
    setShowDialog(true);
  };

  // Save typologie
  const handleSave = () => {
    if (!formNom.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    if (editingTypologie) {
      updateTypologie({
        ...editingTypologie,
        nom: formNom.trim(),
        couleur: formCouleur,
        actif: formActif,
        famille: formFamille || undefined,
      });
      toast.success("Typologie modifiée");
    } else {
      addTypologie({
        nom: formNom.trim(),
        couleur: formCouleur,
        actif: formActif,
        famille: formFamille || undefined,
      });
      toast.success("Typologie créée");
    }

    setShowDialog(false);
  };

  // Delete typologie
  const handleDelete = (id: string) => {
    deleteTypologie(id);
    setDeleteConfirm(null);
    toast.success("Typologie supprimée");
  };

  // Toggle active
  const toggleActive = (typologie: Typologie) => {
    updateTypologie({ ...typologie, actif: !typologie.actif });
    toast.success(
      typologie.actif ? "Typologie désactivée" : "Typologie activée",
    );
  };

  // Reorder
  const moveTypologie = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedTypologies.length) return;

    const newList = [...sortedTypologies];
    const temp = newList[index];
    newList[index] = newList[newIndex];
    newList[newIndex] = temp;

    reorderTypologies(newList);
  };

  // Group by famille
  const groupedTypologies = useMemo(() => {
    const groups: Record<string, Typologie[]> = {};
    sortedTypologies.forEach((t) => {
      const famille = t.famille || "Sans famille";
      if (!groups[famille]) groups[famille] = [];
      groups[famille].push(t);
    });
    return groups;
  }, [sortedTypologies]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Typologies</CardTitle>
              <CardDescription>
                {data.typologies.length} typologie(s) •{" "}
                {data.typologies.filter((t) => t.actif).length} active(s)
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
              <p className="text-sm mt-1">
                Créez votre première typologie pour commencer à saisir des
                données.
              </p>
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
                <div
                  key={typologie.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    !typologie.actif && "opacity-60 bg-muted/30",
                  )}
                >
                  {/* Drag handle / reorder buttons */}
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveTypologie(index, "up")}
                      disabled={index === 0}
                    >
                      <ChevronUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5"
                      onClick={() => moveTypologie(index, "down")}
                      disabled={index === sortedTypologies.length - 1}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </div>

                  {/* Color indicator */}
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: typologie.couleur }}
                  />

                  {/* Name and famille */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {typologie.nom}
                      </span>
                      {typologie.famille && (
                        <Badge variant="secondary" className="text-xs">
                          {typologie.famille}
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
              {Object.entries(groupedTypologies).map(
                ([famille, typologies]) => (
                  <div key={famille} className="p-3 rounded-lg bg-muted/50">
                    <div className="font-medium text-sm">{famille}</div>
                    <div className="text-2xl font-bold mt-1">
                      {typologies.length}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {typologies.filter((t) => t.actif).length} active(s)
                    </div>
                  </div>
                ),
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog - Desktop */}
      {!isMobile && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingTypologie
                  ? "Modifier la typologie"
                  : "Nouvelle typologie"}
              </DialogTitle>
              <DialogDescription>
                {editingTypologie
                  ? "Modifiez les informations de cette typologie."
                  : "Créez une nouvelle catégorie de public."}
              </DialogDescription>
            </DialogHeader>
            <FormContent
              formNom={formNom}
              setFormNom={setFormNom}
              formCouleur={formCouleur}
              setFormCouleur={setFormCouleur}
              formActif={formActif}
              setFormActif={setFormActif}
              formFamille={formFamille}
              setFormFamille={setFormFamille}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave}>
                {editingTypologie ? "Enregistrer" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Drawer - Mobile */}
      {isMobile && (
        <Drawer open={showDialog} onOpenChange={setShowDialog}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>
                {editingTypologie
                  ? "Modifier la typologie"
                  : "Nouvelle typologie"}
              </DrawerTitle>
              <DrawerDescription>
                {editingTypologie
                  ? "Modifiez les informations de cette typologie."
                  : "Créez une nouvelle catégorie de public."}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">
              <FormContent
                formNom={formNom}
                setFormNom={setFormNom}
                formCouleur={formCouleur}
                setFormCouleur={setFormCouleur}
                formActif={formActif}
                setFormActif={setFormActif}
                formFamille={formFamille}
                setFormFamille={setFormFamille}
              />
            </div>
            <DrawerFooter>
              <Button onClick={handleSave}>
                {editingTypologie ? "Enregistrer" : "Créer"}
              </Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Annuler
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette typologie ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera la typologie et toutes les données
              associées dans l'historique. Cette action est irréversible.
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
  );
}
