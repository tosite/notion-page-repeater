start:
	deno run -A --import-map ./import_map.json ./src/index.ts

cache:
	deno cache --import-map ./import_map.json ./src/*

test:
	deno test -A --import-map ./import_map.json
