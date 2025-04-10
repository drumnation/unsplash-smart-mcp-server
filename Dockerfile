FROM node:18-alpine

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Install global dependencies
RUN npm install -g tsx

# Build TypeScript
RUN npm run build

# Set environment variables
ENV NODE_ENV=production

# Command to run the server - use npm start instead of direct tsx execution
CMD ["npm", "start"]
