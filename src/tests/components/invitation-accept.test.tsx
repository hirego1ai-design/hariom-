import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter, useSearchParams } from "next/navigation";
import InvitationAcceptPage from "@/app/employer/invitation/accept/page";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

describe("Invitation Accept Page", () => {
  const mockPush = jest.fn();
  const mockToken = "a".repeat(64);

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue(
      new URLSearchParams({ token: mockToken })
    );
  });

  describe("TC-P0.3.1: Unauthenticated user can access page with valid token", () => {
    it("should render the invitation acceptance form for unauthenticated users", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          id: "inv-123",
          company: { name: "Acme Corp" },
          role: "RECRUITER",
          email: "user@example.com",
          name: "John Doe",
        }),
      });

      render(<InvitationAcceptPage />);

      await waitFor(() => {
        expect(screen.getByText(/Accept Team Invitation/i)).toBeInTheDocument();
      });

      expect(
        screen.getByText(/You are invited to join Acme Corp as a RECRUITER/i)
      ).toBeInTheDocument();
    });
  });

  describe("TC-P0.3.2: Invalid token shows error message", () => {
    it("should display error for invalid token format", async () => {
      (useSearchParams as jest.Mock).mockReturnValue(
        new URLSearchParams({ token: "invalid" })
      );

      render(<InvitationAcceptPage />);

      await waitFor(() => {
        expect(screen.getByText(/Invalid invitation token format/i)).toBeInTheDocument();
      });
    });

    it("should display error for 404 (invalid token)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Invalid invitation token." }),
      });

      render(<InvitationAcceptPage />);

      await waitFor(() => {
        expect(screen.getByText(/Invalid invitation token/i)).toBeInTheDocument();
      });
    });

    it("should display error for 410 (expired token)", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 410,
        json: async () => ({ error: "This invitation has expired." }),
      });

      render(<InvitationAcceptPage />);

      await waitFor(() => {
        expect(
          screen.getByText(/This invitation has expired or was already used/)
        ).toBeInTheDocument();
      });
    });
  });

  describe("TC-P0.3.3: Valid token renders acceptance form", () => {
    it("should render form fields with company name and role", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          id: "inv-123",
          company: { name: "Tech Startup" },
          role: "EMPLOYER",
          email: "admin@startup.com",
          name: "Jane Smith",
        }),
      });

      render(<InvitationAcceptPage />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Set Password/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      });

      expect(screen.getByDisplayValue("Jane Smith")).toBeInTheDocument();
      expect(
        screen.getByText(/Tech Startup.*EMPLOYER/i)
      ).toBeInTheDocument();
    });

    it("should validate password requirements", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          id: "inv-123",
          company: { name: "Tech Startup" },
          role: "RECRUITER",
          email: "user@startup.com",
          name: "",
        }),
      });

      render(<InvitationAcceptPage />);

      const nameInput = await screen.findByLabelText(/Full Name/i);
      const passwordInput = await screen.findByLabelText(/Set Password/i);
      const confirmInput = await screen.findByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole("button", {
        name: /Accept Invitation/i,
      });

      // Test password too short
      await userEvent.type(nameInput, "Test User");
      await userEvent.type(passwordInput, "pass123");
      await userEvent.type(confirmInput, "pass123");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });

    it("should require letters and numbers in password", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          id: "inv-123",
          company: { name: "Tech Startup" },
          role: "RECRUITER",
          email: "user@startup.com",
          name: "",
        }),
      });

      render(<InvitationAcceptPage />);

      const nameInput = await screen.findByLabelText(/Full Name/i);
      const passwordInput = await screen.findByLabelText(/Set Password/i);
      const confirmInput = await screen.findByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole("button", {
        name: /Accept Invitation/i,
      });

      await userEvent.type(nameInput, "Test User");
      await userEvent.type(passwordInput, "password");
      await userEvent.type(confirmInput, "password");
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password must contain both letters and numbers/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("TC-P0.3.4: Accept button submits API request and redirects", () => {
    it("should submit form data and redirect on success", async () => {
      const mockAcceptResponse = {
        ok: true,
        json: async () => ({
          success: true,
          message: "Invitation accepted successfully!",
          companyName: "Acme Corp",
        }),
      };

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            id: "inv-123",
            company: { name: "Acme Corp" },
            role: "RECRUITER",
            email: "user@example.com",
            name: "John Doe",
          }),
        })
        .mockResolvedValueOnce(mockAcceptResponse);

      render(<InvitationAcceptPage />);

      const nameInput = await screen.findByLabelText(/Full Name/i);
      const passwordInput = await screen.findByLabelText(/Set Password/i);
      const confirmInput = await screen.findByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole("button", {
        name: /Accept Invitation/i,
      });

      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, "John Doe");
      await userEvent.type(passwordInput, "StrongPass123");
      await userEvent.type(confirmInput, "StrongPass123");

      fireEvent.click(submitButton);

      // Check that the API was called with correct data
      await waitFor(() => {
        const acceptCall = (global.fetch as jest.Mock).mock.calls.find(
          (call) => call[0] === "/api/employer/team/accept"
        );
        expect(acceptCall).toBeDefined();
        expect(acceptCall[1].body).toContain("StrongPass123");
      });

      // Check success message
      await waitFor(() => {
        expect(
          screen.getByText(/Invitation accepted successfully/i)
        ).toBeInTheDocument();
      });

      // Check redirect
      await waitFor(
        () => {
          expect(mockPush).toHaveBeenCalledWith("/employer/dashboard");
        },
        { timeout: 3000 }
      );
    });

    it("should show error message on API failure", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            success: true,
            id: "inv-123",
            company: { name: "Acme Corp" },
            role: "RECRUITER",
            email: "user@example.com",
            name: "John Doe",
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: async () => ({
            error: "This user is already a member of your company team.",
          }),
        });

      render(<InvitationAcceptPage />);

      const nameInput = await screen.findByLabelText(/Full Name/i);
      const passwordInput = await screen.findByLabelText(/Set Password/i);
      const confirmInput = await screen.findByLabelText(/Confirm Password/i);
      const submitButton = screen.getByRole("button", {
        name: /Accept Invitation/i,
      });

      await userEvent.type(nameInput, "John Doe");
      await userEvent.type(passwordInput, "StrongPass123");
      await userEvent.type(confirmInput, "StrongPass123");

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/This user is already a member of your company team/)
        ).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
