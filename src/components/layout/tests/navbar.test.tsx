// import { render, screen } from "@testing-library/react";
// import { Navbar } from "../navbar";
// import { usePathname } from "next/navigation";

// jest.mock("next/navigation", () => ({
//   usePathname: jest.fn()
// }));

// jest.mock("next-auth/react", () => ({
//   signOut: jest.fn()
// }));

// describe("Navbar", () => {
//   it("shows user avatar for authenticated users", () => {
//     (usePathname as jest.Mock).mockReturnValue("/dashboard");
//     const session = {
//       user: { name: "Trades", email: "trade@example.com", role: "tradesperson" }
//     } as any;

//     render(<Navbar session={session} />);
//     expect(screen.getByText("T")).toBeInTheDocument();
//   });

//   it("shows sign in link for unauthenticated users", () => {
//     (usePathname as jest.Mock).mockReturnValue("/");

//     render(<Navbar session={null} />);
//     expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
//   });
// });
import { render, screen } from "@testing-library/react";
import { Navbar } from "../navbar";
import { usePathname } from "next/navigation";
import "@testing-library/jest-dom";

jest.mock("next/navigation", () => ({
  usePathname: jest.fn()
}));

jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
  useSession: () => ({ data: { user: { id: "user1" } } })
}));

jest.mock("@/lib/firebase/client", () => ({
  getFirebaseDb: jest.fn(() => ({})),
  ensureFirebaseAuth: jest.fn(() => Promise.resolve())
}));

jest.mock("firebase/firestore", () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn())
}));

describe("Navbar", () => {
  it("shows user avatar for authenticated users", () => {
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
    const session = {
      user: { name: "Trades", email: "trade@example.com", role: "tradesperson" }
    } as any;

    render(<Navbar session={session} />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("shows sign in link for unauthenticated users", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Navbar session={null} />);
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  });

  it("displays base navigation when auth buttons are visible", () => {
    (usePathname as jest.Mock).mockReturnValue("/");

    render(<Navbar session={null} />);
    const baseNav = screen.getByTestId("base-nav");
    expect(baseNav).toHaveClass("hidden");
    expect(baseNav).toHaveClass("md:flex");
  });
});
