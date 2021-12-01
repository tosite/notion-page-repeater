FROM denoland/deno

USER deno
WORKDIR /app

COPY ./src/* /app/
CMD cd /app && deno run -A ./index.ts
