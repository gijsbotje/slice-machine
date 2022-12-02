import { Box, Flex, Text } from "theme-ui";
import { getStepperConfigurationByFramework } from "./steps";

import React from "react";
import useSliceMachineActions from "@src/modules/useSliceMachineActions";
import { useSelector } from "react-redux";
import { SliceMachineStoreType } from "@src/redux/type";
import {
  selectOpenedStep,
  selectSetupStatus,
  selectSetupSteps,
  selectUserHasAtLeastOneStepMissing,
  selectUserHasConfiguredAllSteps,
} from "@src/modules/simulator";

import { isLoading } from "@src/modules/loading";
import { LoadingKeysEnum } from "@src/modules/loading/types";
import { Frameworks } from "@slicemachine/core/build/models";
import {
  getFramework,
  getLinkToTroubleshootingDocs,
  selectSimulatorUrl,
} from "@src/modules/environment";
import StepSection from "./components/StepSection";
import WarningSection from "./components/WarningSection";
import HTMLRenderer from "@components/HTMLRenderer";

interface Props {
  framework: Frameworks;
  isSimulatorAvailableForFramework: boolean;
}

export default function Stepper({
  framework,
  isSimulatorAvailableForFramework,
}: Props): React.ReactElement {
  if (!isSimulatorAvailableForFramework) {
    return (
      <p>
        Framework {framework || "undefined"} is not supported yet. Please use
        Storybook instead.
      </p>
    );
  }

  // const stepperConfiguration = getStepperConfigurationByFramework(framework);

  const { toggleSetupDrawerStep, checkSimulatorSetup } =
    useSliceMachineActions();
  const {
    simulatorUrl,
    openedStep,
    setupSteps,
    // setupStatus,
    userHasAtLeastOneStepMissing,
    userHasConfiguredAllSteps,
    linkToTroubleshootingDocs,
    isCheckingSetup,
  } = useSelector((state: SliceMachineStoreType) => ({
    openedStep: selectOpenedStep(state),
    isCheckingSetup: isLoading(state, LoadingKeysEnum.CHECK_SIMULATOR),
    setupSteps: selectSetupSteps(state),
    simulatorUrl: selectSimulatorUrl(state),
    framework: getFramework(state),
    linkToTroubleshootingDocs: getLinkToTroubleshootingDocs(state),
    userHasAtLeastOneStepMissing: selectUserHasAtLeastOneStepMissing(state),
    userHasConfiguredAllSteps: selectUserHasConfiguredAllSteps(state),
  }));

  // const stepNumberWithErrors =
  //   stepperConfiguration.getStepNumberWithErrors(setupStatus);

  return (
    <div>
      {(setupSteps || []).map((step, i) => {
        const status =
          step.isComplete === true
            ? "ok"
            : step.isComplete === false
            ? "ko"
            : null;

        return (
          <StepSection
            stepNumber={i + 1}
            title={step.title}
            isOpen={openedStep === i + 1}
            onOpenStep={() => toggleSetupDrawerStep(i + 1)}
            status={status}
          >
            <Flex sx={{ flexDirection: "column" }}>
              {step.validationMessages.map((validationMessage) => {
                return (
                  <WarningSection
                    title={validationMessage.title}
                    sx={{ mb: 2 }}
                  >
                    <HTMLRenderer html={validationMessage.message} />
                  </WarningSection>
                );
              })}
              <Text variant={"xs"} sx={{ mb: 3 }}>
                <HTMLRenderer
                  html={step.body}
                  components={{
                    pre: ({ children, ...props }) => {
                      return (
                        <Box
                          as="pre"
                          {...props}
                          sx={{
                            backgroundColor: "#161b22",
                            color: "#c9d1d9",
                            borderRadius: 8,
                            padding: "16px 20px",
                            overflow: "auto",
                          }}
                        >
                          {children}
                        </Box>
                      );
                    },
                  }}
                />
              </Text>
            </Flex>
          </StepSection>
          // <div key={step.title}>
          //   <pre>
          //     <code>{JSON.stringify(step, null, 2)}</code>
          //   </pre>
          // </div>
        );
        // return (
        //   <Step
        //     stepNumber={i + 1}
        //     isOpen={openedStep === i + 1}
        //     onOpenStep={() => toggleSetupDrawerStep(i + 1)}
        //     key={`next-step-${i + 1}`}
        //     linkToTroubleshootingDocs={linkToTroubleshootingDocs}
        //     {...{
        //       simulatorUrl,
        //       openedStep,
        //       setupStatus,
        //       userHasAtLeastOneStepMissing,
        //       userHasConfiguredAllSteps,
        //       checkSimulatorSetup,
        //       isCheckingSetup,
        //       stepNumberWithErrors,
        //     }}
        //   />
        // );
      })}
    </div>
  );
}
