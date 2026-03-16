// Data types for the attendance management application

// Subcategory for a typologie (e.g., "Enfants", "0-12 ans", "Chef d'entreprise")
export interface SousCategorie {
  id: string
  nom: string
  ordre: number
}

export interface Typologie {
  id: string
  nom: string
  couleur: string
  actif: boolean
  ordre: number
  famille?: string
  sousCategories?: SousCategorie[]
}

// Count for a subcategory
export interface SousCategorieCount {
  sous_categorie_id: string
  count: number
}

export interface TypologieCount {
  typologie_id: string
  count: number
  sousCategories?: SousCategorieCount[]
}

export interface JourData {
  date: string // YYYY-MM-DD
  total_visites: number
  override_total: boolean
  typologies: TypologieCount[]
  note: string
  estimee: boolean
  derniere_maj: string // ISO timestamp
}

export interface AppData {
  jours: JourData[]
  typologies: Typologie[]
  version: number
}

// Period types for analytics
export type PeriodType = 'jour' | 'semaine' | 'mois' | 'annee'

// Filter state for analytics
export interface AnalyticsFilters {
  period: PeriodType
  referenceDate: Date
  selectedTypologies: string[]
  showDetails: boolean
  showTrendLine: boolean
}

// KPI data
export interface KPIData {
  totalPeriode: number
  moyenneParJour: number
  jourMax: { date: string; total: number } | null
  jourMin: { date: string; total: number } | null
  top3Typologies: { id: string; nom: string; count: number; percentage: number }[]
  evolutionPrecedente: number | null
  joursAvecDonnees: number
  joursSansDonnees: number
}

// Chart data types
export interface ChartDataPoint {
  date: string
  label: string
  total: number
  [key: string]: string | number
}

// Insight type
export interface Insight {
  type: 'info' | 'warning' | 'anomaly'
  message: string
}

// Default colors for typologies
export const DEFAULT_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
]

// Default subcategories for age ranges
export const DEFAULT_AGE_SUBCATEGORIES: SousCategorie[] = [
  { id: 'age-1', nom: '0-12 ans', ordre: 1 },
  { id: 'age-2', nom: '13-17 ans', ordre: 2 },
  { id: 'age-3', nom: '18-25 ans', ordre: 3 },
  { id: 'age-4', nom: '26-59 ans', ordre: 4 },
  { id: 'age-5', nom: '60+ ans', ordre: 5 },
]

// Default typologies
export const DEFAULT_TYPOLOGIES: Typologie[] = [
  { 
    id: '1', 
    nom: 'Fablab', 
    couleur: '#10b981', 
    actif: true, 
    ordre: 1, 
    famille: 'Numérique',
    sousCategories: [
      { id: 'fab-1', nom: 'Enfants', ordre: 1 },
      { id: 'fab-2', nom: 'Adultes', ordre: 2 },
      { id: 'fab-3', nom: 'Professionnels', ordre: 3 },
    ]
  },
  { 
    id: '2', 
    nom: 'Céramiste', 
    couleur: '#3b82f6', 
    actif: true, 
    ordre: 2, 
    famille: 'Créatif',
    sousCategories: DEFAULT_AGE_SUBCATEGORIES
  },
  { 
    id: '3', 
    nom: 'Atelier couture', 
    couleur: '#f59e0b', 
    actif: true, 
    ordre: 3, 
    famille: 'Créatif',
    sousCategories: [
      { id: 'cout-1', nom: 'Mamans', ordre: 1 },
      { id: 'cout-2', nom: 'Enfants', ordre: 2 },
      { id: 'cout-3', nom: 'Seniors', ordre: 3 },
    ]
  },
  { 
    id: '4', 
    nom: 'Visiteur', 
    couleur: '#8b5cf6', 
    actif: true, 
    ordre: 4, 
    famille: 'Accueil',
    sousCategories: [
      { id: 'vis-1', nom: 'Particuliers', ordre: 1 },
      { id: 'vis-2', nom: 'Chefs d\'entreprise', ordre: 2 },
      { id: 'vis-3', nom: 'Elus', ordre: 3 },
      { id: 'vis-4', nom: 'Groupes scolaires', ordre: 4 },
    ]
  },
  { id: '5', nom: 'Coworking', couleur: '#ec4899', actif: true, ordre: 5, famille: 'Numérique' },
]

// Seed data for demo
export function generateSeedData(): JourData[] {
  const jours: JourData[] = []
  const today = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    // Skip some days randomly
    if (Math.random() > 0.85) continue
    
    const typologies: TypologieCount[] = DEFAULT_TYPOLOGIES.map(t => ({
      typologie_id: t.id,
      count: Math.floor(Math.random() * 15) + 1
    }))
    
    const total = typologies.reduce((sum, t) => sum + t.count, 0)
    
    jours.push({
      date: dateStr,
      total_visites: total,
      override_total: false,
      typologies,
      note: i === 0 ? '' : (Math.random() > 0.7 ? 'Journée normale' : ''),
      estimee: Math.random() > 0.9,
      derniere_maj: new Date().toISOString()
    })
  }
  
  return jours
}
