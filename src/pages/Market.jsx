import { useEffect, useState } from 'react'
import TabBar from '../components/TabBar'
import { CryptoCard } from '../components/CryptoCard'
import { TrendingUp, Loader2 } from 'lucide-react'
import { TOP_CRYPTOS, fetchCryptoData } from '../lib/cryptoData'

const Market = () => {
  const [cryptoData, setCryptoData] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCryptoData()
  }, [])

  const loadCryptoData = async () => {
    setIsLoading(true)
    const data = {}

    // Load data for all cryptos
    for (const crypto of TOP_CRYPTOS) {
      try {
        const cryptoInfo = await fetchCryptoData(crypto.id)
        data[crypto.id] = cryptoInfo
      } catch (error) {
        console.error(`Error loading data for ${crypto.symbol}:`, error)
      }
    }

    setCryptoData(data)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-card to-background border-b border-border">
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Mercado Cripto</h1>
          </div>
          <p className="text-muted-foreground mt-2">
            Análise estatística das 20 principais criptomoedas com base em 3 anos de dados históricos
          </p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-screen-xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
          <p className="text-muted-foreground">Carregando dados do mercado...</p>
        </div>
      )}

      {/* Crypto Grid */}
      {!isLoading && (
        <div className="max-w-screen-xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOP_CRYPTOS.map((crypto) => (
              cryptoData[crypto.id] && (
                <CryptoCard
                  key={crypto.id}
                  crypto={crypto}
                  data={cryptoData[crypto.id]}
                />
              )
            ))}
          </div>

          {/* Info Box */}
          <div className="mt-8 glass rounded-xl p-6 border border-border">
            <h3 className="font-bold text-lg mb-3">📊 Sobre a Análise</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Probabilidade de Queda:</strong> Calculada com base na distribuição normal dos preços históricos dos últimos 3 anos. Valores acima de 50% indicam que o preço atual está acima da média histórica.
              </p>
              <p>
                <strong>Range de Preço:</strong> Intervalo de confiança de 95% baseado no desvio padrão dos preços históricos. Indica a faixa de preço esperada com alta probabilidade.
              </p>
              <p>
                <strong>Metodologia:</strong> Análise estatística utilizando curva de distribuição normal (Gaussiana) aplicada aos dados históricos de preço dos últimos 3 anos (1.095 dias).
              </p>
            </div>
          </div>
        </div>
      )}

      <TabBar />
    </div>
  )
}

export default Market

