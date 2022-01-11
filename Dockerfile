FROM denoland/deno:1.17.2

WORKDIR /app
COPY ./ /app/

RUN mkdir /root/.deno
RUN deno install -f -A --unstable --import-map=https://deno.land/x/trex/import_map.json -n trex --no-check https://deno.land/x/trex/cli.ts

CMD [ "bash", "-c", "trex run start" ]
