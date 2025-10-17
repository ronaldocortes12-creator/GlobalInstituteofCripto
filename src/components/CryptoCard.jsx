import { TrendingUp, TrendingDown } from 'lucide-react'

export function CryptoCard({ crypto, data }) {
  const isPositive = data.dropProbability < 50
  const trendColor = isPositive ? 'text-primary' : 'text-destructive'
  const bgColor = isPositive ? 'bg-primary/5' : 'bg-destructive/5'
  const borderColor = isPositive ? 'border-primary/20' : 'border-destructive/20'

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    } else if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else {
      return `$${price.toFixed(6)}`
    }
  }

  return (
    <div className={`glass glass-hover rounded-xl p-6 border ${borderColor} ${bgColor} transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center text-2xl font-bold border border-border">
            {crypto.logo}
          </div>
          <div>
            <h3 className="font-bold text-lg">{crypto.name}</h3>
            <p className="text-sm text-muted-foreground">{crypto.symbol}</p>
          </div>
        </div>
        <div className={`p-2 rounded-lg ${bgColor}`}>
          {isPositive ? (
            <TrendingUp className={`h-6 w-6 ${trendColor}`} />
          ) : (
            <TrendingDown className={`h-6 w-6 ${trendColor}`} />
          )}
        </div>
      </div>

      {/* Current Price */}
      <div className="mb-4">
        <p className="text-3xl font-bold">{formatPrice(data.currentPrice)}</p>
      </div>

      {/* Drop Probability */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Probabilidade de Queda</span>
          <span className={`text-lg font-bold ${trendColor}`}>
            {data.dropProbability}%
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${isPositive ? 'bg-primary' : 'bg-destructive'} transition-all`}
            style={{ width: `${data.dropProbability}%` }}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Range de Preço</p>
        <div className="flex items-center justify-between text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Mínimo</p>
            <p className="font-medium">{formatPrice(data.priceRange.min)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Máximo</p>
            <p className="font-medium">{formatPrice(data.priceRange.max)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Intervalo de Confiança: {data.priceRange.confidence}%
        </p>
      </div>
    </div>
  )
}

