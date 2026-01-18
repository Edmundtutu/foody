import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useOrderStore } from '@/services/orderService';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [status, setStatus] = useState('Initializing...');
  const initializeRider = useOrderStore((state) => state.initializeRider);
  const loadOrders = useOrderStore((state) => state.loadOrders);

  useEffect(() => {
    const initialize = async () => {
      try {
        setStatus('Loading rider profile...');
        initializeRider();

        await new Promise((resolve) => setTimeout(resolve, 800));

        setStatus('Loading mock orders...');
        loadOrders();

        await new Promise((resolve) => setTimeout(resolve, 800));

        setStatus('Ready to deliver!');

        await new Promise((resolve) => setTimeout(resolve, 500));

        onComplete();
      } catch (error) {
        setStatus('Initialization error');
        console.error('Splash screen error:', error);
      }
    };

    initialize();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>Delivery Agent</Text>
        <Text style={styles.tagline}>Demo v1.0</Text>

        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.status}>{status}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1e40af',
  },
  tagline: {
    fontSize: 14,
    color: '#64748b',
  },
  loaderContainer: {
    gap: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  status: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
});
