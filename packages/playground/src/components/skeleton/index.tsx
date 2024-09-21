import "./index.css";
import { CSSProperties, FC } from "react";

interface ISkeletonProps {
  width: number | string;
  height?: number | string;
  Tag?: keyof JSX.IntrinsicElements;
  className?: string;
  style?: CSSProperties;
}

export const Skeleton: FC<ISkeletonProps> = ({
  width,
  height = 24,
  Tag = "div",
  className = "",
  style,
}) => (
  <Tag
    className={`skeleton ${className}`}
    style={{ width, height, ...style }}
  />
);
