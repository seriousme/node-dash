# Dash on Alpine
#
# VERSION 0.1.0

FROM mhart/alpine-node:6
MAINTAINER Hans Klunder <hans.klunder@bigfoot.com>

RUN mkdir -p /usr/src/app
RUN adduser -S -s /sbin/nologin -g "NodeJS" nodejs

WORKDIR /usr/src/app/

COPY ./ /usr/src/app/

RUN npm install --production
RUN chown nodejs /usr/src/app

EXPOSE 8080
EXPOSE 5984
USER nodejs
ENTRYPOINT ["/bin/sh","/usr/src/app/docker/startup.sh"]
