import { expect, TestContext } from "vitest";
import { generateTypes, GenerateTypesConfig } from "prismic-ts-codegen";
import prettier from "prettier";
import * as fs from "node:fs/promises";
import * as path from "node:path";

type ExpectGlobalContentTypesArgs = {
	generateTypesConfig?: GenerateTypesConfig;
	format?: boolean;
};

export const expectGlobalContentTypes = async (
	ctx: TestContext,
	args: ExpectGlobalContentTypesArgs = {},
): Promise<void> => {
	const contents = await fs.readFile(
		path.join(ctx.project.root, "prismicio-types.d.ts"),
		"utf8",
	);

	let generatedTypes = generateTypes({
		...args.generateTypesConfig,
		clientIntegration: {
			includeCreateClientInterface: true,
			includeContentNamespace: true,
			...args.generateTypesConfig?.clientIntegration,
		},
	});
	generatedTypes = `// Code generated by Slice Machine. DO NOT EDIT.\n\n${generatedTypes}`;

	if (args.format ?? true) {
		expect(contents).toBe(
			prettier.format(generatedTypes, { parser: "typescript" }),
		);
	} else {
		expect(contents).toBe(generatedTypes);
	}
};
