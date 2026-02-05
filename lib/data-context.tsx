'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { AppData, JourData, Typologie } from './types'
import {
  loadData,
  saveJour as saveJourService,
  deleteJour as deleteJourService,
  addTypologie as addTypologieService,
  updateTypologie as updateTypologieService,
  deleteTypologie as deleteTypologieService,
  reorderTypologies as reorderTypologiesService,
  exportData,
  importData,
  resetData as resetDataService,
  clearAllData as clearAllDataService
} from './data-service'

interface DataContextType {
  data: AppData
  isLoading: boolean
  saveJour: (jour: JourData) => void
  deleteJour: (date: string) => void
  addTypologie: (typologie: Omit<Typologie, 'id' | 'ordre'>) => void
  updateTypologie: (typologie: Typologie) => void
  deleteTypologie: (id: string) => void
  reorderTypologies: (typologies: Typologie[]) => void
  exportToJson: () => string
  importFromJson: (json: string) => boolean
  resetData: () => void
  clearAllData: () => void
}

const DataContext = createContext<DataContextType | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({
    jours: [],
    typologies: [],
    version: 1
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loaded = loadData()
    setData(loaded)
    setIsLoading(false)
  }, [])

  const saveJour = useCallback((jour: JourData) => {
    setData(prev => saveJourService(prev, jour))
  }, [])

  const deleteJour = useCallback((date: string) => {
    setData(prev => deleteJourService(prev, date))
  }, [])

  const addTypologie = useCallback((typologie: Omit<Typologie, 'id' | 'ordre'>) => {
    setData(prev => addTypologieService(prev, typologie))
  }, [])

  const updateTypologie = useCallback((typologie: Typologie) => {
    setData(prev => updateTypologieService(prev, typologie))
  }, [])

  const deleteTypologieHandler = useCallback((id: string) => {
    setData(prev => deleteTypologieService(prev, id))
  }, [])

  const reorderTypologies = useCallback((typologies: Typologie[]) => {
    setData(prev => reorderTypologiesService(prev, typologies))
  }, [])

  const exportToJson = useCallback(() => {
    return exportData(data)
  }, [data])

  const importFromJson = useCallback((json: string) => {
    const imported = importData(json)
    if (imported) {
      setData(imported)
      return true
    }
    return false
  }, [])

  const resetDataHandler = useCallback(() => {
    setData(resetDataService())
  }, [])

  const clearAllDataHandler = useCallback(() => {
    setData(clearAllDataService())
  }, [])

  return (
    <DataContext.Provider
      value={{
        data,
        isLoading,
        saveJour,
        deleteJour,
        addTypologie,
        updateTypologie,
        deleteTypologie: deleteTypologieHandler,
        reorderTypologies,
        exportToJson,
        importFromJson,
        resetData: resetDataHandler,
        clearAllData: clearAllDataHandler
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
