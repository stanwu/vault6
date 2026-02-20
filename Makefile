.PHONY: install dev renderer-dev desktop-dev build test typecheck check package clean

install:
	npm install

dev:
	ELECTRON_RUN_AS_NODE= npm run dev --workspace @vault6/desktop

renderer-dev:
	npm run dev --workspace @vault6/renderer

desktop-dev:
	ELECTRON_RUN_AS_NODE= npm run dev --workspace @vault6/desktop

build:
	npm run build

test:
	npm run test

typecheck:
	npm run typecheck

check: typecheck test build

package:
	npm run package

clean:
	rm -rf node_modules
	rm -rf apps/desktop/dist apps/desktop/out apps/desktop/release
	rm -rf apps/renderer/dist
	rm -rf packages/core/dist packages/db/dist packages/shared/dist
