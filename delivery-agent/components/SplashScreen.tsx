import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Truck, Navigation } from 'lucide-react-native';
import { useOrderStore } from '@/services/orderService';
import { apiService } from '@/services/apiService';
import { Colors, Typography, Spacing } from '@/constants/theme';

const AUTH_TOKEN_KEY = 'auth_token';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const router = useRouter();
  const initializeRider = useOrderStore((state) => state.initializeRider);
  const loadOrders = useOrderStore((state) => state.loadOrders);

  // Animations
  const logoScale = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const statusOpacity = useRef(new Animated.Value(0)).current;

  // Status state
  const [status, setStatus] = React.useState('Initializing...');
  const [progress, setProgress] = React.useState(0);
  
  // Track if initialization has started to prevent re-runs
  const initializationStarted = useRef(false);
  const isNavigating = useRef(false);

  useEffect(() => {
    // Start logo animations
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Content fade in
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 400,
      delay: 400,
      useNativeDriver: true,
    }).start();

    // Status text fade in
    Animated.timing(statusOpacity, {
      toValue: 1,
      duration: 300,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  useEffect(() => {
    // Prevent multiple initializations
    if (initializationStarted.current || isNavigating.current) {
      return;
    }
    
    initializationStarted.current = true;
    
    const initialize = async () => {
      try {
        // Step 1: Check for authentication token
        setStatus('Checking authentication...');
        setProgress(10);
        
        await apiService.init();
        const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        console.log('[SplashScreen] Token check:', { hasToken: !!token });
        
        if (!token) {
          // No token - navigate to login screen
          setStatus('Authentication required');
          setProgress(100);
          await new Promise((resolve) => setTimeout(resolve, 500));
          
          isNavigating.current = true;
          // Call onComplete FIRST to update RootLayout state before navigation
          onComplete();
          
          Animated.parallel([
            Animated.timing(logoOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(contentOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            router.replace('/(auth)/login');
          });
          return;
        }

        // Step 2: Load rider profile
        setStatus('Loading rider profile...');
        setProgress(30);
        await initializeRider();
        
        // Check if rider initialization failed
        const riderState = useOrderStore.getState().rider;
        const errorState = useOrderStore.getState().error;
        
        if (!riderState) {
          // If authentication error, navigate to login
          if (errorState?.includes('Not authenticated') || errorState?.includes('401')) {
            console.log('[SplashScreen] Auth error - redirecting to login');
            setStatus('Session expired');
            setProgress(100);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            
            // Clear invalid token
            await apiService.clearToken();
            
            isNavigating.current = true;
            // Call onComplete FIRST to update RootLayout state before navigation
            onComplete();
            
            Animated.parallel([
              Animated.timing(logoOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
              Animated.timing(contentOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]).start(() => {
              router.replace('/(auth)/login');
            });
            return;
          }
          
          // Other errors - show error screen
          console.log('[SplashScreen] Initialization failed:', errorState);
          setStatus(errorState || 'Failed to load profile');
          await new Promise((resolve) => setTimeout(resolve, 2000));
          onComplete();
          return;
        }
        
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Step 3: Load orders
        setStatus('Fetching assigned orders...');
        setProgress(60);
        await loadOrders();
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Step 4: Check permissions
        setStatus('Checking GPS permissions...');
        setProgress(80);
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Step 5: Ready
        setStatus('Ready to deliver!');
        setProgress(100);
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Fade out and complete
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(contentOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onComplete();
        });
      } catch (error) {
        console.error('[SplashScreen] Initialization error:', error);
        setStatus('Initialization error');
        await new Promise((resolve) => setTimeout(resolve, 2000));
        onComplete();
      }
    };

    initialize();
    
    // Cleanup function - only reset if we're not navigating
    return () => {
      if (!isNavigating.current) {
        initializationStarted.current = false;
      }
    };
  }, []); // Remove router from dependencies - it shouldn't change

  // Animate progress bar
  useEffect(() => {
    Animated.timing(progressWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <View style={styles.container}>
      {/* Background decoration circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.iconWrapper,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.iconBackground}>
              <Truck size={48} color="#ffffff" strokeWidth={2} />
            </View>
          </Animated.View>

          <Text style={styles.appName}>Delivery Agent</Text>
          <Text style={styles.tagline}>Fast & Reliable Deliveries</Text>
        </Animated.View>

        {/* Status and Progress */}
        <Animated.View style={[styles.statusContainer, { opacity: contentOpacity }]}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth.interpolate({
                      inputRange: [0, 100],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>

          <Animated.View style={[styles.statusRow, { opacity: statusOpacity }]}>
            <Navigation size={16} color={Colors.primary[500]} />
            <Text style={styles.status}>{status}</Text>
          </Animated.View>
        </Animated.View>

        {/* Version */}
        <Animated.Text style={[styles.version, { opacity: contentOpacity }]}>
          v1.0.0
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  bgCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.primary[100],
    opacity: 0.5,
  },
  bgCircle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: Colors.primary[50],
    opacity: 0.7,
  },
  bgCircle3: {
    position: 'absolute',
    top: '40%',
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.success[100],
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 64,
  },
  iconWrapper: {
    marginBottom: Spacing.xl,
  },
  iconBackground: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary[500],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  appName: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.slate[900],
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.fontSize.md,
    color: Colors.slate[500],
    marginTop: Spacing.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  statusContainer: {
    width: '100%',
    maxWidth: 280,
    alignItems: 'center',
  },
  progressContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.base,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.slate[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary[500],
    borderRadius: 3,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.slate[500],
    width: 36,
    textAlign: 'right',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  status: {
    fontSize: Typography.fontSize.base,
    color: Colors.slate[600],
    fontWeight: Typography.fontWeight.medium,
  },
  version: {
    position: 'absolute',
    bottom: Spacing['2xl'],
    fontSize: Typography.fontSize.sm,
    color: Colors.slate[400],
    fontWeight: Typography.fontWeight.medium,
  },
});
