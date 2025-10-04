// src/lib/services/geocoding-service.ts
// Geocoding service for converting postcodes to coordinates
interface Coordinates {
  latitude: number;
  longitude: number;
}

interface PostcodeResult {
  postcode: string;
  coordinates: Coordinates;
  district: string;
  ward: string;
  country: string;
}

interface CacheEntry {
  result: PostcodeResult;
  expiresAt: number;
}

class GeocodingService {
  private cache = new Map<string, CacheEntry>();
  private readonly CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

  // Using postcodes.io - free UK postcode API
  async getCoordinatesFromPostcode(postcode: string): Promise<PostcodeResult | null> {
    try {
      const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();

      const cached = this.cache.get(cleanPostcode);
      if (cached) {
        if (cached.expiresAt > Date.now()) {
          return cached.result;
        }
        this.cache.delete(cleanPostcode);
      }

      const response = await fetch(`https://api.postcodes.io/postcodes/${cleanPostcode}`);

      if (!response.ok) {
        console.warn(`Postcode lookup failed for ${postcode}: ${response.status}`);
        return null;
      }

      const data = await response.json();

      if (data.status === 200 && data.result) {
        const result: PostcodeResult = {
          postcode: data.result.postcode,
          coordinates: {
            latitude: data.result.latitude,
            longitude: data.result.longitude
          },
          district: data.result.admin_district,
          ward: data.result.admin_ward,
          country: data.result.country
        };

        this.cache.set(cleanPostcode, {
          result,
          expiresAt: Date.now() + this.CACHE_DURATION
        });

        return result;
      }

      return null;
    } catch (error) {
      console.error("Geocoding error:", error);
      return null;
    }
  }

  // Calculate distance between two coordinates using Haversine formula
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(coord2.latitude - coord1.latitude);
    const dLon = this.toRadians(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(coord1.latitude)) *
        Math.cos(this.toRadians(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Batch geocode multiple postcodes
  async batchGeocode(postcodes: string[]): Promise<Map<string, PostcodeResult>> {
    const results = new Map<string, PostcodeResult>();

    // Process in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < postcodes.length; i += batchSize) {
      const batch = postcodes.slice(i, i + batchSize);
      const promises = batch.map(async postcode => {
        const result = await this.getCoordinatesFromPostcode(postcode);
        if (result) {
          results.set(postcode, result);
        }
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      await Promise.all(promises);
    }

    return results;
  }
}

export const geocodingService = new GeocodingService();
