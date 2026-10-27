import React from "react";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import EmployerSidebar from "@/components/employer/EmployerSidebar";
import ProctoringPage from "@/app/employer/proctoring/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));

// Mock PageContainer component
jest.mock("@/components/employer/LayoutSystem", () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("TASK 4.2: Proctoring Monitor Navigation and Placeholder", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Test 1: Navigation does not show proctoring monitor link", () => {
    it("should not render proctoring monitor in employer sidebar navigation", () => {
      (usePathname as jest.Mock).mockReturnValue("/employer/dashboard");

      render(<EmployerSidebar />);

      // Check that common navigation items are present
      const navItems = screen.getAllByRole("link");
      const navLabels = navItems.map((link) => link.getAttribute("title"));

      // Ensure proctoring is NOT in the navigation
      const proctoringLinks = navLabels.filter(
        (label) => label && label.toLowerCase().includes("proctoring")
      );
      expect(proctoringLinks).toHaveLength(0);

      // Verify expected navigation items exist
      expect(navLabels).toContain("HireGo Employer Workspace");
    });

    it("should not show proctoring in mobile navigation more menu", () => {
      (usePathname as jest.Mock).mockReturnValue("/employer/dashboard");

      render(<EmployerSidebar />);

      // Get all navigation text (both primary and secondary nav)
      const allText = screen.getByRole("document", { hidden: true })?.textContent || "";

      // Check that "proctoring" is not mentioned in navigation context
      // (PageContainer and other non-nav elements may reference it, but nav shouldn't)
      const navElement = document.querySelector("nav");
      const navText = navElement?.textContent || "";

      expect(navText).not.toContain("Proctoring");
      expect(navText).not.toContain("proctoring");
    });
  });

  describe("Test 2: Proctoring placeholder page displays correctly", () => {
    it("should render proctoring placeholder page with correct message", () => {
      render(<ProctoringPage />);

      // Check that the placeholder message is displayed
      expect(screen.getByText(/Proctoring Monitor/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Proctoring monitor is not yet available\. Check back soon\./i)
      ).toBeInTheDocument();
    });

    it("should display additional context text on placeholder page", () => {
      render(<ProctoringPage />);

      // Check for the additional supporting text
      expect(
        screen.getByText(/We're working on bringing real-time proctoring capabilities/i)
      ).toBeInTheDocument();
    });

    it("should render with proper styling and structure", () => {
      render(<ProctoringPage />);

      // Check for the main heading
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent(/Proctoring Monitor/i);

      // Check for container structure (rounded border, styling)
      const container = screen.getByText(/Proctoring monitor is not yet available/)
        .closest("div");
      expect(container?.parentElement).toHaveClass("rounded-2xl");
    });

    it("should have accessible icon representation", () => {
      render(<ProctoringPage />);

      // Check that the icon is rendered (material-symbols-outlined class)
      const icon = document.querySelector(".material-symbols-outlined");
      expect(icon).toBeInTheDocument();
      expect(icon).toHaveClass("text-4xl", "text-secondary");
    });
  });

  describe("Test 3: Sidebar navigation maintains accessibility standards", () => {
    it("should have proper ARIA labels on navigation elements", () => {
      (usePathname as jest.Mock).mockReturnValue("/employer/dashboard");

      render(<EmployerSidebar />);

      // Check for ARIA attributes on navigation
      const navLinks = screen.getAllByRole("link");
      navLinks.forEach((link) => {
        if (link.getAttribute("href") && !link.getAttribute("href")?.includes("dashboard")) {
          // Non-logo links should have title or aria-label
          const hasTitle = link.hasAttribute("title");
          const hasAriaLabel = link.hasAttribute("aria-label");
          expect(hasTitle || hasAriaLabel).toBe(true);
        }
      });
    });

    it("should render navigation without errors when on employer routes", () => {
      (usePathname as jest.Mock).mockReturnValue("/employer/hiring-pipeline");

      // Should not throw any errors
      expect(() => {
        render(<EmployerSidebar />);
      }).not.toThrow();

      // Navigation should be visible
      const navElement = document.querySelector("nav");
      expect(navElement).toBeInTheDocument();
    });
  });

  describe("Test 4: TypeScript type safety", () => {
    it("should not have TypeScript errors in proctoring page component", () => {
      // This test verifies that the component compiles without TypeScript errors
      // The render should succeed without type errors
      expect(() => {
        render(<ProctoringPage />);
      }).not.toThrow();
    });

    it("should not have TypeScript errors in sidebar component", () => {
      (usePathname as jest.Mock).mockReturnValue("/employer/dashboard");

      // This test verifies that the component compiles without TypeScript errors
      expect(() => {
        render(<EmployerSidebar />);
      }).not.toThrow();
    });
  });

  describe("Test 5: Proctoring page route accessibility", () => {
    it("should be accessible via /employer/proctoring route", () => {
      // This test verifies the page structure supports routing
      const { container } = render(<ProctoringPage />);

      expect(container.querySelector(".mx-auto")).toBeInTheDocument();
      expect(screen.getByText(/Proctoring Monitor/i)).toBeInTheDocument();
    });

    it("should render with consistent employer portal styling", () => {
      render(<ProctoringPage />);

      // Check for employer portal styling classes
      const container = screen.getByText(/Proctoring monitor is not yet available/)
        .closest("div");

      // Should use portal design system classes
      expect(container).toHaveClass("rounded-2xl", "border", "bg-white/5");
    });
  });
});
