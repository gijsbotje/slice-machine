import { CustomTypeMockConfig } from "../MockConfig";
import { CustomTypeSM } from "@slicemachine/core/models/CustomType";
import { SlicesSM } from "@slicemachine/core/models/Slices";

export interface SaveCustomTypeBody {
  model: CustomTypeSM;
  mockConfig: CustomTypeMockConfig;
}

export interface RenameCustomTypeBody {
  customTypeId: string;
  newCustomTypeName: string;
}

export const CustomType = {
  getSliceZones(ct: CustomTypeSM): ReadonlyArray<SlicesSM | null> {
    return ct.tabs.map((t) => t.sliceZone || null);
  },
};
