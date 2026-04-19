import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

const authState = {
  user: null as null | { id: string },
  loading: false,
  hasRole: (_r: string) => false,
  isApproved: false,
};
const subState = { isActive: false, loading: false };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));
vi.mock("@/hooks/useSubscription", () => ({
  useSubscription: () => subState,
}));

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="candidate" requireApproval requireSubscription>
              <div>Candidate Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employer"
          element={
            <ProtectedRoute requiredRole="employer" requireApproval requireSubscription>
              <div>Employer Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/membership" element={<div>Membership Page</div>} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/pending-approval" element={<div>Pending Approval</div>} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>,
  );

describe("ProtectedRoute paywall", () => {
  beforeEach(() => {
    authState.user = { id: "u1" };
    authState.loading = false;
    authState.isApproved = true;
    authState.hasRole = () => false;
    subState.isActive = false;
    subState.loading = false;
  });

  it("redirects unpaid candidate from /dashboard to /membership", () => {
    authState.hasRole = (r) => r === "candidate";
    renderAt("/dashboard");
    expect(screen.getByText("Membership Page")).toBeInTheDocument();
  });

  it("redirects unpaid employer from /employer to /membership", () => {
    authState.hasRole = (r) => r === "employer";
    renderAt("/employer");
    expect(screen.getByText("Membership Page")).toBeInTheDocument();
  });

  it("allows paid candidate into /dashboard", () => {
    authState.hasRole = (r) => r === "candidate";
    subState.isActive = true;
    renderAt("/dashboard");
    expect(screen.getByText("Candidate Dashboard")).toBeInTheDocument();
  });

  it("allows paid employer into /employer", () => {
    authState.hasRole = (r) => r === "employer";
    subState.isActive = true;
    renderAt("/employer");
    expect(screen.getByText("Employer Dashboard")).toBeInTheDocument();
  });

  it("allows admin without subscription into /employer", () => {
    authState.hasRole = (r) => r === "employer" || r === "admin";
    renderAt("/employer");
    expect(screen.getByText("Employer Dashboard")).toBeInTheDocument();
  });

  it("redirects unapproved user to /pending-approval before paywall", () => {
    authState.hasRole = (r) => r === "candidate";
    authState.isApproved = false;
    renderAt("/dashboard");
    expect(screen.getByText("Pending Approval")).toBeInTheDocument();
  });

  it("redirects unauthenticated user to /login", () => {
    authState.user = null;
    renderAt("/dashboard");
    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
});
