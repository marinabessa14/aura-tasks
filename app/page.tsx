'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import styles from './page.module.css'

// Dicionário que define emoji e cores para cada categoria

const CATEGORIAS: Record<string, { emoji: string; cor: string; bg: string }> = {
  Trabalho:  { emoji: '💼', cor: '#185FA5', bg: '#E6F1FB' },
  Estudos:   { emoji: '📚', cor: '#0F6E56', bg: '#E1F5EE' },
  Saúde:     { emoji: '🏃', cor: '#993556', bg: '#FBEAF0' },
  Pessoal:   { emoji: '🙂', cor: '#3C3489', bg: '#EEEDFE' },
  Finanças:  { emoji: '💰', cor: '#3B6D11', bg: '#EAF3DE' },
  Casa:      { emoji: '🏠', cor: '#854F0B', bg: '#FAEEDA' },
  Lazer:     { emoji: '🎮', cor: '#993C1D', bg: '#FAECE7' },
  Outros:    { emoji: '📌', cor: '#5F5E5A', bg: '#F1EFE8' },
}

// Define o formato de uma tarefa (TypeScript)
interface Tarefa {
  id: number
  titulo: string
  categoria: string
  tempo_estimado: string
  concluida: boolean
}

export default function Home() {
  const [titulo, setTitulo] = useState('')
  const [tarefas, setTarefas] = useState<Tarefa[]>([])
  const [loading, setLoading] = useState(false)
  const [carregando, setCarregando] = useState(true)
  const [filtro, setFiltro] = useState('Todas')
  const [erro, setErro] = useState('')

  useEffect(() => {
    buscarTarefas()
  }, [])

  // Busca todas as tarefas do Supabase e atualiza o estado

  async function buscarTarefas() {
    setCarregando(true)
    const { data, error } = await supabase
      .from('tarefas')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      console.error('Erro ao buscar tarefas:', error)
    } else {
      setTarefas(data || [])
    }
    setCarregando(false)
  }

   // Fluxo principal: IA → Supabase → Atualiza tela

  async function adicionarTarefa() {
    if (!titulo.trim()) {
      setErro('Digite o título da tarefa antes de adicionar.')
      return
    }
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: titulo.trim() }),
      })
      const { categoria, tempo_estimado } = await res.json()

      const { error } = await supabase.from('tarefas').insert({
        titulo: titulo.trim(),
        categoria: categoria || 'Outros',
        tempo_estimado: tempo_estimado || 'Não estimado',
        concluida: false,
      })

      if (error) throw error

      setTitulo('')
      await buscarTarefas()
    } catch (err) {
      console.error('Erro ao adicionar tarefa:', err)
      setErro('Erro ao adicionar tarefa. Tente novamente.')
    }

    setLoading(false)
  }

   // Alterna entre concluída e não concluída

  async function toggleConcluida(id: number, concluida: boolean) {
    await supabase
      .from('tarefas')
      .update({ concluida: !concluida })
      .eq('id', id)
    await buscarTarefas()
  }

    // Remove a tarefa do banco de dados

  async function deletarTarefa(id: number) {
    await supabase.from('tarefas').delete().eq('id', id)
    await buscarTarefas()
  }

  const tarefasFiltradas =
    filtro === 'Todas' ? tarefas : tarefas.filter(t => t.categoria === filtro)

  const categoriasPresentes = ['Todas', ...new Set(tarefas.map(t => t.categoria).filter(Boolean))]

  const total = tarefas.length
  const concluidas = tarefas.filter(t => t.concluida).length

  // ─── TELA ──────────

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <h1 className={styles.titulo}>⚡ Aura-Tasks</h1>
        <p className={styles.subtitulo}>A IA categoriza e estima o tempo para você</p>
        {total > 0 && (
          <div className={styles.progresso}>
            <div
              className={styles.progressoBarra}
              style={{ width: `${(concluidas / total) * 100}%` }}
            />
          </div>
        )}
        {total > 0 && (
          <p className={styles.progressoTexto}>{concluidas} de {total} concluídas</p>
        )}
      </header>

      <section className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <input
            className={styles.input}
            type="text"
            placeholder="Ex: Estudar para a prova de banco de dados..."
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && adicionarTarefa()}
            disabled={loading}
          />
          <button
            className={styles.botao}
            onClick={adicionarTarefa}
            disabled={loading}
          >
            {loading ? '⏳ Analisando...' : '+ Adicionar'}
          </button>
        </div>
        {erro && <p className={styles.erro}>{erro}</p>}
        {loading && (
          <p className={styles.dica}>
            🤖 A IA está categorizando e estimando o tempo da sua tarefa...
          </p>
        )}
      </section>

      {categoriasPresentes.length > 1 && (
        <div className={styles.filtros}>
          {categoriasPresentes.map(cat => (
            <button
              key={cat}
              className={`${styles.filtroBtn} ${filtro === cat ? styles.filtroBtnAtivo : ''}`}
              onClick={() => setFiltro(cat)}
            >
              {cat !== 'Todas' && CATEGORIAS[cat]?.emoji} {cat}
            </button>
          ))}
        </div>
      )}

      <section className={styles.lista}>
        {carregando ? (
          <p className={styles.vazio}>Carregando tarefas...</p>
        ) : tarefasFiltradas.length === 0 ? (
          <p className={styles.vazio}>
            {filtro === 'Todas'
              ? 'Nenhuma tarefa ainda. Adicione sua primeira acima! 🚀'
              : `Nenhuma tarefa em "${filtro}".`}
          </p>
        ) : (
          tarefasFiltradas.map(tarefa => {
            const info = CATEGORIAS[tarefa.categoria] || CATEGORIAS['Outros']
            return (
              <div
                key={tarefa.id}
                className={`${styles.card} ${tarefa.concluida ? styles.cardConcluida : ''}`}
              >
                <button
                  className={styles.checkbox}
                  onClick={() => toggleConcluida(tarefa.id, tarefa.concluida)}
                >
                  {tarefa.concluida ? '✅' : '⬜'}
                </button>

                <div className={styles.cardInfo}>
                  <p className={`${styles.cardTitulo} ${tarefa.concluida ? styles.cardTituloConcluido : ''}`}>
                    {tarefa.titulo}
                  </p>
                  <div className={styles.cardMeta}>
                    <span
                      className={styles.tag}
                      style={{ background: info.bg, color: info.cor }}
                    >
                      {info.emoji} {tarefa.categoria}
                    </span>
                    <span className={styles.tempo}>⏱ {tarefa.tempo_estimado}</span>
                  </div>
                </div>

                <button
                  className={styles.deletar}
                  onClick={() => deletarTarefa(tarefa.id)}
                >
                  🗑
                </button>
              </div>
            )
          })
        )}
      </section>
    </main>
  )
}