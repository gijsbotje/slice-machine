import { CustomTypeSM } from "@core/models/CustomType";

export const createCustomType = (
  id: string,
  label: string,
  repeatable: boolean
): CustomTypeSM => ({
  id,
  label,
  repeatable,
  tabs: [
    {
      key: "Main",
      value: [],
    },
  ],
  status: true,
});
