import { RootLayout } from "@/components/RootLayout";
import { RouteError } from "@/components/RouteError";
import NotFoundPage from "@/pages/NotFoundPage";

/** Every page is its own chunk, loaded the first time someone visits it. */
const page = (importer) => ({
  lazy: async () => ({ Component: (await importer()).default }),
});

function BootFallback() {
  return (
    <div className="page-container py-10" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-deco" />
      <div className="mt-6 h-40 max-w-xl animate-pulse rounded-xl bg-deco" />
    </div>
  );
}

export const routes = [
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <RouteError standalone />,
    hydrateFallbackElement: <BootFallback />,
    children: [
      {
        // Pathless wrapper: a crash inside a page shows the error card but keeps the header and footer.
        errorElement: <RouteError />,
        children: [
          { index: true, ...page(() => import("@/pages/HomePage")) },
          { path: "rooms", ...page(() => import("@/pages/RoomsPage")) },
          { path: "rooms/:id", ...page(() => import("@/pages/RoomDetailPage")) },
          { path: "login", ...page(() => import("@/pages/LoginPage")) },
          { path: "signup", ...page(() => import("@/pages/SignupPage")) },
          { path: "verify-phone", ...page(() => import("@/pages/VerifyPhonePage")) },
          { path: "saved", ...page(() => import("@/pages/SavedPage")) },
          { path: "alerts", ...page(() => import("@/pages/AlertsPage")) },
          { path: "verify-student", ...page(() => import("@/pages/VerifyStudentPage")) },
          { path: "report", ...page(() => import("@/pages/ReportPage")) },
          { path: "zones", ...page(() => import("@/pages/ZonesPage")) },
          { path: "safety-tips", ...page(() => import("@/pages/SafetyTipsPage")) },
          { path: "for-caretakers", ...page(() => import("@/pages/ForCaretakersPage")) },
          { path: "how-verification-works", ...page(() => import("@/pages/HowVerificationWorksPage")) },
          { path: "privacy", ...page(() => import("@/pages/PrivacyPage")) },
          { path: "terms", ...page(() => import("@/pages/TermsPage")) },
          { path: "caretaker/login", ...page(() => import("@/pages/CaretakerLoginPage")) },
          { path: "caretaker/signup", ...page(() => import("@/pages/CaretakerSignupPage")) },
          { path: "caretaker/post", ...page(() => import("@/pages/CaretakerPostPage")) },
          { path: "caretaker/listings", ...page(() => import("@/pages/CaretakerListingsPage")) },
          { path: "caretaker/edit/:id", ...page(() => import("@/pages/CaretakerEditPage")) },
          { path: "caretaker/profile", ...page(() => import("@/pages/CaretakerProfilePage")) },
          { path: "admin", ...page(() => import("@/pages/AdminDashboardPage")) },
          { path: "admin/verification", ...page(() => import("@/pages/AdminVerificationPage")) },
          { path: "*", element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
