import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
  return (
    <div className="">
      <div className="container">
        <div className="bg-secondary text-secondary-foreground rounded-lg shadow-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl opacity-80 mb-8">
            Join thousands of satisfied customers and professional plumbers on our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90">
              <Link href="/register?role=customer">I Need a Plumber</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary bg-transparent">
              <Link href="/register?role=tradesperson">I Am a Plumber</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
