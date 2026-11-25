
<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="pagina-login">
        <div class="login-card">
          <div class="marca">
            <h1>SICPAT-RFID</h1>
            <p>Conferência Patrimonial</p>
          </div>

          <form v-if="!usuario" @submit.prevent="entrar">
            <h2>Entrar</h2>

            <label for="email">E-mail</label>
            <input
              id="email"
              v-model.trim="email"
              type="email"
              autocomplete="username"
              placeholder="Seu e-mail"
              required
            />

            <label for="senha">Senha</label>
            <input
              id="senha"
              v-model="senha"
              type="password"
              autocomplete="current-password"
              placeholder="Sua senha"
              required
            />

            <p v-if="erro" class="erro">
              {{ erro }}
            </p>

            <ion-button
              expand="block"
              type="submit"
              :disabled="carregando"
            >
              {{ carregando ? 'Entrando...' : 'Entrar' }}
            </ion-button>
          </form>

          <div v-else class="area-logada">
            <h2>Olá, {{ usuario.nome }}</h2>
            <p class="subtitulo">Vincular conferência</p>

            <template v-if="!conferenciaVinculada">
              <p>
                Digite o código gerado no painel Web
                para iniciar a conferência da sala.
              </p>

              <div v-if="verificandoConferencias">
                <p>Verificando conferências em andamento...</p>
              </div>

              <div v-if="erroRecuperacao" class="erro">
                {{ erroRecuperacao }}
              </div>

              <div
                v-if="conferenciasParaRetomar.length > 0"
                class="conferencias-pendentes"
              >
                <h3>Continuar conferência</h3>

                <p>
                  Encontramos uma ou mais conferências em andamento.
                  Você pode continuar sem gerar outro código.
                </p>

                <div
                  v-for="conferencia in conferenciasParaRetomar"
                  :key="conferencia.id"
                  class="conferencia-retomada"
                >
                  <strong>
                    {{ conferencia.salaNome || conferencia.salaId }}
                  </strong>

                  <span>Em andamento</span>

                  <ion-button
                    expand="block"
                    @click="retomarConferencia(conferencia)"
                  >
                    Continuar
                  </ion-button>
                </div>
              </div>

              <form @submit.prevent="vincularConferencia">
                <label for="codigo">Código de vinculação</label>

                <input
                  id="codigo"
                  v-model.trim="codigoVinculacao"
                  maxlength="10"
                  autocomplete="off"
                  placeholder="Ex.: A7K9P2X4Q"
                  required
                />

                <p v-if="erroVinculacao" class="erro">
                  {{ erroVinculacao }}
                </p>

                <ion-button
                  expand="block"
                  type="submit"
                  :disabled="vinculando"
                >
                  {{ vinculando ? 'Vinculando...' : 'Vincular conferência' }}
                </ion-button>
              </form>
            </template>

            <div v-else class="conferencia-ativa">
              <h3>Conferência vinculada!</h3>

              <p>
                <strong>Conferência:</strong>
                {{ conferenciaVinculada.conferenciaId }}
              </p>

              <p>
                <strong>Sala:</strong>
                {{ conferenciaVinculada.salaId }}
              </p>

              <p>
                <strong>Status:</strong>
                {{ conferenciaVinculada.status }}
              </p>

              <p class="mensagem">
                Agora podemos iniciar a leitura das etiquetas NFC.
              </p>

              <div class="leitor-nfc">
                <h3>Leitura de patrimônios</h3>

                <p>Aproxime o celular da etiqueta NFC do patrimônio.</p>

                <ion-button
                  v-if="!leituraAtiva && !conferenciaFinalizada"
                  expand="block"
                  @click="iniciarLeituraNfc"
                >
                  Iniciar leitor NFC
                </ion-button>

                <ion-button
                  v-if="leituraAtiva && !conferenciaFinalizada"
                  expand="block"
                  color="medium"
                  @click="pararLeituraNfc"
                >
                  Parar leitor NFC
                </ion-button>

                <p v-if="leituraAtiva" class="indicador-leitura">
                  {{ processandoLeitura
                    ? 'Registrando patrimônio...'
                    : 'Aguardando aproximação da etiqueta...' }}
                </p>

                <p v-if="mensagemNfc" class="mensagem">
                  {{ mensagemNfc }}
                </p>

                <p v-if="erroNfc" class="erro">
                  {{ erroNfc }}
                </p>

                <div v-if="ultimoUid" class="resultado-nfc">
                  <p><strong>Última tag:</strong> {{ ultimoUid }}</p>
                  <p v-if="ultimoResultado">
                    <strong>Resultado:</strong> {{ ultimoResultado }}
                  </p>
                </div>

                <div class="totais-nfc">
                  <p>Encontrados: <strong>{{ totalEncontrados }}</strong></p>
                  <p>Divergentes: <strong>{{ totalDivergentes }}</strong></p>
                </div>
              </div>

              <div v-if="!conferenciaFinalizada" class="finalizacao">
                <h3>Encerrar conferência</h3>

                <p>
                  Ao finalizar, os patrimônios que não foram lidos
                  serão registrados como ausentes.
                </p>

                <ion-button
                  expand="block"
                  color="success"
                  :disabled="finalizando || processandoLeitura"
                  @click="finalizarConferencia"
                >
                  {{ finalizando ? 'Finalizando...' : 'Finalizar conferência' }}
                </ion-button>

                <p v-if="erroFinalizacao" class="erro">
                  {{ erroFinalizacao }}
                </p>
              </div>

              <div v-else class="resumo-finalizacao">
                <h3>Conferência concluída!</h3>

                <p>Esperados: {{ resumoFinalizacao?.totalEsperados }}</p>
                <p>Encontrados: {{ resumoFinalizacao?.totalEncontrados }}</p>
                <p>Ausentes: {{ resumoFinalizacao?.totalAusentes }}</p>
                <p>Divergentes: {{ resumoFinalizacao?.totalDivergentes }}</p>
              </div>
            </div>

            <ion-button
              expand="block"
              fill="outline"
              color="medium"
              @click="sair"
            >
              Sair
            </ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { onUnmounted } from 'vue'
