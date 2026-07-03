const chatHistory = document.getElementById('chatHistory');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const statusBadge = document.getElementById('status');

const contextBox = document.getElementById('contextBox');
const contextTitle = document.getElementById('contextTitle');
const contextPreview = document.getElementById('contextPreview');
const clearContextBtn = document.getElementById('clearContext');
const clearChatBtn = document.getElementById('clearChat');

const pdfInput = document.getElementById('pdfInput');
const audioInput = document.getElementById('audioInput');
const videoInput = document.getElementById('videoInput');

const API_URL = 'http://127.0.0.1:11434/api/generate';
const CHAT_API_URL = 'http://127.0.0.1:11434/api/chat';
const TRANSCRIBE_API_URL = 'http://127.0.0.1:8001/transcribe';
const OLLAMA_TRANSCRIBE_URL = 'http://127.0.0.1:11434/api/transcribe';
const MODEL_NAME = 'phi3';
const SYSTEM_PROMPT = 'Você é um assistente de chat útil, conciso e factualmente correto em português. Use apenas o contexto adicional fornecido quando ele estiver presente. Se a resposta não puder ser obtida a partir do contexto, diga que não há informação suficiente no arquivo anexado. Quando for uma pergunta de cultura geral ou esportes, responda com fatos conhecidos e verificados e evite inventar informações. Se você não souber a resposta exata, diga que não tem certeza em vez de dar um palpite.';

// Configurar PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const state = {
  history: [],
  loading: false,
  context: {
    type: null, // 'pdf', 'audio', 'video'
    text: '',
  },
};

function setStatus(text) {
  statusBadge.textContent = text;
}

function appendMessage(role, content) {
  const container = document.createElement('article');
  container.className = `message ${role}`;

  const label = document.createElement('strong');
  label.textContent = role === 'user' ? 'Você' : 'Phi-3';

  const message = document.createElement('p');
  message.textContent = content;

  container.append(label, message);
  chatHistory.appendChild(container);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

function showContextBox(type, text, title) {
  state.context.type = type;
  state.context.text = text;

  contextTitle.textContent = `✓ ${title} carregado`;
  const preview = text.substring(0, 300) + (text.length > 300 ? '...' : '');
  contextPreview.textContent = preview;
  contextBox.style.display = 'block';
}

function resetContext() {
  state.context.type = null;
  state.context.text = '';
  contextBox.style.display = 'none';
  pdfInput.value = '';
  audioInput.value = '';
  videoInput.value = '';
}

clearContextBtn.addEventListener('click', resetContext);
clearChatBtn.addEventListener('click', resetChat);

function resetChat() {
  state.history = [];
  chatHistory.innerHTML = '';
  setStatus('Conversa limpa. Pergunte algo novo.');
  userInput.focus();
}

// ==================== PDF EXTRACTION ====================
async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

pdfInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const progressBox = document.getElementById('pdfProgress');
  const statusSpan = document.getElementById('pdfStatus');
  progressBox.style.display = 'block';
  statusSpan.textContent = 'Extraindo texto...';

  try {
    const text = await extractPdfText(file);
    showContextBox('pdf', text, '📄 PDF');
    statusSpan.textContent = '✓ PDF lido com sucesso!';
    setStatus('PDF carregado. Faça perguntas sobre o conteúdo.');
  } catch (error) {
    console.error('Erro ao ler PDF:', error);
    statusSpan.textContent = '✗ Erro ao ler PDF';
    statusSpan.style.color = '#ff6464';
  }

  setTimeout(() => {
    progressBox.style.display = 'none';
  }, 2000);
});

// ==================== AUDIO/VIDEO TRANSCRIPTION ====================
async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.wav');

  setStatus('Transcrevendo áudio localmente... (isso pode levar um tempo)');

  try {
    const response = await fetch(TRANSCRIBE_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return data.text || 'Transcrição não disponível';
    }

    throw new Error(`Servidor de transcrição retornou ${response.status}`);
  } catch (error) {
    console.warn('Transcrição local falhou:', error);
    try {
      setStatus('Tentando transcrição via Ollama...');
      const response = await fetch(OLLAMA_TRANSCRIBE_URL, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return data.text || 'Transcrição não disponível';
      }

      throw new Error(`Ollama retornou ${response.status}`);
    } catch (ollamaError) {
      console.error('Erro na transcrição via Ollama:', ollamaError);
      return 'Erro ao transcrever. Inicie o servidor local de transcrição ou instale Whisper no Ollama.';
    }
  }
}

audioInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const progressBox = document.getElementById('audioProgress');
  const statusSpan = document.getElementById('audioStatus');
  progressBox.style.display = 'block';
  statusSpan.textContent = 'Transcrevendo...';

  try {
    const audioBlob = file.slice(0, file.size, file.type);
    const text = await transcribeAudio(audioBlob);
    showContextBox('audio', text, '🎧 Áudio');
    statusSpan.textContent = '✓ Áudio transcrito!';
    setStatus('Áudio carregado. Faça perguntas sobre o conteúdo.');
  } catch (error) {
    console.error('Erro ao processar áudio:', error);
    statusSpan.textContent = '✗ Erro ao processar áudio';
    statusSpan.style.color = '#ff6464';
  }

  setTimeout(() => {
    progressBox.style.display = 'none';
  }, 2000);
});

// ==================== VIDEO EXTRACTION & TRANSCRIPTION ====================
async function extractAudioFromVideo(videoFile) {
  const FFmpeg = FFmpegWasm.FFmpeg;
  const fetchFile = FFmpegWasm.fetchFile;

  const ffmpeg = new FFmpeg();
  const { log } = FFmpeg;

  if (!ffmpeg.isLoaded()) {
    setStatus('Carregando FFmpeg... aguarde');
    await ffmpeg.load();
  }

  // Ler arquivo de vídeo
  const data = await fetchFile(videoFile);
  ffmpeg.FS('writeFile', videoFile.name, data);

  // Extrair áudio como WAV
  const outputName = 'audio_extracted.wav';
  await ffmpeg.run('-i', videoFile.name, '-q:a', '9', '-filter:a', 'aformat=sample_rates=16000', outputName);

  // Ler arquivo WAV convertido
  const audioData = ffmpeg.FS('readFile', outputName);
  ffmpeg.FS('unlink', videoFile.name);
  ffmpeg.FS('unlink', outputName);

  return new Blob([audioData.buffer], { type: 'audio/wav' });
}

videoInput.addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const progressBox = document.getElementById('videoProgress');
  const statusSpan = document.getElementById('videoStatus');
  progressBox.style.display = 'block';
  statusSpan.textContent = 'Extraindo áudio do vídeo...';

  try {
    const audioBlob = await extractAudioFromVideo(file);
    statusSpan.textContent = 'Transcrevendo...';

    const text = await transcribeAudio(audioBlob);
    showContextBox('video', text, '🎬 Vídeo');
    statusSpan.textContent = '✓ Vídeo processado!';
    setStatus('Vídeo carregado. Faça perguntas sobre o conteúdo.');
  } catch (error) {
    console.error('Erro ao processar vídeo:', error);
    statusSpan.textContent = '✗ Erro ao processar vídeo';
    statusSpan.style.color = '#ff6464';
  }

  setTimeout(() => {
    progressBox.style.display = 'none';
  }, 2000);
});

// ==================== CHAT WITH CONTEXT ====================
async function sendMessage(question) {
  state.loading = true;
  setStatus('Enviando para Ollama...');

  // Montar prompt com contexto
  let contextualPrompt = question;
  if (state.context.text) {
    contextualPrompt = `Contexto adicional (use somente este texto para responder):\n${state.context.text}\n\nPergunta: ${question}`;
  }

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...state.history,
    { role: 'user', content: contextualPrompt },
  ];

  try {
    const response = await fetch(CHAT_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama retornou ${response.status}`);
    }

    const data = await response.json();
    const assistantReply = data?.message?.content || 'Resposta vazia do modelo.';

    state.history.push({ role: 'user', content: question });
    state.history.push({ role: 'assistant', content: assistantReply });

    appendMessage('assistant', assistantReply);
    setStatus('Pronto para outra pergunta.');
  } catch (error) {
    console.error(error);
    appendMessage('assistant', `Erro: ${error.message}`);
    setStatus('Erro ao conectar com Ollama.');
  } finally {
    state.loading = false;
  }
}

chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = userInput.value.trim();
  if (!question || state.loading) {
    return;
  }

  appendMessage('user', question);
  userInput.value = '';
  userInput.focus();

  await sendMessage(question);
});

window.addEventListener('load', () => {
  setStatus('Conecte o Ollama e carregue um arquivo (opcional).');
});
