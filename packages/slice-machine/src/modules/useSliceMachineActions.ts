import { useDispatch } from "react-redux";
import { LoadingKeysEnum } from "@src/modules/loading/types";
import { ModalKeysEnum } from "@src/modules/modal/types";
import { modalCloseCreator, modalOpenCreator } from "@src/modules/modal";
import {
  startLoadingActionCreator,
  stopLoadingActionCreator,
} from "@src/modules/loading";
import {
  finishOnboardingCreator,
  sendAReviewCreator,
  skipReviewCreator,
  updatesViewedCreator,
  hasSeenTutorialsTooTipCreator,
} from "@src/modules/userContext";
import { refreshStateCreator } from "@src/modules/environment";
import {
  openSetupDrawerCreator,
  closeSetupDrawerCreator,
  toggleSetupDrawerStepCreator,
  checkSimulatorSetupCreator,
  connectToSimulatorIframeCreator,
} from "@src/modules/simulator";
import ServerState from "@models/server/ServerState";
import { createCustomTypeCreator } from "@src/modules/customTypes";
import { createSliceCreator } from "@src/modules/slices";
import { UserContextStoreType } from "./userContext/types";
import { openToasterCreator, ToasterType } from "@src/modules/toaster";
import { initCustomTypeStoreCreator, createTabCreator, deleteTabCreator, updateTabCreator, addFieldCreator,
  deleteFieldCreator,
  reorderFieldCreator,
  replaceFieldCreator } from "@src/modules/customType/actions";
import { ArrayTabs, CustomType } from "@models/common/CustomType";
import { Field } from "@models/common/CustomType/fields";

const useSliceMachineActions = () => {
  const dispatch = useDispatch();

  // Simulator module
  const checkSimulatorSetup = (
    withFirstVisitCheck: boolean,
    callback?: () => void
  ) =>
    dispatch(
      checkSimulatorSetupCreator.request({ withFirstVisitCheck, callback })
    );
  const openSetupDrawer = () => dispatch(openSetupDrawerCreator({}));
  const closeSetupDrawer = () => dispatch(closeSetupDrawerCreator());
  const connectToSimulatorFailure = () =>
    dispatch(connectToSimulatorIframeCreator.failure());
  const connectToSimulatorSuccess = () =>
    dispatch(connectToSimulatorIframeCreator.success());
  const toggleSetupDrawerStep = (stepNumber: number) =>
    dispatch(toggleSetupDrawerStepCreator({ stepNumber }));

  // Modal module
  const closeLoginModal = () =>
    dispatch(modalCloseCreator({ modalKey: ModalKeysEnum.LOGIN }));
  const openLoginModal = () =>
    dispatch(modalOpenCreator({ modalKey: ModalKeysEnum.LOGIN }));
  const closeCreateSliceModal = () =>
    dispatch(modalCloseCreator({ modalKey: ModalKeysEnum.CREATE_SLICE }));
  const openCreateSliceModal = () =>
    dispatch(modalOpenCreator({ modalKey: ModalKeysEnum.CREATE_SLICE }));
  const closeCreateCustomTypeModal = () =>
    dispatch(modalCloseCreator({ modalKey: ModalKeysEnum.CREATE_CUSTOM_TYPE }));
  const openCreateCustomTypeModal = () =>
    dispatch(modalOpenCreator({ modalKey: ModalKeysEnum.CREATE_CUSTOM_TYPE }));

  // Loading module
  const startLoadingReview = () =>
    dispatch(startLoadingActionCreator({ loadingKey: LoadingKeysEnum.REVIEW }));
  const stopLoadingReview = () =>
    dispatch(stopLoadingActionCreator({ loadingKey: LoadingKeysEnum.REVIEW }));
  const startLoadingLogin = () =>
    dispatch(startLoadingActionCreator({ loadingKey: LoadingKeysEnum.LOGIN }));
  const stopLoadingLogin = () =>
    dispatch(stopLoadingActionCreator({ loadingKey: LoadingKeysEnum.LOGIN }));

  // UserContext module
  const skipReview = () => dispatch(skipReviewCreator());
  const sendAReview = () => dispatch(sendAReviewCreator());
  const finishOnboarding = () => dispatch(finishOnboardingCreator());
  const setUpdatesViewed = (versions: UserContextStoreType["updatesViewed"]) =>
    dispatch(updatesViewedCreator(versions));
  const setSeenTutorialsToolTip = () =>
    dispatch(hasSeenTutorialsTooTipCreator());

  // Custom types module
  const createCustomType = (id: string, label: string, repeatable: boolean) =>
    dispatch(createCustomTypeCreator.request({ id, label, repeatable }));

  // Custom type module
  const initCustomTypeStore = (model: CustomType<ArrayTabs>, mockConfig: any) =>
    dispatch(initCustomTypeStoreCreator({model, mockConfig}))
  const createCustomTypeTab = (tabId: string) => dispatch(createTabCreator({ tabId }));
  const deleteCustomTypeTab = (tabId: string) => dispatch(deleteTabCreator({ tabId }));
  const updateCustomTypeTab = (tabId: string, newTabId: string) =>
    dispatch(updateTabCreator({ tabId, newTabId }));
  const addCustomTypeField = (tabId: string, fieldId: string, field: Field) =>
    dispatch(addFieldCreator({ tabId, fieldId, field }));
  const deleteCustomTypeField = (tabId: string, fieldId: string) =>
    dispatch(deleteFieldCreator({ tabId, fieldId }));
  const reorderCustomTypeField = (tabId: string, start: number, end: number) =>
    dispatch(reorderFieldCreator({ tabId, start, end }));
  const replaceCustomTypeField = (
    tabId: string,
    previousFieldId: string,
    newFieldId: string,
    value: Field
  ) =>
    dispatch(
      replaceFieldCreator({ tabId, previousFieldId, newFieldId, value })
    );

  // Slice module
  const createSlice = (sliceName: string, libName: string) =>
    dispatch(createSliceCreator.request({ sliceName, libName }));

  // Toaster store
  const openToaster = (message: string, type: ToasterType) =>
    dispatch(openToasterCreator({ message, type }));

  // State Action (used by multiple stores)
  const refreshState = (serverState: ServerState) => {
    dispatch(
      refreshStateCreator({
        env: serverState.env,
        remoteCustomTypes: serverState.remoteCustomTypes,
        localCustomTypes: serverState.customTypes,
        libraries: serverState.libraries,
        remoteSlices: serverState.remoteSlices,
      })
    );
  };

  return {
    checkSimulatorSetup,
    connectToSimulatorFailure,
    connectToSimulatorSuccess,
    toggleSetupDrawerStep,
    closeSetupDrawer,
    openSetupDrawer,
    refreshState,
    finishOnboarding,
    openLoginModal,
    closeLoginModal,
    startLoadingLogin,
    stopLoadingLogin,
    stopLoadingReview,
    startLoadingReview,
    createCustomType,
    initCustomTypeStore,
    createCustomTypeTab,
    updateCustomTypeTab,
    deleteCustomTypeTab,
    addCustomTypeField,
    deleteCustomTypeField,
    reorderCustomTypeField,
    replaceCustomTypeField,
    createSlice,
    sendAReview,
    skipReview,
    setUpdatesViewed,
    setSeenTutorialsToolTip,
    closeCreateCustomTypeModal,
    openCreateCustomTypeModal,
    openCreateSliceModal,
    closeCreateSliceModal,
    openToaster,
  };
};

export default useSliceMachineActions;
