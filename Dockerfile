FROM denoland/deno

USER deno
WORKDIR /app

COPY ./src/* .
CMD deno run -A ./index.ts
