import { useState, useEffect, useRef } from 'react';

export default function ChatInterface({ onSendMessage, messages, isTyping, voiceEnabled, onToggleVoice }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focar no input quando o componente montar
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Função para lidar com envio de mensagem
  const handleSendMessage = () => {
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  // Lidar com tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Formatar mensagem (adicionar links, quebras de linha, etc.)
  const formatMessage = (text) => {
    // Converter URLs em links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formattedText = text.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-400 hover:underline">$1</a>');
    
    // Converter quebras de linha
    formattedText = formattedText.replace(/\n/g, '<br />');
    
    return formattedText;
  };

  // Função para sintetizar voz (TTS)
  const speakMessage = (text) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    // Remover tags HTML para a síntese de voz
    const cleanText = text.replace(/<[^>]*>/g, '');
    
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    window.speechSynthesis.speak(utterance);
  };

  // Efeito para sintetizar a última mensagem da IA
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].sender === 'ai' && voiceEnabled) {
      speakMessage(messages[messages.length - 1].text);
    }
  }, [messages, voiceEnabled]);

  return (
    <div className="glass-panel flex flex-col h-full">
      {/* Cabeçalho do chat */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
          <h3 className="font-medium">Hermes IA</h3>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={onToggleVoice}
            className={`icon-button ${voiceEnabled ? 'active' : ''}`}
            aria-label={voiceEnabled ? "Desativar voz" : "Ativar voz"}
            title={voiceEnabled ? "Desativar voz" : "Ativar voz"}
          >
            {voiceEnabled ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Área de mensagens */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-50">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <p className="text-lg font-medium mb-2">Nenhuma conversa iniciada</p>
            <p className="max-w-md">Digite uma mensagem abaixo para começar a conversar com Hermes, sua IA evolutiva.</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex mb-4 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div 
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.sender === 'user' 
                    ? 'message-user text-white' 
                    : 'message-ai'
                }`}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }} 
                  className="break-words"
                />
                <div className="text-xs opacity-70 mt-1 text-right">
                  {message.time}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex mb-4 justify-start slide-up">
            <div className="message-ai p-3 rounded-2xl">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Área de input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex space-x-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem para Hermes..."
            className="command-input flex-1 p-3 text-white resize-none focus:outline-none"
            rows="1"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim()}
            className={`btn-primary flex items-center justify-center w-12 h-12 rounded-full ${!input.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-400 text-center">
          Hermes está aprendendo com cada interação. Suas mensagens são armazenadas para melhorar a experiência.
        </div>
      </div>
    </div>
  );
}
