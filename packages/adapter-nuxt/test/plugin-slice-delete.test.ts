import { test, expect } from "vitest";
import { createMockFactory } from "@prismicio/mock";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as tsm from "ts-morph";

import { expectGlobalContentTypes } from "./__testutils__/expectGlobalContentTypes";
import { parseSourceFile } from "./__testutils__/parseSourceFile";

/**
 * !!! DO NOT use this mock factory in tests !!!
 *
 * @remarks
 * Its seed is not specific to be used outside the most general cases.
 */
const mock = createMockFactory({ seed: import.meta.url });

// Slice model to be used in general tests.
const model = mock.model.sharedSlice({
	id: "bar_baz",
	name: "QuxQuux",
	variations: [mock.model.sharedSliceVariation()],
});

test("deletes the Slice directory", async (ctx) => {
	await ctx.pluginRunner.callHook("slice:create", {
		libraryID: "slices",
		model,
	});

	expect(await fs.readdir(path.join(ctx.project.root, "slices"))).includes(
		"QuxQuux",
	);

	await ctx.pluginRunner.callHook("slice:delete", {
		libraryID: "slices",
		model,
	});

	expect(await fs.readdir(path.join(ctx.project.root, "slices"))).not.includes(
		"QuxQuux",
	);
});

test("removes the Slice from the library index", async (ctx) => {
	await ctx.pluginRunner.callHook("slice:create", {
		libraryID: "slices",
		model,
	});

	const beforeFile = parseSourceFile(
		await fs.readFile(
			path.join(ctx.project.root, "slices", "index.js"),
			"utf8",
		),
	);

	expect(
		(
			beforeFile
				.getVariableDeclarationOrThrow("components")
				.getInitializerIfKindOrThrow(tsm.SyntaxKind.CallExpression)
				.getArguments()[0] as tsm.ObjectLiteralExpression
		).getProperty("bar_baz"),
	).toBeTruthy();

	await ctx.pluginRunner.callHook("slice:delete", {
		libraryID: "slices",
		model,
	});

	const afterFile = parseSourceFile(
		await fs.readFile(
			path.join(ctx.project.root, "slices", "index.js"),
			"utf8",
		),
	);

	expect(
		(
			afterFile
				.getVariableDeclarationOrThrow("components")
				.getInitializerIfKindOrThrow(tsm.SyntaxKind.CallExpression)
				.getArguments()[0] as tsm.ObjectLiteralExpression
		).getProperty("bar_baz"),
	).toBeUndefined();
});

test("global types file does not contain types for the model", async (ctx) => {
	await ctx.pluginRunner.callHook("slice:create", {
		libraryID: "slices",
		model,
	});
	await ctx.pluginRunner.callHook("slice:delete", {
		libraryID: "slices",
		model,
	});

	await expectGlobalContentTypes(ctx, {
		generateTypesConfig: {
			sharedSliceModels: [],
		},
	});
});
