# 🤖 Projeto Final: Chat Inteligente Local com Ollama :)

Um chatbot completo rodando **100% offline** no seu PC com suporte a PDF, Áudio e Vídeo.

## 🎯 Objetivo

Criar uma interface web funcional que permite:
1. ✅ Chat com IA (Phi-3) localmente
2. 📄 Fazer perguntas sobre PDFs
3. 🎧 Transcrever e perguntar sobre áudio
4. 🎬 Transcrever e perguntar sobre vídeos

**Sem APIs pagas. Sem conta. Sem internet (após setup). 100% gratuito.**

---

## 📋 Fases do Projeto

### ✅ FASE 1: Chat Básico com Ollama + Phi-3
**Status:** Completo

- [x] Ollama instalado e configurado
- [x] Modelo phi3 baixado
- [x] Interface HTML responsiva
- [x] CSS dark mode moderno
- [x] JavaScript com fetch para API local
- [x] Histórico de conversa visível

### ✅ FASE 2: Suporte a PDF
**Status:** Completo

- [x] Upload de arquivo PDF
- [x] Extração de texto com PDF.js
- [x] Texto carregado como contexto
- [x] UI indica arquivo carregado
- [x] Perguntas sobre conteúdo do PDF

### ✅ FASE 3: Suporte a Áudio
**Status:** Completo

- [x] Upload de áudio (MP3/WAV/M4A/MP4)
- [x] Transcrição com Whisper (via Ollama)
- [x] Texto transcrito como contexto
- [x] UI indica arquivo processado
- [x] Perguntas sobre conteúdo do áudio

### ✅ FASE 4: Suporte a Vídeo
**Status:** Completo

- [x] Upload de vídeo (MP4/WebM/AVI)
- [x] Extração de áudio com FFmpeg.js
- [x] Transcrição com Whisper
- [x] Texto como contexto
- [x] Perguntas sobre conteúdo do vídeo

---

## 🚀 Setup Rápido (5 minutos)

### 1. Instalar Ollama

**Windows:**
```powershell
winget install --id Ollama.Ollama -e
```

**macOS:**
```bash
brew install ollama
```

**Linux:**
```bash
curl https://ollama.ai/install.sh | sh
```

### 2. Baixar Modelos

```bash
ollama pull phi3
# Whisper pode não estar disponível no seu Ollama atual.
# A transcrição será feita localmente via servidor Python.
```

### 3. Preparar servidor de transcrição local

