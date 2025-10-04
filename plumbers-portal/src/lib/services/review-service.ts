import { getAdminCollection, COLLECTIONS } from "@/lib/firebase/admin";
import type { Review, CreateReviewData } from "@/lib/types/review";
import { notificationService } from "@/lib/services/notification-service";
import { emailService } from "@/lib/email/email-service";
import { userService } from "@/lib/services/user-service";
import { Timestamp } from "firebase-admin/firestore";

export class ReviewService {
  private static instance: ReviewService | null = null;

  static getInstance(): ReviewService {
    if (!ReviewService.instance) {
      ReviewService.instance = new ReviewService();
    }
    return ReviewService.instance;
  }

  async createReview(data: CreateReviewData): Promise<Review> {
    const reviewData: Omit<Review, "id"> = {
      ...data,
      createdAt: new Date()
    };
    const docRef = await getAdminCollection(COLLECTIONS.REVIEWS).add(reviewData);
    await notificationService.createNotification(
      data.tradespersonId,
      'review_left',
      'A new review was left on your profile',
      { reviewId: docRef.id, jobId: data.jobId }
    );
    const tradesperson = await userService.getUserById(data.tradespersonId);
    if (tradesperson?.email) {
      await emailService.sendReviewLeftEmail(tradesperson.email, docRef.id);
    }
    return { id: docRef.id, ...reviewData };
  }

  async getReviewsByTradespersonId(tradespersonId: string): Promise<Review[]> {
    const snapshot = await getAdminCollection(COLLECTIONS.REVIEWS)
      .where("tradespersonId", "==", tradespersonId)
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data() as {
        jobId: string;
        tradespersonId: string;
        customerId: string;
        rating: number;
        comment: string;
        createdAt?: Timestamp | Date;
      };
      return {
        id: doc.id,
        jobId: data.jobId,
        tradespersonId: data.tradespersonId,
        customerId: data.customerId,
        rating: data.rating,
        comment: data.comment,
        createdAt:
          data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ?? new Date())
      };
    });
  }
}

export const reviewService = ReviewService.getInstance();
