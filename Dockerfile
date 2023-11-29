FROM node

WORKDIR /fullkekw/animee/core

COPY . .

EXPOSE 54320

CMD ["npm", "run", "build"]