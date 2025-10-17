import { TrendingUp, TrendingDown, Activity } from 'lucide-react'

export function CryptoCard({ crypto, data }) {
  const isPositive = data.dropProbability < 50
  const trendColor = isPositive ? 'text-primary' : 'text-destructive'
  const bgGradient = isPositive 
    ? 'from-primary/10 to-primary/5' 
    : 'from-destructive/10 to-destructive/5'
  const borderColor = isPositive ? 'border-primary/20' : 'border-destructive/20'
  const glowColor = isPositive ? 'shadow-primary/10' : 'shadow-destructive/10'

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
    <div className={`group bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 border ${borderColor} hover:border-primary/40 shadow-lg hover:shadow-2xl ${glowColor} transition-all duration-300 hover:-translate-y-1`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center text-2xl font-bold border ${borderColor} shadow-md ${glowColor}`}>
              {crypto.logo}
            </div>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${isPositive ? 'bg-primary' : 'bg-destructive'} border-2 border-card`}></div>
          </div>
          <div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{crypto.name}</h3>
            <p className="text-sm text-muted-foreground font-medium">{crypto.symbol}</p>
          </div>
        </div>
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${bgGradient} border ${borderColor}`}>
          {isPositive ? (
            <TrendingUp className={`h-6 w-6 ${trendColor}`} />
          ) : (
            <TrendingDown className={`h-6 w-6 ${trendColor}`} />
          )}
        </div>
      </div>

      {/* Current Price */}
      <div className="mb-5">
        <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
          <Activity className="h-3 w-3" />
          Preço Atual
        </p>
        <p className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
          {formatPrice(data.currentPrice)}
        </p>
      </div>

      {/* Drop Probability */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Prob. de Queda
          </span>
          <span className={`text-xl font-bold ${trendColor}`}>
            {data.dropProbability}%
          </span>
        </div>
        <div className="relative w-full h-3 bg-muted/30 rounded-full overflow-hidden border border-border/50">
          <div
            className={`h-full ${isPositive ? 'bg-gradient-to-r from-primary to-primary/80' : 'bg-gradient-to-r from-destructive to-destructive/80'} transition-all duration-500 shadow-lg ${isPositive ? 'shadow-primary/30' : 'shadow-destructive/30'}`}
            style={{ width: `${data.dropProbability}%` }}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className={`bg-gradient-to-br ${bgGradient} rounded-xl p-4 border ${borderColor}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-4 bg-gradient-to-b from-primary to-secondary rounded-full"></div>
          <p className="text-sm font-bold text-foreground">Range de Preço</p>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
            <p className="font-bold text-sm">{formatPrice(data.priceRange.min)}</p>
          </div>
          <div className="flex-1 mx-4">
            <div className="h-1 bg-gradient-to-r from-destructive via-muted to-primary rounded-full"></div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Máximo</p>
            <p className="font-bold text-sm">{formatPrice(data.priceRange.max)}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div>
          <p className="text-xs text-muted-foreground">
            Confiança: <span className="font-semibold text-foreground">{data.priceRange.confidence}%</span>
          </p>
        </div>
      </div>
    </div>
  )
}

