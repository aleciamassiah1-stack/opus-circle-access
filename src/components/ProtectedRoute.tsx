import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "candidate" | "employer" | "admin";
  requireApproval?: boolean;
}

const ProtectedRoute = ({ children, requiredRole, requireApproval = false }: ProtectedRouteProps) => {
  const { user, loading, hasRole, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-heading text-xl text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && !hasRole(requiredRole)) return <Navigate to="/" replace />;
  if (requireApproval && !isApproved) return <Navigate to="/pending-approval" replace />;

  return <>{children}</>;
};

export default ProtectedRoute;
