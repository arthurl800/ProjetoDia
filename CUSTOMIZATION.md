# 🛠️ Customização & Desenvolvimento

Guia para estender e customizar o projeto.

---

## Mudanças Rápidas (5 minutos)

### 1. Mudar Modelo LLM

**Arquivo:** `ollama-chat.js` linha ~19

```javascript
// Antes:
const MODEL_NAME = 'microsoft/phi-3';

// Opções:
const MODEL_NAME = 'mistral:latest';      // Mais rápido
const MODEL_NAME = 'neural-chat';         // Bom para chat
const MODEL_NAME = 'llama2';              // Poderoso
```

Depois: `ollama pull nome_do_modelo`

### 2. Mudar Cor do Tema

**Arquivo:** `ollama-chat.css` linha ~1

```css
/* Antes */

accent-color: #50c878;  /* Verde */

/* Opções */
accent-color: #ff7f50;  /* Coral */
accent-color: #7fc1ff;  /* Azul */
accent-color: #9d5eff;  /* Roxo */
accent-color: #ff69b4;  /* Rosa */
```

### 3. Mudar Prompt do Sistema

**Arquivo:** `ollama-chat.js` linha ~22

```javascript
// Antes:
const SYSTEM_PROMPT = 'Você é um assistente de chat útil...';

// Customizar:
const SYSTEM_PROMPT = 'Você é um especialista em Python...';
const SYSTEM_PROMPT = 'Especialista em negócios...';
const SYSTEM_PROMPT = 'Você é um professor amigável...';
```

### 4. Mudar Porta do Ollama

**Arquivo:** `ollama-chat.js` linhas ~18-19

```javascript
// Antes:
const API_URL = 'http://127.0.0.1:11434/api/generate';

// Se Ollama em porta 5000:
const API_URL = 'http://127.0.0.1:5000/api/generate';
```

---

## Customizações Intermediárias (20-30 min)

### 1. Adicionar Dark/Light Mode Toggle

**Arquivo:** `ollama-chat.html` - adicione no header:

```html
<button id="themeToggle" class="theme-toggle">🌙</button>
```

**Arquivo:** `ollama-chat.css` - adicione:

```css
body.light-mode {
  background: #ffffff;
  color: #000000;
}

.theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}
```

**Arquivo:** `ollama-chat.js` - adicione ao final:

```javascript
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', 
    document.body.classList.contains('light-mode') ? 'light' : 'dark'
  );
});

// Carregar tema salvo
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode');
}
```

### 2. Salvar Histórico em localStorage

**Arquivo:** `ollama-chat.js` - substitua `state` init:

```javascript
const state = {
  history: JSON.parse(localStorage.getItem('chatHistory')) || [],
  loading: false,
  context: {
    type: null,
    text: '',
  },
};

// Depois, em sendMessage(), após adicionar à history:
localStorage.setItem('chatHistory', JSON.stringify(state.history));

// Adicione novo botão no HTML:
<button type="button" id="newChat">+ Nova Conversa</button>

// E em ollama-chat.js:
document.getElementById('newChat').addEventListener('click', () => {
  if (confirm('Iniciar nova conversa? O histórico será perdido.')) {
    state.history = [];
    chatHistory.innerHTML = '';
    localStorage.removeItem('chatHistory');
    resetContext();
  }
});
```

### 3. Suporte a Múltiplos Modelos

**Arquivo:** `ollama-chat.html` - adicione:

```html
<div class="model-selector">
  <label for="modelSelect">Modelo:</label>
  <select id="modelSelect">
    <option value="microsoft/phi-3">Phi-3 (balanceado)</option>
    <option value="mistral:latest">Mistral (rápido)</option>
    <option value="llama2">Llama 2 (poderoso)</option>
    <option value="neural-chat">Neural Chat (chat)</option>
  </select>
</div>
```

**Arquivo:** `ollama-chat.js`:

```javascript
let MODEL_NAME = 'microsoft/phi-3';

document.getElementById('modelSelect').addEventListener('change', (e) => {
  MODEL_NAME = e.target.value;
  setStatus(`Modelo trocado para: ${MODEL_NAME}`);
});
```

---

## Customizações Avançadas (1-2 horas)

### 1. Adicionar Streaming de Respostas

Permitir ver resposta sendo digitada em tempo real.

**Arquivo:** `ollama-chat.js` - reescrever `sendMessage()`:

