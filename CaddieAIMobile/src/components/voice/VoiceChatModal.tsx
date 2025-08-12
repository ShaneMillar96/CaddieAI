import React from 'react';
import { VoiceChatModalV2 } from './VoiceChatModalV2';

// Backward compatibility wrapper - routes to V2 implementation
export interface VoiceChatModalProps {
  visible: boolean;
  onClose: () => void;
  roundId: number;
}

export const VoiceChatModal: React.FC<VoiceChatModalProps> = (props) => {
  return <VoiceChatModalV2 {...props} />;
};

export default VoiceChatModal;