// Configuração de regras de segurança para o Firebase
// Este arquivo será usado para configurar as regras de segurança no Firebase Console

// Regras do Firestore
const firestoreRules = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para coleção de mensagens
    match /messages/{messageId} {
      // Apenas usuários autenticados podem ler suas próprias mensagens
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      // Apenas usuários autenticados podem criar mensagens
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      // Ninguém pode atualizar ou excluir mensagens (preservação de histórico)
      allow update, delete: if false;
    }
    
    // Regras para coleção de conversas (aprendizado)
    match /conversations/{conversationId} {
      // Apenas sistema pode ler todas as conversas
      allow read: if request.auth != null && request.auth.token.admin == true;
      // Usuários autenticados podem criar conversas
      allow create: if request.auth != null;
      // Apenas sistema pode atualizar conversas (para marcar como analisadas)
      allow update: if request.auth != null && request.auth.token.admin == true;
      // Ninguém pode excluir conversas
      allow delete: if false;
    }
    
    // Regras para coleção de padrões (aprendizado)
    match /patterns/{patternId} {
      // Apenas sistema pode ler e escrever padrões
      allow read, write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Regras para coleção de conhecimento
    match /knowledge/{knowledgeId} {
      // Apenas sistema pode escrever conhecimento
      allow write: if request.auth != null && request.auth.token.admin == true;
      // Qualquer usuário autenticado pode ler conhecimento
      allow read: if request.auth != null;
    }
    
    // Regras para coleção de configurações de usuário
    match /userSettings/{userId} {
      // Usuários podem ler e escrever apenas suas próprias configurações
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Regras para coleção de modificações sugeridas
    match /suggestedModifications/{modificationId} {
      // Usuários podem ler suas próprias modificações sugeridas
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      // Sistema pode criar modificações sugeridas
      allow create: if request.auth != null && request.auth.token.admin == true;
      // Usuários podem aprovar ou rejeitar modificações (atualizar status)
      allow update: if request.auth != null && 
                    request.auth.uid == resource.data.userId && 
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['status', 'approvedAt', 'rejectedAt']);
      // Ninguém pode excluir modificações
      allow delete: if false;
    }
    
    // Regras para coleção de notificações
    match /notifications/{notificationId} {
      // Usuários podem ler suas próprias notificações
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      // Sistema pode criar notificações
      allow create: if request.auth != null && request.auth.token.admin == true;
      // Usuários podem marcar notificações como lidas
      allow update: if request.auth != null && 
                    request.auth.uid == resource.data.userId && 
                    request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read', 'readAt']);
      // Ninguém pode excluir notificações
      allow delete: if false;
    }
  }
}
`;

// Regras do Storage
const storageRules = `
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Arquivos de usuário
    match /users/{userId}/{allPaths=**} {
      // Usuários podem ler e escrever apenas seus próprios arquivos
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Arquivos do sistema
    match /system/{allPaths=**} {
      // Qualquer usuário autenticado pode ler arquivos do sistema
      allow read: if request.auth != null;
      // Apenas sistema pode escrever arquivos do sistema
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Arquivos públicos
    match /public/{allPaths=**} {
      // Qualquer pessoa pode ler arquivos públicos
      allow read: if true;
      // Apenas sistema pode escrever arquivos públicos
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
`;

// Exportar as regras para uso na configuração do Firebase
export const firebaseSecurityRules = {
  firestore: firestoreRules,
  storage: storageRules
};
