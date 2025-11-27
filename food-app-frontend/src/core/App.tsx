
import React from 'react';
import {BrowserRouter as Router} from 'react-router-dom';
import AppRoutes from '../routes/AppRoutes';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../styles/App.css';
import '../styles/index.css';
import ErrorBoundary from "@/components/ErrorBoundary.tsx";
import {AuthProvider} from "@/context/AuthContext.tsx";
import {MealProvider} from "@/context/MealContext.tsx";
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
                  <MealProvider>
                      <VendorProvider>
                          <ErrorBoundary>
                              <Router>
                                  <div className="App min-h-screen bg-background">
                                      <AppRoutes />
                                  </div>
                              </Router>
                          </ErrorBoundary>
                      </VendorProvider>
                  </MealProvider>
              </AuthProvider>
          </QueryClientProvider>
      </ErrorBoundary>
     
  )
}

export default App
