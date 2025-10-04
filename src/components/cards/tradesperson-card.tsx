// import Link from "next/link";
// import Image from "next/image";
// import { Star, MapPin, Globe } from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import type { User } from "@/lib/types/user";
// import { CertificationBadge } from "@/components/certifications/certification-badge";

// interface TradespersonCardProps {
//   tradesperson: User;
// }

// export function TradespersonCard({ tradesperson }: TradespersonCardProps) {
//   // Consolidate logic for subscription tiers and verified certifications
//   const subjectTier = (tradesperson.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
//   const canShowBadges = subjectTier === "pro" || subjectTier === "business";
//   const verifiedCerts = tradesperson.certifications?.filter(cert => cert.verified) ?? [];

//   // Use the correct nested structure for reviews data
//   const averageRating = tradesperson.reviews?.averageRating ?? 0;
//   const reviewCount = tradesperson.reviews?.count ?? 0;

//   return (
//     <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
//       <CardContent className="p-4 flex flex-col flex-grow">
//         {/* Header Section with Avatar, Name, and Ratings */}
//         <div className="flex items-start gap-4">
//           <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-muted border">
//             <Image
//               src={tradesperson.profilePicture || "/images/marvin.jpg"}
//               alt={tradesperson.businessName || tradesperson.name || "Tradesperson"}
//               fill
//               className="object-cover"
//               sizes="64px"
//             />
//           </div>
//           <div className="flex-1">
//             <h3 className="text-lg font-semibold">{tradesperson.businessName || tradesperson.name}</h3>
//             {reviewCount > 0 && (
//               <div className="flex items-center gap-1.5 mt-1 text-sm">
//                 <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
//                 <span className="font-medium">{averageRating.toFixed(1)}</span>
//                 <span className="text-muted-foreground">({reviewCount} reviews)</span>
//               </div>
//             )}
//             {canShowBadges && verifiedCerts.length > 0 && (
//               <div className="flex flex-wrap gap-1 mt-2">
//                 {verifiedCerts.slice(0, 2).map(cert => (
//                   <CertificationBadge key={cert.id} cert={cert} />
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Location and Service Areas */}
//         <div className="text-sm text-muted-foreground space-y-2 text-left mt-4">
//           <div className="flex items-start gap-2">
//             <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
//             <span>Based in {tradesperson.location?.town || tradesperson.location?.postcode}</span>
//           </div>
//           {tradesperson.serviceAreas && (
//             <div className="flex items-start gap-2">
//               <Globe className="h-4 w-4 flex-shrink-0 mt-0.5" />
//               <span>Areas Covered: {tradesperson.serviceAreas}</span>
//             </div>
//           )}
//         </div>

//         {/* Specialties and Profile Button */}
//         <div className="flex flex-col flex-grow justify-end mt-4 pt-4 border-t">
//           {tradesperson.specialties && tradesperson.specialties.length > 0 && (
//             <div className="flex flex-wrap gap-2 mb-4">
//               {tradesperson.specialties.slice(0, 3).map((specialty, index) => (
//                 <Badge key={index} variant="secondary">
//                   {specialty}
//                 </Badge>
//               ))}
//             </div>
//           )}
//           <Button asChild className="w-full mt-auto">
//             <Link href={`/profile/tradesperson/${tradesperson.slug}`}>View Profile</Link>
//           </Button>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
import Link from "next/link";
import Image from "next/image";
import { Star, MapPin, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types/user";
import { CertificationBadge } from "@/components/certifications/certification-badge";
// FIX: Import the FavoriteButton component
import { FavoriteButton } from "@/components/favorites/favorite-button";

interface TradespersonCardProps {
  tradesperson: User;
}

export function TradespersonCard({ tradesperson }: TradespersonCardProps) {
  const subjectTier = (tradesperson.subscriptionTier ?? "basic") as "basic" | "pro" | "business";
  const canShowBadges = subjectTier === "pro" || subjectTier === "business";
  const verifiedCerts = tradesperson.certifications?.filter(cert => cert.verified) ?? [];

  // The user object now correctly nests review data
  const averageRating = tradesperson.avgRating ?? 0;
  const reviewCount = tradesperson.reviewsCount ?? 0;

  return (
    // FIX: Add 'relative' positioning to act as an anchor for the button
    <Card className="relative hover:shadow-lg transition-shadow h-full flex flex-col">
      {/* FIX: Add the FavoriteButton here in the top-right corner */}
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton tradespersonId={tradesperson.id} />
      </div>

      <CardContent className="p-4 flex flex-col flex-grow">
        {/* Header Section with Avatar, Name, and Ratings */}
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full bg-muted border">
            <Image
              src={tradesperson.profilePicture || "/images/marvin.jpg"}
              alt={tradesperson.businessName || tradesperson.name || "Tradesperson"}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{tradesperson.businessName || tradesperson.name}</h3>
            {reviewCount > 0 && (
              <div className="flex items-center gap-1.5 mt-1 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium">{averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviewCount} reviews)</span>
              </div>
            )}
            {canShowBadges && verifiedCerts.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {verifiedCerts.slice(0, 2).map(cert => (
                  <CertificationBadge key={cert.id} cert={cert} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location and Service Areas */}
        <div className="text-sm text-muted-foreground space-y-2 text-left mt-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Based in {tradesperson.location?.town || tradesperson.location?.postcode}</span>
          </div>
          {tradesperson.serviceAreas && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Areas Covered: {tradesperson.serviceAreas}</span>
            </div>
          )}
        </div>

        {/* Specialties and Profile Button */}
        <div className="flex flex-col flex-grow justify-end mt-4 pt-4 border-t">
          {tradesperson.specialties && tradesperson.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tradesperson.specialties.slice(0, 3).map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
          <Button asChild className="w-full mt-auto">
            <Link href={`/profile/tradesperson/${tradesperson.slug}`}>View Profile</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