import { CapacitorNfc } from '@capgo/capacitor-nfc'
import { IonPage, IonContent, IonButton } from '@ionic/vue'
import { conferenciaService, type ConferenciaVinculada, } from '@/services/conferenciaService'
import { autenticacaoService, type UsuarioAutenticado, } from '@/services/autenticacaoService'
import type { ConferenciaConsulta } from '@/services/conferenciaService'

const email = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)
const usuario = ref<UsuarioAutenticado | null>(null)
const codigoVinculacao = ref('')
const vinculando = ref(false)
const erroVinculacao = ref('')
const leituraAtiva = ref(false)
const processandoLeitura = ref(false)
const mensagemNfc = ref('')
const erroNfc = ref('')
const ultimoUid = ref('')
const ultimoResultado = ref('')
const finalizando = ref(false)
const conferenciaFinalizada = ref(false)
const erroFinalizacao = ref('')
const conferenciasParaRetomar = ref<ConferenciaConsulta[]>([])
const verificandoConferencias = ref(false)
const erroRecuperacao = ref('')

const totalEncontrados = ref(0)
const totalDivergentes = ref(0)

const resumoFinalizacao = ref<{
  totalEsperados: number
  totalEncontrados: number
  totalAusentes: number
  totalDivergentes: number
} | null>(null)

let removerListener: (() => Promise<void>) | null = null

const conferenciaVinculada = ref<ConferenciaVinculada | null>(null)

function formatarUid(bytes: number[]): string {
  return bytes
    .map(byte =>
      (byte & 0xff).toString(16).padStart(2, '0')
    )
    .join('')
    .toUpperCase()
}

async function entrar() {
  if (carregando.value) return

  erro.value = ''
  carregando.value = true

  try {
    usuario.value = await autenticacaoService.entrar(
      email.value,
      senha.value
    )
    await carregarConferenciasEmAndamento()

    senha.value = ''
  } catch (e) {
    erro.value =
      e instanceof Error
        ? e.message
        : 'Erro inesperado ao autenticar.'
  } finally {
    carregando.value = false
  }
}

async function sair() {
  await pararLeituraNfc()
  await autenticacaoService.sair()
  usuario.value = null
  conferenciaVinculada.value = null
  conferenciasParaRetomar.value = []
  conferenciaFinalizada.value = false
  resumoFinalizacao.value = null
  totalEncontrados.value = 0
  totalDivergentes.value = 0
  ultimoUid.value = ''
  ultimoResultado.value = ''
  mensagemNfc.value = ''
  erroNfc.value = ''
  erroFinalizacao.value = ''
  erroRecuperacao.value = ''
  codigoVinculacao.value = ''
  erroVinculacao.value = ''
  email.value = ''
  senha.value = ''
  erro.value = ''
}

