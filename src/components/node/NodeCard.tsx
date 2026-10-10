import { memo } from "react";
import { CompactNodeCard } from "./CompactNodeCard";

export const NodeCard = memo(function NodeCard(props: {
  uuid: string;
  showTodayTraffic?: boolean;
}) {
  return <CompactNodeCard {...props} size="large" />;
});
