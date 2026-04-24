import React from "react";
import ChatThreadScreen from "@/src/features/screens/shared/ChatThreadScreen";

export default function BuyerChatScreen(props: any) {
  const route = props.route ?? {};
  const mergedRoute = {
    ...route,
    params: { ...(route.params ?? {}), tabBarHeight: 0 },
  };

  return <ChatThreadScreen {...props} route={mergedRoute} />;
}
