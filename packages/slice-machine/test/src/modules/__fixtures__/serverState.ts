import ServerState from "@models/server/ServerState";

export const dummyServerState: Pick<
  ServerState,
  "env" | "customTypes" | "remoteCustomTypes" | "libraries"
> = {
  env: {
    repo: "sm-env-example",
    manifest: {
      libraries: ["~/slices"],
      apiEndpoint: "https://sm-env-example.prismic.io/api/v2",
      chromaticAppId: "5f5b34f06f304800225c4e17",
      tracking: false,
      localSliceSimulatorURL: "http://localhost:3000/slice-simulator",
    },
    packageManager: "npm",
    changelog: {
      currentVersion: "0.2.0",
      latestNonBreakingVersion: "0.1.2",
      updateAvailable: false,
      versions: [],
    },
    shortId: "shortId",
    supportsSliceSimulator: true,
  },
  customTypes: [
    {
      id: "about",
      label: "My Cool About Page",
      repeatable: false,
      status: true,
      tabs: [
        {
          key: "Main",
          value: [
            {
              key: "title",
              value: {
                type: "StructuredText",
                config: {
                  label: "",
                  placeholder: "",
                  allowTargetBlank: true,
                  single:
                    "paragraph,preformatted,heading1,heading2,heading3,heading4,heading5,heading6,strong,em,hyperlink,image,embed,list-item,o-list-item,rtl",
                },
              },
            },
          ],
        },
      ],
    },
  ],
  // @ts-expect-error TS(2322) FIXME: Type '{ env: { repo: string; manifest: { libraries... Remove this comment to see the full error message
  remoteSlices: [],
  remoteCustomTypes: [],
  libraries: [],
};
