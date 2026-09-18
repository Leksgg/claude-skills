import { useEffect, useState } from 'react';
import { api } from '../api';

interface Review {
  _id: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    api.get<Review[]>(`/products/${productId}/reviews`).then(setReviews);
  }, [productId]);

  return (
    <section className="reviews">
      <h3>Opiniones</h3>
      {reviews.map((review) => (
        <article key={review._id} className="review">
          <span className="rating">{'★'.repeat(review.rating)}</span>
          <div className="comment" dangerouslySetInnerHTML={{ __html: review.comment }} />
        </article>
      ))}
    </section>
  );
}
