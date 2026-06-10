FROM node:20-slim

WORKDIR /app

# Copy configuration and install dependencies
COPY package.json ./
RUN npm install

# Copy frontend source files
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
