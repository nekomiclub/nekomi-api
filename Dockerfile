FROM node:23.11.1-slim

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm install

COPY . .

ENV ENV="deploy"
ENV DOCKER="true"

# Run
EXPOSE 43080
CMD [ "npm", "run", "start" ]