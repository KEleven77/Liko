import { memo } from "react";
import { CompactNodeCard } from "./CompactNodeCard";

export const MiniNodeCard = memo(function MiniNodeCard(props: {
  uuid: string;
  showTodayTraffic?: boolean;
}) {
  return <CompactNodeCard {...props} size="mini" />;
});
