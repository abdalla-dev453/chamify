import { Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "../features/auth/LoginPage.jsx";
import RegisterPage from "../features/auth/RegisterPage.jsx";
import OnboardingPage from "../features/onboarding/OnboardingPage.jsx";
import DashboardPage from "../features/dashboard/DashboardPage.jsx";
import WalletsPage from "../features/wallets/WalletsPage.jsx";
import SavingsPage from "../features/savings/SavingsPage.jsx";
import LoansPage from "../features/loans/LoansPage.jsx";
import GovernancePage from "../features/governance/GovernancePage.jsx";
import CompliancePage from "../features/compliance/CompliancePage.jsx";
import BillingPage from "../features/billing/BillingPage.jsx";
import AdminOverviewPage from "../features/admin/AdminOverviewPage.jsx";

import DashboardLayout from "./layout/DashboardLayout.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/wallets" element={<WalletsPage />} />
        <Route path="/savings" element={<SavingsPage />} />
        <Route path="/loans" element={<LoansPage />} />
        <Route path="/governance" element={<GovernancePage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["system_admin"]}>
              <AdminOverviewPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}