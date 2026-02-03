# Barber Schedule

Sistema simples de agendamentos para barbearia com React, Express e MongoDB.

## Funcionalidades
- Agendar cortes com seleção de serviço
- Horários disponíveis de 30 em 30 minutos
- Calendário mensal com visão de agendamentos

## Requisitos
- Node.js
- MongoDB (Atlas ou local)

## Como rodar
1. Instale dependências:
```powershell
cd server
npm install
cd ..\client
npm install
```

2. Configure as variáveis de ambiente:
- `server/.env`:
```
MONGO_URI=string_de_conexao
PORT=4000
```
- `client/.env` (opcional):
```
VITE_API_URL=http://localhost:4000
```

3. Inicie o backend:
```powershell
cd server
npm run dev
```

4. Inicie o frontend:
```powershell
cd ..\client
npm run dev
```

## Endpoints
- `GET /api/appointments`
- `POST /api/appointments`
- `PUT /api/appointments/:id`
- `DELETE /api/appointments/:id`

