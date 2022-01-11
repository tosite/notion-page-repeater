FROM denoland/deno:1.17.2

WORKDIR /app
COPY ./ /app/

RUN mkdir /root/.deno \
  && deno install -f -A --unstable --import-map=https://deno.land/x/trex/import_map.json -n trex --no-check https://deno.land/x/trex/cli.ts \
  && trex install

CMD [ "bash", "-c", "trex run start" ]
