import { useState, useEffect } from 'react';

type ChatLayout = 'mobile' | 'desktop';

export const useChatLayout = (): ChatLayout => {
  const [layout, setLayout] = useState<ChatLayout>('desktop');

  useEffect(() => {
    const checkLayout = () => {
      // Use 768px as the breakpoint between mobile and desktop
      setLayout(window.innerWidth < 768 ? 'mobile' : 'desktop');
    };

    // Check on mount
    checkLayout();

    // Listen for resize events
    window.addEventListener('resize', checkLayout);

    return () => {
      window.removeEventListener('resize', checkLayout);
    };
  }, []);

  return layout;
};