async function vincularConferencia() {
  if (vinculando.value || !codigoVinculacao.value.trim()) {
    return
  }

  vinculando.value = true
  erroVinculacao.value = ''

  try {
    conferenciaVinculada.value = await conferenciaService.vincular(codigoVinculacao.value)

    conferenciaFinalizada.value = false
    resumoFinalizacao.value = null
    totalEncontrados.value = 0
    totalDivergentes.value = 0
    ultimoUid.value = ''
    ultimoResultado.value = ''
    codigoVinculacao.value = ''

    // Remove a conferência vinculada da lista de retomada
    conferenciasParaRetomar.value = conferenciasParaRetomar.value.filter(conferencia => conferencia.id !== conferenciaVinculada.value?.conferenciaId)

  } catch (erro) {
    erroVinculacao.value = erro instanceof Error ? erro.message : 'Erro ao vincular conferência.'

  } finally {
    vinculando.value = false
  }
}

async function processarTag(bytes: number[]) {
  if (
    !conferenciaVinculada.value ||
    processandoLeitura.value ||
    !leituraAtiva.value
  ) return

  processandoLeitura.value = true
  erroNfc.value = ''
  mensagemNfc.value = ''

  const uid = formatarUid(bytes)
  ultimoUid.value = uid

  try {
    const resultado = await conferenciaService.registrarLeitura(
      conferenciaVinculada.value.conferenciaId,
      uid
    )

    ultimoResultado.value = resultado.resultado
    totalEncontrados.value = resultado.totalEncontrados
    totalDivergentes.value = resultado.totalDivergentes

    mensagemNfc.value =
      `Patrimônio registrado: ${resultado.resultado}`
  } catch (erro) {
    ultimoResultado.value = ''

    erroNfc.value =
      erro instanceof Error
        ? erro.message
        : 'Erro ao processar a etiqueta NFC.'
  } finally {
    processandoLeitura.value = false
  }
}

async function iniciarLeituraNfc() {
  if (!conferenciaVinculada.value || leituraAtiva.value || conferenciaFinalizada.value) return

  erroNfc.value = ''
  mensagemNfc.value = ''

  try {
    const { supported } = await CapacitorNfc.isSupported()

    if (!supported) {
      throw new Error('Este dispositivo não possui NFC.')
    }

    const { status } = await CapacitorNfc.getStatus()

    if (status === 'NFC_DISABLED') {
      throw new Error('Ative o NFC nas configurações do celular.')
    }

    const listener = await CapacitorNfc.addListener(
      'nfcEvent',
      async (evento) => {
        const bytes = evento.tag?.id

        if (bytes?.length) {
          await processarTag(bytes)
        }
      }
    )

    removerListener = () => listener.remove()

    leituraAtiva.value = true
    await CapacitorNfc.startScanning()

    mensagemNfc.value =
      'Leitor ativo. Aproxime uma etiqueta NFC.'
  } catch (erro) {
    await pararLeituraNfc()

    erroNfc.value =
      erro instanceof Error
        ? erro.message
        : 'Não foi possível iniciar o leitor NFC.'
  }
}

async function pararLeituraNfc() {
  leituraAtiva.value = false

  try {
    await CapacitorNfc.stopScanning()
  } catch (erro) {
    console.warn('Falha ao parar NFC:', erro)
  }

  if (removerListener) {
    await removerListener()
    removerListener = null
  }
}

async function finalizarConferencia() {
  if (!conferenciaVinculada.value || finalizando.value || processandoLeitura.value || conferenciaFinalizada.value) return

  const confirmou = window.confirm(
    'Deseja finalizar esta conferência? ' +
    'Todos os patrimônios ainda pendentes serão marcados como ausentes.'
  )

  if (!confirmou) return

  finalizando.value = true
  erroFinalizacao.value = ''

  // Impede novas leituras durante o encerramento.
  await pararLeituraNfc()

  try {
    const resultado = await conferenciaService.finalizar(
      conferenciaVinculada.value.conferenciaId
    )

    resumoFinalizacao.value = {
      totalEsperados: resultado.totalEsperados,
      totalEncontrados: resultado.totalEncontrados,
      totalAusentes: resultado.totalAusentes,
      totalDivergentes: resultado.totalDivergentes,
    }

    conferenciaFinalizada.value = true

    conferenciaVinculada.value = {
      ...conferenciaVinculada.value,
      status: resultado.status,
    }

    // Remove a conferência finalizada da lista de retomada
    conferenciasParaRetomar.value = conferenciasParaRetomar.value.filter( conferencia => conferencia.id !== conferenciaVinculada.value?.conferenciaId)

  } catch (erro) {
    erroFinalizacao.value =
      erro instanceof Error
        ? erro.message
        : 'Erro ao finalizar conferência.'
  } finally {
    finalizando.value = false
  }
}

