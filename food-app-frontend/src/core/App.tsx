
import React from 'react';
import {BrowserRouter as Router} from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/App.css';
import '../styles/index.css';
import ErrorBoundary from "@/components/ErrorBoundary.tsx";
import {AuthProvider} from "@/context/AuthContext.tsx";
import {CartProvider} from "@/context/CartContext.tsx";
import {VendorProvider} from "@/context/VendorContext.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
function App() {

  return (
      <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
              <AuthProvider>
                  <CartProvider>
                      <VendorProvider>
                          <ErrorBoundary>
                              <Router>
                                  <div className="App min-h-screen bg-background">
                                      <AppRoutes />
                                  </div>
                              </Router>
                          </ErrorBoundary>
                      </VendorProvider>
                  </CartProvider>
              </AuthProvider>
          </QueryClientProvider>
      </ErrorBoundary>
     
  )
}

export default App
