import { Router } from 'express';
import { Review } from '../models/Review';

const router = Router();

router.get('/:id/reviews', async (req, res) => {
  const reviews = await Review.find({ productId: req.params.id }).sort({ createdAt: -1 }).limit(50);
  res.json(reviews);
});

router.post('/:id/reviews', async (req, res) => {
  const rating = Number(req.body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Valoración no válida' });
  }
  const review = await Review.create({
    productId: req.params.id,
    userId: req.user!.id,
    rating,
    comment: String(req.body.comment ?? '').slice(0, 2000),
  });
  res.status(201).json(review);
});

export default router;
