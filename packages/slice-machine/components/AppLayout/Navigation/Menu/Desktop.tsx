import React from "react";
import {
  Box,
  Divider,
  Heading,
  Paragraph,
  Button,
  Flex,
  Close,
} from "theme-ui";
import { MdPlayCircleFilled } from "react-icons/md";
import ItemsList from "./Navigation/List";
import Logo from "../Menu/Logo";
import { LinkProps } from "..";

import NotLoggedIn from "./Navigation/NotLoggedIn";

import { warningStates } from "@lib/consts";

import { useSelector } from "react-redux";
import { getChangelog, getWarnings } from "@src/modules/environment";
import {
  getUpdatesViewed,
  userHasViewedVideosToolTip,
} from "@src/modules/userContext";
import { SliceMachineStoreType } from "@src/redux/type";
import useSliceMachineActions from "@src/modules/useSliceMachineActions";
import { useRouter } from "next/router";
import WarningItem from "./Navigation/WarningItem";
import Item from "./Navigation/Item";
import ReactTooltip from "react-tooltip";

const UpdateInfo: React.FC<{
  onClick: () => void;
  hasSeenUpdate: boolean;
}> = ({ onClick, hasSeenUpdate }) => {
  return (
    <Flex
      sx={{
        maxWidth: "240px",
        border: "1px solid #E6E6EA",
        borderRadius: "4px",
        padding: "8px",
        flexDirection: "column",
      }}
    >
      <Heading
        as="h6"
        sx={{
          fontSize: "14px",
          margin: "4px 8px",
        }}
      >
        Updates Available{" "}
        {hasSeenUpdate || (
          <span
            data-testid="the-red-dot"
            style={{
              borderRadius: "50%",
              width: "8px",
              height: "8px",
              backgroundColor: "#FF4A4A",
              display: "inline-block",
              margin: "4px",
            }}
          />
        )}
      </Heading>
      <Paragraph
        sx={{
          fontSize: "14px",
          color: "#4E4E55",
          margin: "4px 8px 8px",
        }}
      >
        Some updates of Slice Machine are available.
      </Paragraph>
      <Button
        data-testid="update-modal-open"
        sx={{
          background: "#5B3DF5",
          border: "1px solid rgba(62, 62, 72, 0.15)",
          boxSizing: "border-box",
          borderRadius: "4px",
          margin: "8px",
          fontSize: "11.67px",
          alignSelf: "flex-start",
          padding: "4px 8px",
        }}
        onClick={onClick}
      >
        Learn more
      </Button>
    </Flex>
  );
};

const VideoInfo: React.FC<{ showToolTip: boolean }> = ({ showToolTip }) => {
  const ref = React.createRef<HTMLParagraphElement>();
  const id = "nav-tool-tip";

  const [isOpen, setOpen] = React.useState(showToolTip);

  const handleClose = () => {
    setOpen(false);
  };

  React.useEffect(() => {
    ReactTooltip.rebuild();
    if (isOpen && ref.current) {
      ReactTooltip.show(ref.current);
    }
  }, []);

  return (
    <>
      <Item
        ref={ref}
        data-for={id}
        data-tip=""
        link={{
          title: "Video tutorials",
          Icon: MdPlayCircleFilled,
          href: "https://youtube.com",
          target: "_blank",
          match: () => false,
        }}
        theme={"emphasis"}
      />
      <ReactTooltip
        id={id}
        effect="solid"
        backgroundColor="#5B3DF5"
        clickable={true}
        getContent={() =>
          isOpen ? (
            <Flex
              data-testid="video-tooltip"
              sx={{
                maxWidth: "300px",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Paragraph sx={{ color: "#FFF", fontWeight: 700 }}>
                Need Help?
              </Paragraph>
              <Close
                data-testid="video-tooltip-close-button"
                onClick={handleClose}
              />
              <Paragraph sx={{ color: "#FFF", fontWeight: 400 }}>
                Follow our Quick Start guide to learn the basics of Slice
                Machine
              </Paragraph>
            </Flex>
          ) : undefined
        }
      />
    </>
  );
};

const Desktop: React.FunctionComponent<{ links: LinkProps[] }> = ({
  links,
}) => {
  const { warnings, changelog, updatesViewed, viewedVideosToolTip } =
    useSelector((store: SliceMachineStoreType) => ({
      warnings: getWarnings(store),
      changelog: getChangelog(store),
      updatesViewed: getUpdatesViewed(store),
      viewedVideosToolTip: userHasViewedVideosToolTip(store),
    }));

  const { setUpdatesViewed } = useSliceMachineActions();

  const latestVersion =
    changelog.versions.length > 0 ? changelog.versions[0] : null;

  const hasSeenLatestUpdates =
    updatesViewed &&
    updatesViewed.latest === latestVersion?.versionNumber &&
    updatesViewed.latestNonBreaking === changelog.latestNonBreakingVersion;

  const isNotLoggedIn = !!warnings.find(
    (e) => e.key === warningStates.NOT_CONNECTED
  );

  const router = useRouter();

  return (
    <Box as="aside" bg="sidebar" sx={{ minWidth: "270px", display: "flex" }}>
      <Box
        sx={{
          p: "40px 20px 20px",
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        <Logo />
        <ItemsList mt={4} links={links} sx={{ flex: "1" }} />
        <Box>
          {changelog.updateAvailable && (
            <UpdateInfo
              onClick={() => {
                setUpdatesViewed({
                  latest: latestVersion && latestVersion.versionNumber,
                  latestNonBreaking: changelog.latestNonBreakingVersion,
                });
                return router.push("/changelog");
              }}
              hasSeenUpdate={hasSeenLatestUpdates}
            />
          )}
          {isNotLoggedIn && <NotLoggedIn />}

          <VideoInfo showToolTip={!viewedVideosToolTip} />
          <Divider variant="sidebar" />
          <WarningItem currentVersion={changelog.currentVersion} />
        </Box>
      </Box>
    </Box>
  );
};

export default Desktop;
