import { useEffect, useState } from 'react';
import { api } from './api';
import { ProductDescription } from './components/ProductDescription';
import { ProductReviews } from './components/ProductReviews';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
}

export function App({ productId }: { productId: string }) {
  const [product, setProduct] = useState<Product | null>(null);

  useEffect(() => {
    api.get<Product>(`/products/${productId}`).then(setProduct);
  }, [productId]);

  if (!product) return <p>Cargando…</p>;

  return (
    <main>
      <h1>{product.name}</h1>
      <ProductDescription markdown={product.description} />
      <ProductReviews productId={product._id} />
    </main>
  );
}
