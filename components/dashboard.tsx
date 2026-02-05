'use client'

import { useState } from 'react'
import { ClipboardList, Calendar, BarChart3, Tags, Settings } from 'lucide-react'
import { useData } from '@/lib/data-context'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { SaisieTab } from '@/components/tabs/saisie-tab'
import { CalendrierTab } from '@/components/tabs/calendrier-tab'
import { AnalysesTab } from '@/components/tabs/analyses-tab'
import { TypologiesTab } from '@/components/tabs/typologies-tab'
import { ReglagesTab } from '@/components/tabs/reglages-tab'
import { cn } from '@/lib/utils'

const tabs = [
  { id: 'saisie', label: 'Saisie', icon: ClipboardList },
  { id: 'calendrier', label: 'Calendrier', icon: Calendar },
  { id: 'analyses', label: 'Analyses', icon: BarChart3 },
  { id: 'typologies', label: 'Typologies', icon: Tags },
  { id: 'reglages', label: 'Réglages', icon: Settings },
]

export function Dashboard() {
  const { isLoading } = useData()
  const [activeTab, setActiveTab] = useState('saisie')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          <div className="space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
            <Skeleton className="h-64" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl text-balance">
            Gestion de fréquentation
          </h1>
          <p className="text-muted-foreground mt-1">
            Tableau de bord de votre tiers-lieu
          </p>
        </header>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full h-auto flex-wrap justify-start gap-1 bg-muted/50 p-1">
            {tabs.map(tab => {
              const Icon = tab.icon
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 data-[state=active]:bg-background',
                    'data-[state=active]:shadow-sm'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </TabsTrigger>
              )
            })}
          </TabsList>

          <TabsContent value="saisie" className="mt-6">
            <SaisieTab />
          </TabsContent>

          <TabsContent value="calendrier" className="mt-6">
            <CalendrierTab />
          </TabsContent>

          <TabsContent value="analyses" className="mt-6">
            <AnalysesTab />
          </TabsContent>

          <TabsContent value="typologies" className="mt-6">
            <TypologiesTab />
          </TabsContent>

          <TabsContent value="reglages" className="mt-6">
            <ReglagesTab />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>Gestion de fréquentation - Tiers-lieu / Fablab</p>
        </footer>
      </div>
    </div>
  )
}
