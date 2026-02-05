import { DataProvider } from '@/lib/data-context'
import { Dashboard } from '@/components/dashboard'

export default function Page() {
  return (
    <DataProvider>
      <Dashboard />
    </DataProvider>
  )
}
