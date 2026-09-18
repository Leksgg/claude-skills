import { Schema, model } from 'mongoose';

const orderSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true },
    shippingAddress: { type: String, required: true },
    status: { type: String, enum: ['pending', 'paid', 'shipped'], default: 'pending' },
  },
  { timestamps: true },
);

export const Order = model('Order', orderSchema);
