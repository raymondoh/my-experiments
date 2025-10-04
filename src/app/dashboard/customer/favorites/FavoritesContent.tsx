"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MapPin, Star } from "lucide-react";

import FavoriteButton from "@/components/favorites/favorite-button";
import { useFavorites } from "@/components/providers/favorites-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { User } from "@/lib/types/user";

interface FavoritesContentProps {
  initialFavorites: User[];
}

const FETCH_OPTIONS: RequestInit = {
  cache: "no-store"
};

const FavoritesContent = ({ initialFavorites }: FavoritesContentProps) => {
  const { favorites, hasInitialized, isAuthenticated } = useFavorites();
  const [localFavorites, setLocalFavorites] = useState<User[]>(initialFavorites);

  useEffect(() => {
    setLocalFavorites(initialFavorites);
  }, [initialFavorites]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocalFavorites([]);
      return;
    }

    if (!hasInitialized) {
      return;
    }

    let isActive = true;

    const refreshFavorites = async () => {
      try {
        const response = await fetch("/api/favorites", FETCH_OPTIONS);
        if (!response.ok) {
          throw new Error(`Failed to fetch favorites: ${response.statusText}`);
        }

        const data = (await response.json()) as { favorites?: User[] };
        if (!isActive) {
          return;
        }

        if (Array.isArray(data.favorites)) {
          setLocalFavorites(data.favorites);
        }
      } catch (error) {
        console.error("FavoritesContent: Failed to refresh favorites", error);
      }
    };

    void refreshFavorites();

    return () => {
      isActive = false;
    };
  }, [favorites, hasInitialized, isAuthenticated]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Favorite Tradespeople</h1>
        <Button variant="outline" asChild>
          <Link href="/search">Find more plumbers</Link>
        </Button>
      </div>

      {localFavorites.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localFavorites.map(plumber => (
            <Card key={plumber.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={plumber.profilePicture || ""} />
                    <AvatarFallback>
                      {(plumber.businessName || plumber.name || "?").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{plumber.businessName || plumber.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span>4.9 (127 reviews)</span>
                    </div>
                  </div>
                </div>
                <FavoriteButton tradespersonId={plumber.id} initialIsFavorite />
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{plumber.location?.town || "Location not set"}</span>
                </div>

                {plumber.serviceAreas && (
                  <p className="text-sm text-muted-foreground">
                    Service Areas: {plumber.serviceAreas}
                  </p>
                )}

                {plumber.experience && (
                  <p className="text-sm text-muted-foreground">
                    Experience: {plumber.experience} years
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {plumber.specialties?.slice(0, 3).map(specialty => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>

                <div className="pt-4 border-t flex justify-end">
                  <Button asChild>
                    <Link href={`/profile/tradesperson/${plumber.slug}`}>
                      View Profile
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            <div className="flex flex-col items-center gap-2">
              <Heart className="h-10 w-10" />
              <p className="mt-1">You haven’t favorited any tradespeople yet.</p>
              <Button asChild className="mt-3">
                <Link href="/search">Browse plumbers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FavoritesContent;