```javascript
async function sendMessage(question) {
  state.loading = true;
  setStatus('Enviando para Ollama...');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...state.history,
    { role: 'user', content: question },
  ];

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        stream: true,  // Ativar streaming
      }),
    });

    if (!response.ok) throw new Error(`Status ${response.status}`);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';
    
    // Criar elemento para resposta
    const container = document.createElement('article');
    container.className = 'message assistant';
    const label = document.createElement('strong');
    label.textContent = 'Phi-3';
    const message = document.createElement('p');
    container.append(label, message);
    chatHistory.appendChild(container);

    // Ler stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullResponse += json.message.content;
              message.textContent = fullResponse;
              chatHistory.scrollTop = chatHistory.scrollHeight;
            }
          } catch (e) {}
        }
      }
    }

    state.history.push({ role: 'user', content: question });
    state.history.push({ role: 'assistant', content: fullResponse });
    setStatus('Pronto para outra pergunta.');
  } catch (error) {
    console.error(error);
    appendMessage('assistant', `Erro: ${error.message}`);
    setStatus('Erro ao conectar com Ollama.');
  } finally {
    state.loading = false;
  }
}
```

### 2. Adicionar OCR para PDFs Scaneados

Use Tesseract.js para extrair texto de imagens.

**Arquivo:** `ollama-chat.html` - adicione script:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/4.1.1/tesseract.min.js"></script>
```

**Arquivo:** `ollama-chat.js` - modifique `extractPdfText()`:

```javascript
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let pageText = textContent.items.map(item => item.str).join(' ');

    // Se página vazia (escanerizado), fazer OCR
    if (pageText.trim().length === 0) {
      const image = await page.render({ canvasContext: {} });
      const result = await Tesseract.recognize(
        image,
        'por'  // Português
      );
      pageText = result.data.text;
    }

    fullText += pageText + '\n';
  }

  return fullText;
}
```

### 3. Adicionar Histórico com Datas

Mostrar timestamp de cada mensagem.

**Arquivo:** `ollama-chat.js` - modifique `appendMessage()`:

```javascript
function appendMessage(role, content) {
  const container = document.createElement('article');
  container.className = `message ${role}`;

  const label = document.createElement('strong');
  label.textContent = role === 'user' ? 'Você' : 'Phi-3';

  // Adicionar timestamp
  const time = document.createElement('small');
  const now = new Date();
  time.textContent = now.toLocaleTimeString('pt-BR');
  time.style.opacity = '0.7';

  const message = document.createElement('p');
  message.textContent = content;

  container.append(label, time, message);
  chatHistory.appendChild(container);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}
```

### 4. Adicionar Exportação de Chat

Salvar conversa como arquivo JSON/TXT.

**Arquivo:** `ollama-chat.html` - adicione botão:

```html
<button type="button" id="exportChat">💾 Exportar</button>
```

**Arquivo:** `ollama-chat.js`:

```javascript
document.getElementById('exportChat').addEventListener('click', () => {
  const data = {
    exportDate: new Date().toISOString(),
    model: MODEL_NAME,
    messages: state.history,
    context: state.context,
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `chat_${Date.now()}.json`;
  a.click();
});
```

---

## Ideias de Expansão

### Curto Prazo (1-2 semanas)
- [ ] Dark/Light mode
- [ ] localStorage (histórico persistente)
- [ ] Múltiplos modelos LLM
- [ ] Exportar chat como PDF
- [ ] Botão "Copiar resposta"

### Médio Prazo (1 mês)
- [ ] Streaming de respostas
- [ ] OCR para PDFs scaneados
- [ ] Suporte a idiomas (português/inglês)
- [ ] Histórico com pastas
- [ ] Busca no histórico

### Longo Prazo (2-3 meses)
- [ ] Web Worker para processamento em background
- [ ] Integração com Ollama web UI
- [ ] API própria de cache inteligente
- [ ] Embedding similarity search
- [ ] Fine-tuning de modelos
- [ ] Multas conversas paralelas

---

## Recursos Úteis para Desenvolvimento

### Documentação
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/api.md)
- [JavaScript Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)

### Modelos Alternativos
- `mistral:latest` - Muito rápido, 7B parâmetros
- `neural-chat:latest` - Otimizado para chat
- `llama2:13b` - Muito poderoso (requer mais RAM)
- `openhermes2:34b` - Bom para análise

### Ferramentas de Debug
```javascript
// Ver estado completo
console.log(state);

// Ver histórico
console.log(JSON.stringify(state.history, null, 2));

// Testar API diretamente
fetch('http://127.0.0.1:11434/api/tags')
  .then(r => r.json())
  .then(d => console.log(d));
```

---

## Performance & Otimização

### Reduzir Tempo de Resposta
1. Usar modelo menor: `mistral:7b` em vez de `phi-3`
2. Ativar GPU no Ollama (se disponível)
3. Reduzir contexto (apenas últimas mensagens)

### Reduzir Consumo de RAM
1. Usar `quantized models` (ex: `phi-3:3.8b-mini-4k-instruct-q4_K_M`)
2. Fechar outros programas
3. Usar modelo em 8-bit

### Melhorar Qualidade das Respostas
1. Usar prompt system mais específico
2. Exemplos no contexto (few-shot learning)
3. Modelo maior se possível

---

**Versão:** 2.0  
**Última Atualização:** 2 de julho de 2026