import { useEffect, useState } from 'react'
import TabBar from '../components/TabBar'
import { CryptoCard } from '../components/CryptoCard'
import { TrendingUp, Loader2, BarChart3, Activity } from 'lucide-react'
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
    <div className="min-h-screen pb-24 bg-gradient-to-b from-background via-background to-card/20">
      {/* Header Premium */}
      <div className="bg-gradient-to-br from-card via-card/95 to-card/80 border-b border-primary/20 shadow-lg shadow-primary/5">
        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <div className="flex items-center gap-4 mb-4 animate-in slide-in-from-top duration-500">
            <div className="p-3 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl border border-primary/30 shadow-lg shadow-primary/10">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Mercado Cripto
              </h1>
              <p className="text-muted-foreground mt-1 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Análise estatística das 20 principais criptomoedas
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-xl rounded-xl p-4 border border-primary/10 animate-in slide-in-from-bottom duration-700">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-primary" />
              <span>Dados históricos baseados em 3 anos de análise de mercado</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State Premium */}
      {isLoading && (
        <div className="max-w-screen-xl mx-auto px-6 py-20 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"></div>
            <Loader2 className="relative h-16 w-16 text-primary animate-spin mb-6" />
          </div>
          <p className="text-muted-foreground text-lg font-medium">Carregando dados do mercado...</p>
          <p className="text-muted-foreground/60 text-sm mt-2">Analisando as principais criptomoedas</p>
        </div>
      )}

      {/* Crypto Grid Premium */}
      {!isLoading && (
        <div className="max-w-screen-xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOP_CRYPTOS.map((crypto, idx) => (
              <div
                key={crypto.id}
                className="animate-in slide-in-from-bottom duration-500"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CryptoCard
                  crypto={crypto}
                  data={cryptoData[crypto.id]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <TabBar />
    </div>
  )
}

export default Market

