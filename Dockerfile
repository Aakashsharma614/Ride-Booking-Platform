FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY libs ./libs
COPY services ./services
COPY apps ./apps
RUN npm install --omit=dev
ENV NODE_ENV=production
ENV WORKSPACE=@ride/api-gateway
CMD ["sh", "-c", "npm run start -w ${WORKSPACE}"]

