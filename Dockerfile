FROM denoland/deno:1.17.2

RUN apt -qqy update \
  && apt -qqy install make \
  && apt clean \
  && rm -rf /var/lib/apt/lists/*

USER deno
WORKDIR /app
COPY ./ /app/

CMD [ "make", "start" ]
