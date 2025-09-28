# Use a small, modern Node.js image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy only package files first (better caching)
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy the rest of the app
COPY . .

# Expose port 3000 to the host
EXPOSE 3000

# Run the app
CMD ["node", "runner.js"]

