# Dùng Node bản ổn định
FROM node:18

# Thư mục làm việc trong container
WORKDIR /app

# Copy package trước để cache
COPY package*.json ./

# Cài dependencies
RUN npm install

# Copy toàn bộ code
COPY . .

# Mở cổng backend (ví dụ 5000)
EXPOSE 5000

# Lệnh chạy app
CMD ["npm", "run", "start"]
