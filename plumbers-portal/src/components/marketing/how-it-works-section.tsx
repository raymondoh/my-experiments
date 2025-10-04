import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, MessageSquare, CheckCircle } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <div className="">
      <div className="container">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-lg text-muted-foreground">Get your plumbing sorted in three simple steps.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary dark:bg-secondary rounded-full flex items-center justify-center mb-4">
                <Pencil className="h-8 w-8" />
              </div>
              <CardTitle>1. Post Your Job</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Describe the work you need done. It's free and takes just a few minutes.
              </p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary dark:bg-secondary rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8" />
              </div>
              <CardTitle>2. Get Quotes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Receive competitive quotes from local, verified tradespeople.</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader>
              <div className="mx-auto w-16 h-16 bg-primary/10 text-primary dark:bg-secondary rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8" />
              </div>
              <CardTitle>3. Hire the Best</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Compare profiles and reviews to choose the right professional for your job.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
