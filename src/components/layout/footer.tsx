import React from "react";
import { Wrench } from "lucide-react";
import Link from "next/link";
import { CITIES, POPULAR_SERVICES } from "@/lib/config/locations";
import { toSlug } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 border-t">
      <div className="max-w-7xl mx-auto">
        {/* --- Main Footer Links --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Column 1: Branding */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <Wrench className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold text-foreground">Plumbers Portal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The trusted platform connecting customers with professional plumbers.
            </p>
          </div>

          {/* Column 2: For Customers */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">For Customers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/how-it-works" className="hover:text-foreground">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/emergency" className="hover:text-foreground">
                  Emergency Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: For Plumbers */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">For Plumbers</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/join-our-network" className="hover:text-foreground">
                  Join Our Network
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/resources" className="hover:text-foreground">
                  Resources
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-foreground">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* --- Dynamic SEO Links --- */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Popular Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                {POPULAR_SERVICES.slice(0, 6).map(service => (
                  <li key={service}>
                    <Link href={`/plumbers/london/${toSlug(service)}`} className="hover:text-foreground">
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-foreground">Popular Cities</h3>
              <ul className="space-y-2 text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                {CITIES.slice(0, 6).map(city => (
                  <li key={city}>
                    <Link href={`/plumbers/${toSlug(city)}`} className="hover:text-foreground">
                      Plumbers in {city}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* --- Copyright --- */}
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Plumbers Portal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
