import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { NativeNavigationBridge } from "./components/mobile/NativeNavigationBridge";
import { PushNotificationRegistrar } from "./hooks/usePushNotifications";
import { NativeKeyboardBridge } from "./hooks/useNativeKeyboard";
import { PaymentTestModeBanner } from "./components/PaymentTestModeBanner";
import InstallPWAPrompt from "./components/InstallPWAPrompt";

const queryClient = new QueryClient();

const Index = lazy(() => import("./pages/Index"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Membership = lazy(() => import("./pages/Membership"));
const Contact = lazy(() => import("./pages/Contact"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const TalentDashboard = lazy(() => import("./pages/TalentDashboard"));
const EmployerDashboard = lazy(() => import("./pages/EmployerDashboard"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LaunchFallback = () => (
  <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6 font-body">
    <div className="h-8 w-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" aria-label="Loading" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ScrollToTop />
          <NativeNavigationBridge />
          <PushNotificationRegistrar />
          <NativeKeyboardBridge />
          <PaymentTestModeBanner />
          <InstallPWAPrompt />
          <Suspense fallback={<LaunchFallback />}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/membership" element={<Membership />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/return" element={<CheckoutReturn />} />
              <Route
                path="/talent"
                element={
                  <ProtectedRoute requiredRole="candidate" requireApproval requireSubscription>
                    <TalentDashboard />
                  </ProtectedRoute>
                }
              />
              {/* Backwards-compat: old /dashboard URL still works */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="candidate" requireApproval requireSubscription>
                    <TalentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employer"
                element={
                  <ProtectedRoute requiredRole="employer" requireApproval requireSubscription>
                    <EmployerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
