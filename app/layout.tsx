import type { ReactNode } from 'react'

export const metadata = {
  title: '⚡Aura-Tasks — Gerenciador Inteligente de Tarefas',
  description: 'Gerencie suas tarefas com categorização e estimativa de tempo por IA.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, background: '#e5e5e2', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}