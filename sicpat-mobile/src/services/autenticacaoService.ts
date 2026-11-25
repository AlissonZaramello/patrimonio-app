import { Preferences } from '@capacitor/preferences'

const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, '')

export interface UsuarioAutenticado {
  id: string
  nome: string
  email: string
  role: string
}

interface RespostaLogin extends UsuarioAutenticado {
  token: string
}

export const autenticacaoService = {
  async entrar(email: string, senha: string) {
    if (!apiUrl) {
      throw new Error('Endereço da API não configurado.')
    }

    let resposta: Response

    try {
      resposta = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      })
    } catch (erro) {
        console.error('Falha na conexão com a API:', erro)
        console.error('URL utilizada:', `${apiUrl}/api/auth/login`)

        throw new Error(
          erro instanceof Error
            ? `Erro de conexão: ${erro.message}`
            : 'Erro desconhecido ao conectar à API.'
        )
      }

    const dados = await resposta.json().catch(() => null)

    if (!resposta.ok) {
      throw new Error(
        dados?.mensagem || 'E-mail ou senha inválidos.'
      )
    }

    const usuario: UsuarioAutenticado = {
      id: dados.id,
      nome: dados.nome,
      email: dados.email,
      role: dados.role,
    }

    await Preferences.set({
      key: 'token',
      value: dados.token,
    })

    await Preferences.set({
      key: 'usuario',
      value: JSON.stringify(usuario),
    })

    return usuario
  },

  async obterToken() {
    const { value } = await Preferences.get({ key: 'token' })
    return value
  },

  async obterUsuario(): Promise<UsuarioAutenticado | null> {
    const { value } = await Preferences.get({ key: 'usuario' })
    return value ? JSON.parse(value) : null
  },

  async sair() {
    await Preferences.remove({ key: 'token' })
    await Preferences.remove({ key: 'usuario' })
  },
}
