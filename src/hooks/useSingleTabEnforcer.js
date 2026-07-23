import { useEffect, useState } from "react";

export const useSingleTabEnforcer = () => {
  const [isDuplicateTab, setIsDuplicateTab] = useState(false);

  useEffect(() => {
    const channel = new BroadcastChannel("work_session_channel");

    channel.onmessage = (event) => {
      if (event.data === "NEW_TAB_OPENED")
        channel.postMessage("ALREADY_ACTIVE");
      if (event.data === "ALREADY_ACTIVE") setIsDuplicateTab(true);
      if (event.data === "STEAL_SESSION") setIsDuplicateTab(true); // Yield to the other tab
    };

    channel.postMessage("NEW_TAB_OPENED");
    return () => channel.close();
  }, []);

  const claimSession = () => {
    const channel = new BroadcastChannel("work_session_channel");
    channel.postMessage("STEAL_SESSION");
    setIsDuplicateTab(false);
    channel.close();
  };

  return { isDuplicateTab, claimSession };
};
