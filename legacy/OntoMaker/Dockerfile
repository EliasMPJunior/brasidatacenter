FROM node:18-alpine

WORKDIR /app

COPY ./src ./

RUN npm install

RUN apk add --no-cache bash

# Expor a porta do Vite
EXPOSE 5173

# Iniciar o servidor de desenvolvimento
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
