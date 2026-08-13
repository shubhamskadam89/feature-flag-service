import React from 'react';
import { ActivationScene } from './ActivationScene';

interface RollbackSceneProps {
  flagEnabled: boolean;
}

export const RollbackScene: React.FC<RollbackSceneProps> = ({ flagEnabled }) => {
  return <ActivationScene flagEnabled={flagEnabled} />;
};
