import './index.css';
import { FC } from 'react';

interface ISkeletonProps {
  width: number;
  height?: number;
}

export const Skeleton: FC<ISkeletonProps> = ({ width, height = 32 }) => (
  <div className="skeleton" style={{ width, height }}></div>
);
