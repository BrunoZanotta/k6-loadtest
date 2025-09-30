# k6 Load Test — 500 VUs / 5m

Projeto para rodar **testes de carga com k6** em uma **API**, simulando **500 usuários simultâneos por 5 minutos**, com geração de **relatórios HTML/JSON** 

---

## Descrição breve
- **Objetivo:** avaliar experiência em performance com um cenário básico e repetível de carga (500 VUs / 5m) usando **k6**.
- **Alvo padrão (mock):** `https://test-api.k6.io/public/crocodiles`.  
- **Relatórios gerados:** `reports/summary.html`, `reports/summary.json`.

---

## Arquitetura / Estrutura de pastas

    ├── Makefile                
    ├── README.md                
    ├── reports/                 
    │   └── (gerados) summary.html, summary.json
    └── src/
    │   └── load_test.js    
    └── .gitignore

---

## 🔢 Versões utilizadas
- **k6:** v1.3.0  

---

## 📦 Dependências (como instalar)

### macOS (Homebrew)
```bash
brew install k6
k6 version 
```

### Windows (winget)
```bash
winget install -e --id k6.k6
k6 version 
```

Alternativa — Instalador oficial
•	Baixe e instale o executável do k6 (Windows) a partir da página oficial. Depois, confirme com k6 version.

> Referências: instruções oficiais de instalação do k6 para Windows/macOS  [Grafana Labs](https://grafana.com/docs/k6/latest/set-up/install-k6/) e ID do pacote no winget (`k6.k6`)  [winget.run](https://winget.run/pkg/k6/k6?utm_source=chatgpt.com).


## ▶️ Como executar os testes e gerar o relatório

> O script já inclui `handleSummary`, que **gera automaticamente** os relatórios ao final da execução.

### 1) Preparar a pasta de relatórios (uma vez)
**macOS / Linux**
```bash
mkdir -p reports
```

**Windows (PowerShell)**
```bash
New-Item -Type Directory -Force reports | Out-Null
```

## ▶️ Como rodar

### macOS / Linux / Windows 
```bash
make run
`````
