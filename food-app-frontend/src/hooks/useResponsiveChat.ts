import { useState, useEffect } from 'react';

export type ChatMode = 'desktop' | 'tablet' | 'mobile';

export const useResponsiveChat = () => {
  const [chatMode, setChatMode] = useState<ChatMode>('desktop');

  useEffect(() => {
    const updateChatMode = () => {
      const width = window.innerWidth;
      if (width >= 1024) {
        setChatMode('desktop');
      } else if (width >= 768) {
        setChatMode('tablet');
      } else {
        setChatMode('mobile');
      }
    };

    // Set initial mode
    updateChatMode();

    // Listen for resize events
    window.addEventListener('resize', updateChatMode);
    
    return () => window.removeEventListener('resize', updateChatMode);
  }, []);

  return chatMode;
};