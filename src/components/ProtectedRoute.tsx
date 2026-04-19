import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "candidate" | "employer" | "admin";
  requireApproval?: boolean;
  requireSubscription?: boolean;
}

const ProtectedRoute = ({
  children,
  requiredRole,
  requireApproval = false,
  requireSubscription = false,
}: ProtectedRouteProps) => {
  const { user, loading, hasRole, isApproved } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();

  if (loading || (requireSubscription && subLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-heading text-xl text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && !hasRole(requiredRole)) return <Navigate to="/" replace />;
  if (requireApproval && !isApproved) return <Navigate to="/pending-approval" replace />;
  if (requireSubscription && !isActive && !hasRole("admin")) {
    return <Navigate to="/membership" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
