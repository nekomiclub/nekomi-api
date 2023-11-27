FROM node

WORKDIR /fullkekw/animee/core

COPY . .

CMD ["npm", "run", "build"]