// // src/components/search/tradesperson-results.tsx

// import Link from "next/link";
// import Image from "next/image";
// import React from "react";
// import { Star, MapPin } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import type { User } from "@/lib/types/user";
// import { AdComponent } from "./ad-component";
// import { CertificationBadge } from "@/components/certifications/certification-badge";

// interface TradespersonResultsProps {
//   tradespeople: User[];
// }

// export function TradespersonResults({ tradespeople }: TradespersonResultsProps) {
//   if (tradespeople.length === 0) {
//     return <p className="text-center text-muted-foreground">No tradespeople were found.</p>;
//   }

//   const resultsWithAds: React.ReactNode[] = [];

//   tradespeople.forEach((plumber, index) => {
//     const subjectTier = (plumber.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
//     const canShowBadges = subjectTier === "pro" || subjectTier === "business";
//     const verifiedCerts = plumber.certifications?.filter(cert => cert.verified) ?? [];

//     resultsWithAds.push(
//       <Card key={plumber.id} className="hover:shadow-lg transition-shadow">
//         <CardHeader>
//           <div className="flex items-start gap-4">
//             <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-muted">
//               <Image
//                 src={plumber.profilePicture || "/images/marvin.jpg"}
//                 alt={plumber.businessName || plumber.name || "Tradesperson"}
//                 fill
//                 className="object-cover"
//                 sizes="64px"
//               />
//             </div>
//             <div className="flex-1">
//               <CardTitle className="text-lg font-semibold">{plumber.businessName || plumber.name}</CardTitle>
//               <div className="flex items-center gap-2 mt-1">
//                 <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
//                 <span className="font-medium">{plumber.avgRating?.toFixed(1) ?? "N/A"}</span>
//                 {typeof plumber.reviewsCount === "number" && (
//                   <span className="text-gray-500">({plumber.reviewsCount} reviews)</span>
//                 )}
//               </div>
//               {canShowBadges && verifiedCerts.length > 0 && (
//                 <div className="flex flex-wrap gap-1 mt-2">
//                   {verifiedCerts.slice(0, 2).map(cert => (
//                     <CertificationBadge key={cert.id} cert={cert} />
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div className="flex items-center gap-2 text-sm text-muted-foreground">
//             <MapPin className="h-4 w-4" />
//             <span>{plumber.location?.town || plumber.location?.postcode || "Location not set"}</span>
//           </div>
//           {plumber.specialties && plumber.specialties.length > 0 && (
//             <div className="flex flex-wrap gap-2 pt-2 border-t">
//               {plumber.specialties.slice(0, 3).map((specialty, index) => (
//                 <Badge key={index} variant="secondary">
//                   {specialty}
//                 </Badge>
//               ))}
//             </div>
//           )}
//           <div className="pt-4 border-t flex justify-end">
//             <Button asChild>
//               <Link href={`/profile/tradesperson/${plumber.slug}`}>View Profile</Link>
//             </Button>
//           </div>
//         </CardContent>
//       </Card>
//     );

//     // Inject an ad at specific positions
//     if (index === 1 || index === 6) {
//       resultsWithAds.push(<AdComponent key={`ad-${index}`} />);
//     }
//   });

//   return <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{resultsWithAds}</div>;
// }
// src/components/search/tradesperson-results.tsx

import React from "react";
import type { User } from "@/lib/types/user";
import { AdComponent } from "./ad-component";
import { TradespersonCard } from "@/components/cards/tradesperson-card"; // <-- Import the unified component

interface TradespersonResultsProps {
  tradespeople: User[];
}

export function TradespersonResults({ tradespeople }: TradespersonResultsProps) {
  if (tradespeople.length === 0) {
    return <p className="text-center text-muted-foreground">No tradespeople were found.</p>;
  }

  const resultsWithAds: React.ReactNode[] = [];

  tradespeople.forEach((plumber, index) => {
    // --- THIS IS THE FIX ---
    // The complex card layout is replaced with the single, consistent component.
    resultsWithAds.push(<TradespersonCard key={plumber.id} tradesperson={plumber} />);
    // --- END OF FIX ---

    // Inject an ad at specific positions
    if (index === 1 || index === 6) {
      resultsWithAds.push(<AdComponent key={`ad-${index}`} />);
    }
  });

  return <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{resultsWithAds}</div>;
}
