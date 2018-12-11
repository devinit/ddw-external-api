# start with a base image
FROM node:9-alpine@sha256:1fbcd77d0eb2af765d24ae4758b5a94b0d55c6002a15a4431d55795a449ebd3d
MAINTAINER vagrant <Alex Miller, alex.miller@devinit.org>

RUN mkdir /src
ADD ./ /src

WORKDIR /src
# install dependencies
RUN npm install --silent

CMD npm run prod
