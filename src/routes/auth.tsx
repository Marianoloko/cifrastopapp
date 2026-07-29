import { createFileRoute } from '@tanstack/react-router'
import { PlanGrid } from '@/components/PlanGrid'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Route = createFileRoute('/_authenticated/admin')({
  component: AdminPage,
})

function AdminPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Painel de Administração</h1>
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Planos de Assinatura</CardTitle>
        </CardHeader>
        <CardContent>
          <PlanGrid />
        </CardContent>
      </Card>
    </div>
  )
}
