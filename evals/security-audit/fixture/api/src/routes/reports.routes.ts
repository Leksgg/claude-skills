import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';
import { Router } from 'express';

const run = promisify(exec);
const router = Router();

// Genera un PDF a partir de una página de la tienda (facturas, fichas de producto).
router.post('/pdf', async (req, res) => {
  const output = `/tmp/report-${randomUUID()}.pdf`;
  await run(`wkhtmltopdf --quiet ${req.body.url} ${output}`);
  res.download(output);
});

export default router;
