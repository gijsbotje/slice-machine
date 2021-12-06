import path from "path";
import type Models from "@slicemachine/core/build/src/models";
import Files from "@lib/utils/files";
import { findIndexFile } from "@lib/utils/lib";
import { BackendEnvironment } from "@lib/models/common/Environment";

import { Framework } from "@lib/models/common/Framework";
import * as LibrariesState from "../LibrariesState";
import { Libraries } from "@slicemachine/core";

const createIndexFile = (lib: Models.Library<Models.Component>) => {
  let f = `// This file is generated by Prismic local builder. Update with care!\n\n`;

  for (const c of lib.components) {
    f += `export { default as ${c.infos.sliceName} } from './${c.infos.sliceName}'\n`;
  }
  return f;
};

const createIndexFileForSvelte = (lib: Models.Library<Models.Component>) => {
  let f = `// This file is generated by Prismic local builder. Update with care!\n\n`;
  f += "const Slices = {}\n";
  f += "export default Slices\n\n";

  for (const c of lib.components) {
    f += `import ${c.infos.sliceName} from './${c.infos.sliceName}/index.svelte'\n`;
    f += `Slices.${c.infos.sliceName} = ${c.infos.sliceName}\n`;
  }
  return f;
};

const createIndexFileForFrameWork = (
  env: BackendEnvironment,
  lib: Models.Library<Models.Component>
) => {
  if (env.framework === Framework.svelte) return createIndexFileForSvelte(lib);
  return createIndexFile(lib);
};

export default async function onSaveSlice(
  env: BackendEnvironment
): Promise<void> {
  const libraries = await Libraries.libraries(
    env.cwd,
    (env.userConfig.libraries || []) as string[]
  );
  const localLibs = libraries.filter((e) => e.isLocal);

  for (const lib of localLibs) {
    if (lib.components.length) {
      const { pathToSlice: relativePathToLib } = lib.components[0];
      //@ts-ignore
      const file = createIndexFileForFrameWork(env, lib);

      const pathToLib = path.join(env.cwd, relativePathToLib);

      const indexFilePath =
        findIndexFile(pathToLib) || path.join(pathToLib, "index.js");
      Files.write(indexFilePath, file);
    }
  }

  LibrariesState.generateState(env);
}
