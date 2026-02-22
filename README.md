# ⬡ XAU/USD Gold Intelligence Terminal

Real-time XAUUSD trading terminal using ICT methodology — AMD Strategy, Order Blocks, Fair Value Gaps, and Support & Resistance — powered by Twelve Data and GPT-4o mini.

---

## 🟡 GoldAPI.io — Live Spot Price

Real-time gold spot bid/ask/spread from [goldapi.io](https://www.goldapi.io).

### Get your free API key
1. Go to [goldapi.io](https://www.goldapi.io) → Sign up free (no card required)
2. Copy your API key from the dashboard
3. Add as `GOLDAPI_KEY` in Vercel environment variables

> **Free tier:** 100 requests/month · daily historical · 2-second update interval

### What GoldAPI.io adds

| Feature | Description |
|---|---|
| **Live Bid / Ask** | Real spot bid and ask prices — more precise than Twelve Data for entries |
| **Spread monitor** | Spread in $ and % — TIGHT/NORMAL/WIDE indicator for liquidity quality |
| **Weekly range bar** | Visual 7-day high/low with price position % — tells you if you're buying premium or discount |
| **Weekly trend** | UPTREND / DOWNTREND / SIDEWAYS based on 5-day price action |
| **Gram prices** | 24K / 22K / 21K / 18K per gram in USD — useful retail context |
| **Signal influence** | Wide spread → −10% confidence; buying near weekly low → +5%; selling near weekly high → +5% |
| **GPT context** | Bid/ask and weekly position fed into the AI narrative for more precise analysis |

### Entry precision with bid/ask
- **BUY signal** → enter at the **ask** price (what you pay)
- **SELL signal** → enter at the **bid** price (what you receive)
- Wide spread (> 0.05%) warns of low liquidity — common during Asian session or before major news

---



News data is powered by the **JBlanked News API** (jblanked.com) which aggregates Forex Factory economic calendar data.

### Get your free API key
1. Go to [jblanked.com](https://www.jblanked.com) → Sign up free
2. Go to **Profile → API Key** → generate your key
3. Add as `JBLANKED_API_KEY` in Vercel environment variables

> **Note:** The free plan allows 1 request/day. The terminal fetches news once per analysis. If you don't add a key, news fetching gracefully degrades — the terminal still works with technical analysis only.

### What the news integration does

| Feature | Description |
|---|---|
| **News Risk Badge** | RED/ORANGE/YELLOW/GREEN — tells you if it's safe to trade RIGHT NOW |
| **DO NOT TRADE alert** | Blocks new signals when high-impact news is within 30 minutes |
| **Fundamental Bias** | Analyzes released USD data (Strong/Weak) → USD↑ = Gold↓ and vice versa |
| **Confidence adjustment** | +10% if fundamentals align with technicals, −15% if they conflict |
| **Today's high-impact events** | All USD High-impact releases with Actual/Forecast/Previous |
| **This week upcoming** | All remaining high-impact USD events for the week |

### News events that move Gold most
NFP, CPI, FOMC/Fed Rate Decision, PCE, GDP, PPI, Unemployment Rate, Retail Sales, ISM, ADP, Powell/Yellen speeches

---



### AMD (Accumulation / Manipulation / Distribution)
- **Accumulation (Asia session)**: Smart money builds positions within a tight range
- **Manipulation (London session)**: Price sweeps liquidity above/below Asia range — stop hunts
- **Distribution (NY session)**: True direction revealed — ride the impulse

The system detects which AMD phase is active and identifies whether a stop hunt (manipulation) occurred above or below the Asia range to anticipate the distribution direction.

### Order Blocks
Last bearish candle before a bullish 3-candle impulse (Bullish OB = support) or last bullish candle before a bearish impulse (Bearish OB = resistance). Entry is placed at the OB body zone. Rated STRONG / MODERATE / WEAK by impulse size.

### Fair Value Gaps (Imbalances)
3-candle pattern where price moves so fast it leaves a gap between candle 1 and candle 3. FVGs act as magnets — price typically returns to fill them. Entry at the FVG midpoint or edge when confluent with OB.

### Confluence System
Each of the following adds to the bull/bear score:
- AMD bias (25 pts) + stop hunt detection (20 pts)
- Order Block strength: STRONG +20, MODERATE +12, WEAK +6
- FVG near price +15
- Support/Resistance level +10–15
- RSI oversold/overbought +10
- MACD crossover +8
- Bollinger Band touch +8

Trade signals only fire when score difference ≥ 15 and total ≥ 25.

---

## Deploy to Vercel

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Gold terminal"
git remote add origin https://github.com/YOUR/gold-signal.git
git push -u origin main
```

### 2. Import to Vercel
1. vercel.com → New Project → Import your repo
2. Add Environment Variables:
   - `TWELVE_DATA_API_KEY` = your Twelve Data key
   - `OPENAI_API_KEY` = your OpenAI key
   - `JBLANKED_API_KEY` = your JBlanked key (free at jblanked.com)
   - `GOLDAPI_KEY` = your GoldAPI.io key (free at goldapi.io)
3. Deploy ✓

---

## Local Dev
```bash
npm install
cp .env.example .env.local
# add your keys to .env.local
npm run dev
# open http://localhost:3000
```

---

## Timeframes
| TF  | Best for |
|-----|----------|
| M15 | Intraday scalping, precise OB entries |
| H1  | Day trading, AMD session analysis |
| H4  | Swing trades, key OB/FVG levels |
| D1  | Macro bias, major S&R levels |

## Disclaimer
Educational only. Not financial advice. Gold trading carries significant risk.
