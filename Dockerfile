FROM denoland/deno

USER deno
WORKDIR /app
COPY ./ /app/
CMD [ "deno", "run", "-A", "/app/src/index.ts" ]
