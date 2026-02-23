# ⬡ PipNexus - AI-Powered XAU/USD Gold Trading Terminal

<div align="center">

![PipNexus](https://img.shields.io/badge/PipNexus-XAU%2FUSD-FFD700?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square)
![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204-orange?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

</div>

## Overview

PipNexus is an intelligent XAU/USD gold trading terminal powered by **Anthropic Claude AI** and built on the **ICT (Inner Circle Trader)** methodology. It provides real-time market analysis, trade signals, and comprehensive fundamental analysis for gold traders.

## What's New

- **Claude AI Integration**: Replaced OpenAI with Anthropic Claude for deeper market analysis
- **Enhanced Technical Analysis**: Multi-timeframe analysis, advanced pattern recognition
- **Improved Fundamental Analysis**: Real news API integration, sentiment analysis
- **New Pages**: About, History, Reviews, Waitlist, How to Use, Blog
- **Modernized UI**: Updated design with smooth animations

## Features

### Core Analysis
- **AMD Phase Detection**: Accumulation, Distribution, Manipulation, Decline phases
- **Order Blocks**: Identification of institutional order flow zones
- **Fair Value Gaps (FVGs)**: Detection of market imbalances
- **Support & Resistance**: Smart Money Concepts-based levels

### Enhanced AI Analysis (New)
- **Anthropic Claude Integration**: Deep market narrative generation with extended reasoning
- **Multi-Timeframe Analysis**: Confluence scoring across M15, H1, H4, D1
- **Pattern Recognition**: CHoCH (Change of Character), BOS (Break of Structure), liquidity sweeps
- **Liquidity Zone Detection**: Buy/Sell stops identification and stop hunt detection

### Technical Indicators
- RSI (14)
- MACD
- Bollinger Bands
- ATR

### Fundamental Analysis (Enhanced)
- Real-time economic calendar (Trading Economics)
- News risk assessment with timing
- USD bias computation
- Event impact scoring
- Macro correlation tracking (DXY, yields, S&P 500, Silver)

## Technology Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **AI**: Anthropic Claude Sonnet 4
- **Market Data**: Twelve Data API
- **Spot Prices**: GoldAPI.io
- **Economic Data**: Trading Economics / JBlanked
- **Charting**: Lightweight Charts

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/pipnexus.git
cd pipnexus
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Edit `.env.local` with your API keys:
```env
TWELVE_DATA_API_KEY=your_twelve_data_key
ANTHROPIC_API_KEY=your_anthropic_key
GOLDAPI_KEY=your_goldapi_key
JBLANKED_API_KEY=your_jblanked_key  # Optional
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## API Keys Setup

| Service | Required | Description | Sign Up |
|---------|----------|-------------|---------|
| Twelve Data | Yes | Market data & indicators | [twelvedata.com](https://twelvedata.com) |
| Anthropic | Yes | AI analysis | [anthropic.com](https://anthropic.com) |
| GoldAPI.io | No | Spot prices | [goldapi.io](https://goldapi.io) |
| Trading Economics | No | Economic calendar | [tradingeconomics.com](https://tradingeconomics.com) |

## Project Structure

```
├── lib/
│   ├── anthropic.ts      # Claude AI integration
│   ├── analysis.ts       # ICT technical analysis (enhanced)
│   ├── news.ts           # Fundamental analysis (enhanced)
│   ├── goldapi.ts        # Spot price data
│   └── twelvedata.ts     # Market data API
├── pages/
│   ├── api/
│   │   └── analyze.ts    # Main analysis endpoint
│   ├── about.tsx        # About page
│   ├── history.tsx       # Signal history & performance
│   ├── reviews.tsx       # User testimonials
│   ├── waitlist.tsx      # Early access signup
│   ├── how-to-use.tsx    # Platform guide
│   └── blog/
│       └── index.tsx     # Trading insights
├── index.tsx             # Main terminal UI
├── package.json
└── README.md
```

## Pages

| Page | Description |
|------|-------------|
| `/` | Main trading terminal with signals |
| `/about` | About PipNexus, team, technology |
| `/history` | Historical signals & win rate stats |
| `/reviews` | User testimonials & ratings |
| `/waitlist` | Early access email signup |
| `/how-to-use` | Platform guide & API setup |
| `/blog` | Trading education & insights |

## ICT Methodology

### AMD Phases
- **Accumulation**: Smart money builds positions within a tight range
- **Manipulation**: Price sweeps liquidity — stop hunts occur
- **Distribution**: True direction revealed — ride the impulse
- **Decline**: Sustained downtrend in progress

### Order Blocks
Last bearish candle before a bullish impulse (Bullish OB) or last bullish candle before a bearish impulse (Bearish OB). Rated STRONG / MODERATE / WEAK.

### Fair Value Gaps (FVGs)
3-candle pattern where price leaves a gap. FVGs act as magnets — price typically returns to fill them.

### Confluence System
- AMD bias + stop hunt detection
- Order Block strength
- FVG near price
- Support/Resistance levels
- RSI oversold/overbought
- MACD histogram direction
- Bollinger Band touches

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure environment variables:
   - `TWELVE_DATA_API_KEY`
   - `ANTHROPIC_API_KEY`
   - `GOLDAPI_KEY`
   - `JBLANKED_API_KEY` (optional)
4. Ensure `vercel.json` is committed (sets `pages/api/analyze.ts` max duration to 30s)
5. Deploy

### Timeframes

| TF  | Best for |
|-----|----------|
| M15 | Intraday scalping, precise OB entries |
| H1  | Day trading, AMD session analysis |
| H4  | Swing trades, key OB/FVG levels |
| D1  | Macro bias, major S&R levels |

## Risk Warning

**Trading involves substantial risk.** Past performance does not guarantee future results. This platform is for educational purposes only and should not be considered financial advice. Always practice proper risk management and trade with capital you can afford to lose.

## License

MIT License.

## Credits

- **Founder & CTO**: Rolland Muhanguzi
- **CEO**: Shema Troy Tukahirwa

Built with ICT Methodology and Anthropic Claude AI.

---

<div align="center">

*© 2026 PipNexus. All rights reserved.*

</div>