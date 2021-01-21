# start with a base image
FROM node:14

RUN mkdir /src
ADD ./ /src

WORKDIR /src
# install dependencies
RUN npm install --silent

CMD npm run prod
