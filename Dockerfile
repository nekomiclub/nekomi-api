FROM node

WORKDIR /fullkekw/animee/core

COPY . .

EXPOSE 54320

RUN apt-get -y update && apt-get -y upgrade && apt-get install -y --no-install-recommends ffmpeg

CMD ["npm", "run", "build"]