async function carregarConferenciasEmAndamento() {
  if (!usuario.value) return

  verificandoConferencias.value = true
  erroRecuperacao.value = ''

  try {
    conferenciasParaRetomar.value =
      await conferenciaService.listarEmAndamento(usuario.value.id)
  } catch (erro) {
    erroRecuperacao.value =
      erro instanceof Error
        ? erro.message
        : 'Erro ao recuperar conferências.'
  } finally {
    verificandoConferencias.value = false
  }
}

async function retomarConferencia(conferencia: ConferenciaConsulta) {
  erroRecuperacao.value = ''

  try {
    // Consulta os dados atuais no PostgreSQL
    const detalhes = await conferenciaService.buscarPorId(
      conferencia.id
    )

    if (detalhes.status !== 'EM_ANDAMENTO') {
      conferenciasParaRetomar.value =
        conferenciasParaRetomar.value.filter(
          item => item.id !== conferencia.id
        )

      throw new Error(
        'Esta conferência não está mais em andamento.'
      )
    }

    conferenciaVinculada.value = {
      conferenciaId: detalhes.id,
      salaId: detalhes.salaId,
      status: detalhes.status,
    }

    conferenciaFinalizada.value = false
    resumoFinalizacao.value = null

    // Recupera os totais reais do banco
    totalEncontrados.value = detalhes.totalEncontrados
    totalDivergentes.value = detalhes.totalDivergentes

    ultimoUid.value = ''
    ultimoResultado.value = ''
    erroNfc.value = ''
    mensagemNfc.value = ''

  } catch (erro) {
    erroRecuperacao.value =
      erro instanceof Error
        ? erro.message
        : 'Não foi possível retomar a conferência.'
  }
}

onUnmounted(() => {
  void pararLeituraNfc()
})

onMounted(async () => {
  try {
    usuario.value = await autenticacaoService.obterUsuario()

    if (usuario.value) {
      await carregarConferenciasEmAndamento()
    }
  } catch {
    await autenticacaoService.sair()
    usuario.value = null
  }
})
</script>

<style scoped>
.pagina-login {
  min-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: #f1f5f9;
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: 32px 24px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
}

.marca {
  text-align: center;
  margin-bottom: 32px;
}

.marca h1 {
  color: #1d4ed8;
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 8px;
}

.marca p,
.subtitulo {
  color: #64748b;
}

h2 {
  font-size: 20px;
  margin-bottom: 24px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

label {
  font-size: 14px;
  font-weight: 600;
}

input {
  padding: 14px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  color: #0f172a;
  font-size: 16px;
  width: 100%;
}

ion-button {
  margin-top: 16px;
  --border-radius: 8px;
}

.erro {
  color: #dc2626;
  font-size: 14px;
}

.area-logada {
  text-align: center;
  color: #111827;
}

.conferencia-ativa {
  padding: 16px;
  margin: 20px 0;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  text-align: left;
  color: #111827;
}

.conferencia-ativa h3 {
  color: #15803d;
}

.conferencia-ativa p {
  overflow-wrap: anywhere;
}

.leitor-nfc {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #bbf7d0;
}

.indicador-leitura {
  margin-top: 16px;
  color: #1d4ed8;
  font-weight: 600;
}

.resultado-nfc {
  margin-top: 16px;
  padding: 12px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  overflow-wrap: anywhere;
}

.totais-nfc {
  display: flex;
  justify-content: space-around;
  gap: 12px;
  margin-top: 20px;
  color: #334155;
}

.mensagem {
  padding: 16px;
  margin-top: 24px;
  background: #f0fdf4;
  color: #15803d;
  border-radius: 8px;
}

.finalizacao {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #cbd5e1;
}

.resumo-finalizacao {
  margin-top: 24px;
  padding: 20px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
  color: #111827;
}

.resumo-finalizacao h3 {
  color: #166534;
}

.conferencias-pendentes {
  margin: 20px 0;
  text-align: left;
}

.conferencia-retomada {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
}

.conferencia-retomada span {
  color: #64748b;
  font-size: 14px;
}

</style>
