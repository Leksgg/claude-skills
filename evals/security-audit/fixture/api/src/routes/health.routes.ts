import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Router } from 'express';

const run = promisify(execFile);
const router = Router();

router.get('/', async (_req, res) => {
  const { stdout } = await run('git', ['rev-parse', '--short', 'HEAD']);
  res.json({ status: 'ok', version: stdout.trim() });
});

export default router;
