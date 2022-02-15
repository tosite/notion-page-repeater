start:
	deno run -A --import-map ./import_map.json ./src/index.ts

cache:
	deno cache --import-map ./import_map.json ./src/*

test:
	deno test -A --import-map ./import_map.json

tag:
	git checkout main && git pull origin main
	git tag -d v1 && git tag v1
	git push origin v1 -f
