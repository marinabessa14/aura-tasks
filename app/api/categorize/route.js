
// Código que recebe o título da tarefa, envia para a IA (Groq) e devolve categoria + tempo estimado.



import Groq from 'groq-sdk'

// Pega o título enviado pelo front-end via POST

export async function POST(req) {
  try {
    const { titulo } = await req.json()

    if (!titulo || titulo.trim() === '') {
      return Response.json({ error: 'Título é obrigatório' }, { status: 400 })
    }

     // Cria o cliente do Groq usando a chave do .env.local

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

    // Chama a IA com o modelo LLaMA 3.1 (gratuito e rápido)

    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'user',
          content: `Analise esta tarefa: "${titulo}"

Classifique em UMA das categorias: Trabalho, Estudos, Saúde, Pessoal, Finanças, Casa, Lazer ou Outros.
Estime o tempo necessário para concluir (ex: "15 minutos", "1 hora", "2 horas", "30 minutos").

Responda APENAS com JSON válido, sem markdown, sem explicações:
{"categoria":"UmaPalavra","tempo_estimado":"X unidade"}`
        }
      ]
    })

    // Pega o texto da resposta da IA
    const text = completion.choices[0].message.content
    // Remove possíveis blocos de markdown que a IA pode retornar (json)
    const clean = text.replace(/```json|```/g, '').trim()
   // Converte o texto JSON em objeto JavaScript
    const json = JSON.parse(clean)

    return Response.json(json)

    // Se qualquer coisa der errado, retorna valores padrãopara o app não quebrar na tela do usuário
  } catch (error) {
    console.log('ENTROU NO CATCH')
    console.error('Erro detalhado:', JSON.stringify(error, null, 2))
    console.error('Mensagem:', error.message)
    return Response.json(
      { categoria: 'Outros', tempo_estimado: 'Não estimado' },
      { status: 200 }
    )
  }
}