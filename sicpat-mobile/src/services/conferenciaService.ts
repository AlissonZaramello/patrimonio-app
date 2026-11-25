
import { autenticacaoService } from './autenticacaoService'

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

export interface ConferenciaVinculada {
  conferenciaId: string
  salaId: string
  status: string
}

export const conferenciaService = {

  async vincular(codigo: string): Promise<ConferenciaVinculada> {
    const token = await autenticacaoService.obterToken()

    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    if (!apiUrl) {
      throw new Error('Endereço da API não configurado.')
    }

    const resposta = await fetch(
      `${apiUrl}/api/conferencias/vincular`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: codigo.trim().toUpperCase(),
        }),
      }
    )

    const dados = await resposta.json().catch(() => null)

    if (!resposta.ok) {
      if (resposta.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      throw new Error(
        dados?.mensagem || 'Não foi possível vincular a conferência.'
      )
    }

    return dados as ConferenciaVinculada
  },

  async registrarLeitura(conferenciaId: string, uuidTag: string) {
    const token = await autenticacaoService.obterToken()

    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    const resposta = await fetch(
      `${apiUrl}/api/conferencias/${conferenciaId}/leituras-nfc`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ uuidTag }),
      }
    )

    const dados = await resposta.json().catch(() => null)

    if (!resposta.ok) {
      throw new Error(
        dados?.mensagem || 'Não foi possível registrar a leitura NFC.'
      )
    }

    return dados as {
      itemId: string
      patrimonioId: string
      salaId: string
      resultado: string
      lidoEm: string
      totalEncontrados: number
      totalDivergentes: number
    }
  },

  async finalizar(conferenciaId: string) {
    const token = await autenticacaoService.obterToken()

    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    if (!apiUrl) {
      throw new Error('Endereço da API não configurado.')
    }

    const resposta = await fetch(
      `${apiUrl}/api/conferencias/${conferenciaId}/finalizar`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const dados = await resposta.json().catch(() => null)

    if (!resposta.ok) {
      throw new Error(
        dados?.mensagem || 'Não foi possível finalizar a conferência.'
      )
    }

    return dados as {
      conferenciaId: string
      status: string
      encerradaEm: string
      totalEsperados: number
      totalEncontrados: number
      totalAusentes: number
      totalDivergentes: number
    }
  },

  async listarEmAndamento(usuarioId: string): Promise<ConferenciaConsulta[]> {
    const token = await autenticacaoService.obterToken()

    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    const resposta = await fetch(`${apiUrl}/api/conferencias`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!resposta.ok) {
      if (resposta.status === 401) {
        throw new Error('Sessão expirada. Faça login novamente.')
      }

      throw new Error('Não foi possível consultar as conferências.')
    }

    const conferencias: ConferenciaConsulta[] = await resposta.json()

    return conferencias.filter(
      conferencia =>
        conferencia.status === 'EM_ANDAMENTO' &&
        conferencia.operadorId === usuarioId
    )
  },

  async buscarPorId(id: string): Promise<DetalhesConferencia> {
    const token = await autenticacaoService.obterToken()

    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.')
    }

    const resposta = await fetch(
      `${apiUrl}/api/conferencias/${id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )

    const dados = await resposta.json().catch(() => null)

    if (!resposta.ok) {
      throw new Error(
        dados?.mensagem || 'Erro ao consultar conferência.'
      )
    }

    return dados as DetalhesConferencia
  },

}

export interface ConferenciaConsulta {
  id: string
  salaId: string
  salaNome: string
  responsavelId: string
  operadorId: string | null
  status: string
}

export interface DetalhesConferencia {
  id: string
  salaId: string
  salaNome: string
  status: string
  totalEsperados: number
  totalEncontrados: number
  totalAusentes: number
  totalDivergentes: number
}
