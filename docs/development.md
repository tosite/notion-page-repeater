# DEVELOPMENT

## About "import maps"

We are using [import maps](https://deno.land/manual/linking_to_external_code/import_maps) to resolve dependencies.

You can easily manage your version by editing import-map.json. Optionally, you can use [crewdevio/Trex](https://github.com/crewdevio/Trex) to manage import-map.json easily.

## Dependency resolution

You can resolve script dependencies with running the following command.

```sh
make cache
```

> **TIPS:** If you have installed trex, you can run `trex install` to get the same effect.

## Running test scripts

You can run all the test cases with the following command.

```sh
make test
```

## Running script

If you want to simply run the script, you can use the following command.

```sh
make start
```
