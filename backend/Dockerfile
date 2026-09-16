FROM node:22-alpine

WORKDIR /app

# Install openssl for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Copy application source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose backend port
EXPOSE 5000

# Apply the schema in every environment. Production creates only the required
# RBAC roles; demo users/products and the source watcher remain development-only.
CMD ["sh", "-c", "npx prisma db push && if [ \"$NODE_ENV\" = \"production\" ]; then npm run prisma:bootstrap && npm run build && npm start; else npx prisma db seed && npm run dev; fi"]
