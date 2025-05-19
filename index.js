import { useState } from 'react';
import Head from 'next/head';
import { useHermesAI } from '../hooks/useHermesAI';
import ChatInterface from '../components/hermes/ChatInterface';

export default function Home() {
  const {
    messages,
    isTyping,
    settings,
    sendMessage,
    toggleVoice
  } = useHermesAI();

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>HermesVerse | Console Hermes AGINQ v1</title>
        <meta name="description" content="HermesVerse - IA Evolutiva" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>

      <header className="py-4 px-6 border-b border-white/10 backdrop-blur-md bg-black/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
            </div>
            <h1 className="text-xl font-bold gradient-text">HermesVerse</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-white/70 hover:text-white transition-colors">Início</a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">Recursos</a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">Documentação</a>
            <a href="#" className="text-white/70 hover:text-white transition-colors">Sobre</a>
          </nav>
          <div>
            <button className="btn-primary">
              Login
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <section className="text-center mb-12 fade-in">
            <h2 className="text-4xl font-bold mb-4 gradient-text">Console Hermes AGINQ v1</h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Sua IA evolutiva, projetada para aprender, adaptar e crescer com você.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="lg:col-span-2">
              <div className="chat-container">
                <ChatInterface 
                  messages={messages}
                  isTyping={isTyping}
                  onSendMessage={sendMessage}
                  voiceEnabled={settings.voiceEnabled}
                  onToggleVoice={toggleVoice}
                />
              </div>
            </div>
            <div className="glass-panel p-6 h-fit">
              <h3 className="text-xl font-semibold mb-4 gradient-text">Recursos Avançados</h3>
              <ul className="space-y-4">
                <li className="flex items-start space-x-3">
                  <div className="mt-1 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Aprendizado Contínuo</h4>
                    <p className="text-sm text-white/70">Hermes evolui com cada interação, adaptando-se às suas necessidades.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Resposta por Voz</h4>
                    <p className="text-sm text-white/70">Ative a síntese de voz para ouvir as respostas de Hermes.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Integração com Telegram</h4>
                    <p className="text-sm text-white/70">Receba notificações e interaja com Hermes pelo Telegram.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Auto-Modificação</h4>
                    <p className="text-sm text-white/70">Com sua autorização, Hermes pode evoluir seu próprio código.</p>
                  </div>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="mt-1 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                      <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-medium">Segurança Avançada</h4>
                    <p className="text-sm text-white/70">Todas as interações são seguras e protegidas.</p>
                  </div>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-white/10">
                <h4 className="font-medium mb-2">Evolução em Progresso</h4>
                <div className="w-full bg-white/10 rounded-full h-2.5">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-white/70 mt-2">Hermes está constantemente evoluindo. Novas capacidades são adicionadas regularmente.</p>
              </div>
            </div>
          </section>

          <section className="mb-12">
            <h3 className="text-2xl font-bold text-center mb-8 gradient-text">Como Hermes Funciona</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Interação Natural</h4>
                <p className="text-white/70">Converse naturalmente com Hermes usando linguagem cotidiana. Não há necessidade de comandos especiais.</p>
              </div>
              <div className="glass-panel p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Aprendizado Contínuo</h4>
                <p className="text-white/70">Cada interação melhora a compreensão de Hermes sobre suas preferências e necessidades.</p>
              </div>
              <div className="glass-panel p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400">
                    <path d="M18 10h-4V6"></path>
                    <path d="M22 10h-4V6"></path>
                    <path d="M6 12h4v4"></path>
                    <path d="M2 12h4v4"></path>
                    <path d="M14 4h2a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6h-8a6 6 0 0 1-6-6v-2"></path>
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Evolução Autorizada</h4>
                <p className="text-white/70">Com sua permissão, Hermes pode evoluir e adicionar novas funcionalidades para melhor atendê-lo.</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-8 px-4 border-t border-white/10 backdrop-blur-md bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                </div>
                <h2 className="text-lg font-bold gradient-text">HermesVerse</h2>
              </div>
              <p className="text-sm text-white/70 mt-2">© 2025 HermesVerse. Todos os direitos reservados.</p>
            </div>
            <div className="flex space-x-8">
              <div>
                <h3 className="font-medium mb-2">Recursos</h3>
                <ul className="space-y-1 text-sm text-white/70">
                  <li><a href="#" className="hover:text-white transition-colors">Documentação</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Integrações</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Empresa</h3>
                <ul className="space-y-1 text-sm text-white/70">
                  <li><a href="#" className="hover:text-white transition-colors">Sobre</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
