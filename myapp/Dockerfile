# Use official Node.js image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package.json first and install dependencies
COPY app/package*.json ./
RUN npm install

# Copy the rest of the app source code
COPY app/ ./

# Expose port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]

