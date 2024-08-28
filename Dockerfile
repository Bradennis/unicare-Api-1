FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV PORT 3000
ENV MONGODB_URI mongodb+srv://Bradennis:cs4finalyearproject.ksw-hub@cluster0.m71wcas.mongodb.net/kSw-HUB
ENV JWT_SECRET H1qJiuBoLoeXpSCeZcttIMpuTOesRyKl
EXPOSE 8080
CMD ["node", "app.js"]