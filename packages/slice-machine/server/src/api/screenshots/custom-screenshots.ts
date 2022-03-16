import getEnv from "../services/getEnv";
import Files from "@lib/utils/files";

import {
  resolvePathsToScreenshot,
  createPathToScreenshot,
  Extensions,
} from "@slicemachine/core/build/src/libraries/screenshot";
import {
  createScreenshotUI,
  ScreenshotUI,
} from "@lib/models/common/ComponentUI";
import { TmpFile, CustomScreenshotRequest } from "@models/common/Screenshots";

export default async function handler(
  file: TmpFile,
  body: CustomScreenshotRequest
): Promise<ScreenshotUI> {
  const { libraryName, sliceName, variationId } = body;
  const { env } = await getEnv();

  const maybeCustomScreenshot = resolvePathsToScreenshot({
    paths: [env.cwd],
    from: libraryName,
    sliceName,
    variationId,
  });
  if (maybeCustomScreenshot) Files.remove(maybeCustomScreenshot.path);

  const pathToScreenshot = createPathToScreenshot({
    path: env.cwd,
    from: libraryName,
    sliceName,
    variationId,
    extension: file.type.split("/")[1] as Extensions,
  });

  Files.copy(file.path, pathToScreenshot, { recursive: true });

  return createScreenshotUI(env.baseUrl, pathToScreenshot);
}