```bash
cd c:\Users\arthu\Downloads\Projeto Final
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

### 4. Iniciar o servidor Python de transcrição

```bash
python -m uvicorn transcribe_server:app --host 127.0.0.1 --port 8001
```

> Se receber erro ao iniciar o backend de transcrição local, instale `ffmpeg` no PATH e use um ambiente virtual.

### 5. Iniciar Ollama Server

```bash
ollama serve
```
# a interface web precisa ser servido por um servidor local separado, por isso http://localhost:8000 só funciona após iniciar python -m http.server 8000 ou Live Server.

# O servidor Ollama estará em `127.0.0.1:11434` e o backend de transcrição em `127.0.0.1:8001`

### 6. Abrir no Navegador

```
http://localhost:8000/ollama-chat.html
```

(ou use Live Server no VS Code)

---

## 💻 Uso

### Chat Simples
1. Digite uma pergunta
2. Clique "Enviar"
3. Aguarde resposta do Phi-3

### Com PDF
1. Clique **📄 PDF**
2. Escolha um arquivo `.pdf`
3. Aguarde extração
4. Pergunte sobre o conteúdo

### Com Áudio
1. Clique **🎧 Áudio**
2. Escolha um arquivo `.mp3` ou `.mp4`
3. Aguarde transcrição
4. Pergunte sobre o que foi dito

### Com Vídeo
1. Clique **🎬 Vídeo**
2. Escolha um arquivo `.mp4`
3. Aguarde processamento (pode levar)
4. Pergunte sobre o conteúdo do vídeo

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────┐
│     Browser (ollama-chat.html)      │
│  - PDF.js (extração)                │
│  - FFmpeg.js (áudio de vídeo)       │
│  - Fetch API (comunicação)          │
└────────────┬────────────────────────┘
             │
             ↓
┌─────────────────────────────────────┐
│   Ollama Server (127.0.0.1:11434)   │
│  ┌───────────────────────────────┐  │
│  │ Phi-3 (LLM do chat)           │  │
│  │ Whisper (transcrição de áudio)│  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 📂 Estrutura de Arquivos

```
Projeto Final/
├── README.md                   # Este arquivo
├── ollama-chat.html           # Interface web
├── ollama-chat.css            # Estilos (dark mode)
├── ollama-chat.js             # Lógica principal
└── Projeto final.pdf         # (referência)
```

---

## 🛠️ Tecnologias

| Ferramenta | Propósito | Tipo |
|-----------|----------|------|
| **Ollama** | Servidor LLM local | Backend |
| **Phi-3** | Modelo de linguagem | LLM |
| **Whisper** | Transcrição de áudio | Modelo |
| **PDF.js** | Extração de PDF | Biblioteca JS |
| **FFmpeg.js** | Processamento de vídeo | Biblioteca JS |
| **Fetch API** | Requisições HTTP | API Browser |

---

## ⚡ Requisitos

### Hardware Mínimo
- CPU: Intel i5 / AMD Ryzen 5 (2020+)
- RAM: 8GB (recomendado 16GB)
- Armazenamento: 5GB livre para modelos

### Software
- Ollama 0.1.0+
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Node.js (opcional, apenas para servidor local)

---

## 📝 Exemplos de Uso

### Exemplo 1: Analisar Contrato PDF
```
1. Upload: contrato.pdf
2. Pergunta: "Quais são os termos principais?"
3. IA resume os pontos-chave
```

### Exemplo 2: Transcrever Áudio
```
1. Upload: meeting.mp3
2. IA transcreve automaticamente
3. Pergunta: "Quais decisões foram tomadas?"
4. IA responde baseado na transcrição
```

### Exemplo 3: Analisar Vídeo
```
1. Upload: apresentacao.mp4
2. Áudio é extraído e transcrito
3. Pergunta: "Qual é o tema principal?"
4. IA responde baseado no áudio
```

---

## 🐛 Troubleshooting

Problemas rápidos:
- ❌ "Cannot GET /": Abra via Live Server, não `file://`
- ❌ "Ollama Connection Refused": Execute `ollama serve`
- ❌ "Whisper not found": Execute `ollama pull whisper`
- ❌ "FFmpeg loading": Verifique sua conexão de internet

---

## 🎨 Interface

A interface possui:
- 🌙 **Dark Mode** moderno e agradável
- ✨ **Responsiva** (mobile, tablet, desktop)
- ⚡ **Sem dependências externas** (apenas CDN de bibliotecas)
- 🎯 **Feedback visual** de progresso e status

---

## 📊 Performance

| Operação | Tempo | Notas |
|----------|-------|-------|
| Primeira pergunta | 10-30s | Modelo carregando |
| Perguntas seguintes | 2-5s | Modelo em memória |
| Extração de PDF | <1s | Rápido |
| Transcrição de áudio | 30-120s | Depende do tamanho |
| Extração de vídeo | 10-30s | Depende da duração |

---

## 💡 Dicas

1. **Use PDFs menores** para extração mais rápida
2. **Áudio mono é mais rápido** que estéreo
3. **GPU acelera Phi-3** (se tiver NVIDIA/AMD)
4. **Deixe Ollama rodando** entre usos
5. **Perguntas claras** = respostas melhores

---

## 🔒 Segurança & Privacidade

✅ **Completamente offline** após setup  
✅ **Sem dados na nuvem**  
✅ **Sem rastreamento**  
✅ **Código aberto (inspecione!)**  

---

## 📜 Licença

Livre para usar, modificar e distribuir.  
Este projeto usa tecnologias open-source:
- [Ollama](https://ollama.ai/) - MIT
- [PDF.js](https://mozilla.github.io/pdf.js/) - Apache 2.0
- [FFmpeg](https://ffmpeg.org/) - LGPL 2.1+

---

## 🤝 Contribuições

Melhorias e correções são bem-vindas!

Ideias:
- [ ] Suportar mais formatos de vídeo
- [ ] Adicionar seleção de modelos LLM
- [ ] localStorage para histórico persistente
- [ ] Dark/Light mode toggle
- [ ] Histórico salvo como JSON

---

## 📧 Contato

Dúvidas? Abra uma issue ou entre em contato!

---

**Versão:** 2.0  
**Última Atualização:** 2 de julho de 2026  
**Status:** ✅ Pronto para Produção