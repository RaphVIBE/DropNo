import React from "react";
import { Composition } from "remotion";
import { Video, TOTAL } from "./Video";
import { Walkthrough, WALKTHROUGH_FRAMES } from "./site/Walkthrough";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="DropNoAITalk"
        component={Video}
        durationInFrames={TOTAL}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Le screencast reconstitué à glisser dans le deck. */}
      <Composition
        id="SiteWalkthrough"
        component={Walkthrough}
        durationInFrames={WALKTHROUGH_FRAMES}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
