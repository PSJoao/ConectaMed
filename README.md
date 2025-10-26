# ConectaMed - Plataforma de Geolocalização de Serviços de Saúde

## 📋 Visão Geral

O ConectaMed é uma plataforma web que permite aos usuários encontrar estabelecimentos de saúde próximos, incluindo clínicas e órgãos públicos, com informações sobre médicos, especialidades e convênios aceitos.

## 🚀 Funcionalidades

### Para Usuários Comuns
- **Busca por proximidade**: Encontrar estabelecimentos próximos à localização atual
- **Filtros avançados**: Filtrar por especialidade, convênio e tipo de estabelecimento
- **Sistema de favoritos**: Salvar estabelecimentos favoritos para acesso rápido
- **Informações detalhadas**: Ver dados completos de estabelecimentos e médicos
- **Integração com Google Maps**: Abrir rotas diretamente no Google Maps oficial

### Para Administradores de Estabelecimentos
- **Cadastro de estabelecimentos**: Criar e gerenciar informações da clínica/hospital
- **Gestão de médicos**: Adicionar médicos com suas especialidades e convênios
- **Avaliações**: Receber e visualizar avaliações dos usuários

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** com Express.js
- **MongoDB** com Mongoose
- **Autenticação** com bcryptjs e express-session
- **Segurança** com helmet e express-rate-limit

### Frontend
- **Handlebars.js** para templates
- **Google Maps API** para mapas e geolocalização
- **CSS3** com animações modernas
- **JavaScript** vanilla para interatividade

### Recursos
- **Geolocalização** com índices geoespaciais do MongoDB
- **Busca textual** com regex
- **Sistema de modais** para melhor UX
- **Design responsivo** para todos os dispositivos

## 📦 Instalação

### Pré-requisitos
- Node.js (versão 16 ou superior)
- MongoDB (local ou Atlas)
- Chave da API do Google Maps

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd conecta-med
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
Crie um arquivo `.env` na raiz do projeto:
```env
MONGODB_URI=mongodb://localhost:27017/conectamed
GOOGLE_MAPS_API_KEY=sua_chave_aqui
SESSION_SECRET=seu_secret_aqui
PORT=3000
```

4. **Execute o script de seed para dados de exemplo**
```bash
npm run seed
```

5. **Inicie o servidor**
```bash
npm run dev
```

O sistema estará disponível em `http://localhost:3000`

## 👥 Usuários de Teste

Após executar o seed, você terá os seguintes usuários para teste:

| Email | Senha | Tipo |
|-------|-------|------|
| joao@exemplo.com | 123456 | Usuário comum |
| maria@clinica.com | 123456 | Clínica |
| carlos@hospital.com | 123456 | Órgão Público |

## 🗺️ Estrutura do Banco de Dados

### Usuários
- **Usuários comuns**: Podem favoritar estabelecimentos e salvar configurações
- **Administradores de clínicas**: Gerenciam estabelecimentos privados
- **Administradores de órgãos públicos**: Gerenciam hospitais públicos

### Estabelecimentos
- **Clínicas**: Estabelecimentos privados
- **Órgãos públicos**: Hospitais e unidades públicas
- **Localização**: Coordenadas geográficas para busca por proximidade
- **Convênios**: Lista de convênios aceitos pelo estabelecimento

### Médicos
- **Especialidades**: Múltiplas especialidades por médico
- **Convênios**: Convênios específicos aceitos pelo médico
- **Vinculação**: Cada médico pertence a um estabelecimento

## 🔧 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `POST /api/auth/logout` - Logout

### Estabelecimentos
- `GET /api/estabelecimentos` - Buscar estabelecimentos
- `GET /api/estabelecimentos/:id` - Buscar por ID
- `GET /api/estabelecimentos/proximos/:lat/:lng` - Buscar próximos

### Filtros
- `GET /api/filtros/especialidades` - Listar especialidades
- `GET /api/filtros/convenios` - Listar convênios
- `GET /api/filtros/tipos` - Listar tipos

### Favoritos (Autenticado)
- `POST /api/favoritos/:estabelecimentoId` - Adicionar favorito
- `DELETE /api/favoritos/:estabelecimentoId` - Remover favorito
- `GET /api/favoritos` - Listar favoritos
- `GET /api/favoritos/:estabelecimentoId` - Verificar se é favorito

## 🎨 Interface do Usuário

### Design Moderno
- **Mapa em tela cheia**: Interface similar ao Google Maps
- **Modais elegantes**: Login e registro via modais
- **Animações suaves**: Transições e efeitos visuais
- **Tema escuro**: Design glassmorphism para melhor contraste

### Responsividade
- **Desktop**: Interface completa com todos os recursos
- **Tablet**: Adaptação de elementos para telas médias
- **Mobile**: Menu lateral e otimizações para touch

## 🔒 Segurança

- **Autenticação segura**: Senhas criptografadas com bcrypt
- **Rate limiting**: Proteção contra ataques de força bruta
- **CORS configurado**: Controle de acesso cross-origin
- **Helmet**: Headers de segurança HTTP
- **Validação de dados**: Sanitização de entradas

## 🚀 Deploy

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/conectamed
GOOGLE_MAPS_API_KEY=sua_chave_producao
SESSION_SECRET=secret_muito_seguro
PORT=3000
```

### Comandos de Deploy
```bash
npm run build
npm start
```

## 📱 Capacitor (Mobile)

O projeto está configurado para ser compilado como aplicativo mobile:

```bash
npm run cap:init
npm run cap:add:android
npm run cap:sync
npm run cap:open:android
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte ou dúvidas, entre em contato através dos issues do GitHub ou email: suporte@conectamed.com

---

**ConectaMed** - Conectando pessoas aos serviços de saúde mais próximos! 🏥✨
