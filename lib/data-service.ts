'use client'

import {
  type AppData,
  type JourData,
  type Typologie,
  DEFAULT_TYPOLOGIES,
  generateSeedData
} from './types'

const STORAGE_KEY = 'tiers-lieu-data'
const CURRENT_VERSION = 1

// Initialize or load data from localStorage
export function loadData(): AppData {
  if (typeof window === 'undefined') {
    return {
      jours: [],
      typologies: DEFAULT_TYPOLOGIES,
      version: CURRENT_VERSION
    }
  }

  const stored = localStorage.getItem(STORAGE_KEY)
  
  if (stored) {
    try {
      const data = JSON.parse(stored) as AppData
      return data
    } catch {
      // Invalid data, reset
    }
  }

  // Initialize with seed data
  const initialData: AppData = {
    jours: generateSeedData(),
    typologies: DEFAULT_TYPOLOGIES,
    version: CURRENT_VERSION
  }
  
  saveData(initialData)
  return initialData
}

// Save data to localStorage
export function saveData(data: AppData): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Get data for a specific day
export function getJour(data: AppData, date: string): JourData | undefined {
  return data.jours.find(j => j.date === date)
}

// Save or update a day's data
export function saveJour(data: AppData, jour: JourData): AppData {
  const existingIndex = data.jours.findIndex(j => j.date === jour.date)
  const newJours = [...data.jours]
  
  jour.derniere_maj = new Date().toISOString()
  
  if (existingIndex >= 0) {
    newJours[existingIndex] = jour
  } else {
    newJours.push(jour)
  }
  
  // Sort by date
  newJours.sort((a, b) => a.date.localeCompare(b.date))
  
  const newData = { ...data, jours: newJours }
  saveData(newData)
  return newData
}

// Delete a day's data
export function deleteJour(data: AppData, date: string): AppData {
  const newJours = data.jours.filter(j => j.date !== date)
  const newData = { ...data, jours: newJours }
  saveData(newData)
  return newData
}

// Typologie CRUD
export function addTypologie(data: AppData, typologie: Omit<Typologie, 'id' | 'ordre'>): AppData {
  const maxOrdre = Math.max(0, ...data.typologies.map(t => t.ordre))
  const newTypologie: Typologie = {
    ...typologie,
    id: crypto.randomUUID(),
    ordre: maxOrdre + 1
  }
  
  const newData = {
    ...data,
    typologies: [...data.typologies, newTypologie]
  }
  
  saveData(newData)
  return newData
}

export function updateTypologie(data: AppData, typologie: Typologie): AppData {
  const newTypologies = data.typologies.map(t =>
    t.id === typologie.id ? typologie : t
  )
  
  const newData = { ...data, typologies: newTypologies }
  saveData(newData)
  return newData
}

export function deleteTypologie(data: AppData, id: string): AppData {
  const newTypologies = data.typologies.filter(t => t.id !== id)
  
  // Also remove from all jours
  const newJours = data.jours.map(j => ({
    ...j,
    typologies: j.typologies.filter(t => t.typologie_id !== id)
  }))
  
  const newData = { ...data, typologies: newTypologies, jours: newJours }
  saveData(newData)
  return newData
}

export function reorderTypologies(data: AppData, typologies: Typologie[]): AppData {
  const reorderedTypologies = typologies.map((t, index) => ({
    ...t,
    ordre: index + 1
  }))
  
  const newData = { ...data, typologies: reorderedTypologies }
  saveData(newData)
  return newData
}

// Export/Import
export function exportData(data: AppData): string {
  return JSON.stringify(data, null, 2)
}

export function importData(jsonString: string): AppData | null {
  try {
    const data = JSON.parse(jsonString) as AppData
    if (data.jours && data.typologies && data.version) {
      saveData(data)
      return data
    }
    return null
  } catch {
    return null
  }
}

// Reset data
export function resetData(): AppData {
  const initialData: AppData = {
    jours: generateSeedData(),
    typologies: DEFAULT_TYPOLOGIES,
    version: CURRENT_VERSION
  }
  
  saveData(initialData)
  return initialData
}

// Clear all data
export function clearAllData(): AppData {
  const emptyData: AppData = {
    jours: [],
    typologies: DEFAULT_TYPOLOGIES,
    version: CURRENT_VERSION
  }
  
  saveData(emptyData)
  return emptyData
}

// Analytics helpers
export function getJoursInRange(data: AppData, start: Date, end: Date): JourData[] {
  const startStr = start.toISOString().split('T')[0]
  const endStr = end.toISOString().split('T')[0]
  
  return data.jours.filter(j => j.date >= startStr && j.date <= endStr)
}

export function calculateTotal(jour: JourData, typologies: Typologie[]): number {
  if (jour.override_total) {
    return jour.total_visites
  }
  
  return jour.typologies
    .filter(t => {
      const typ = typologies.find(ty => ty.id === t.typologie_id)
      return typ?.actif
    })
    .reduce((sum, t) => sum + t.count, 0)
}
