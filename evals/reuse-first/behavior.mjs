// Behavior checks run with Node against the project Claude modified.
// Usage: node --experimental-transform-types --import <register.mjs URL> behavior.mjs <workdir> <case>
// Prints a JSON array of { name, passed, evidence }.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

const [workdir, caseId] = process.argv.slice(2);
const results = [];

const load = (file) => import(pathToFileURL(join(workdir, file)).href);

async function check(name, fn) {
  try {
    const outcome = await fn();
    results.push({ name, passed: outcome === true, evidence: outcome === true ? '' : String(outcome) });
  } catch (err) {
    results.push({ name, passed: false, evidence: String(err?.message ?? err).slice(0, 300) });
  }
}

function tsFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return tsFiles(full);
    return entry.name.endsWith('.ts') ? [full] : [];
  });
}

const cases = {
  async 'admin-password'() {
    await check('Reglas de clientes intactas (8 caracteres + número)', async () => {
      const { validateUserPassword } = await load('src/validation/password.ts');
      const same =
        validateUserPassword('abcdefg1') === true &&
        validateUserPassword('abcdefgh') === false &&
        validateUserPassword('abc1') === false;
      return same || 'validateUserPassword ya no se comporta igual';
    });

    const adminErrors = async (password) => {
      const { handleAdminSignup } = await load('src/features/admin/adminSignup.ts');
      return handleAdminSignup({ name: 'Ana', email: 'ana@tienda.es', password }).length;
    };
    await check('Admin: acepta contraseña válida', async () => (await adminErrors('abcdefghij1!')) === 0 || 'rechaza abcdefghij1!');
    await check('Admin: rechaza menos de 12 caracteres', async () => (await adminErrors('abcdefgh1!')) > 0 || 'acepta abcdefgh1! (10 caracteres)');
    await check('Admin: rechaza sin símbolo', async () => (await adminErrors('abcdefghijk1')) > 0 || 'acepta abcdefghijk1');
    await check('Admin: rechaza sin número', async () => (await adminErrors('abcdefghijk!')) > 0 || 'acepta abcdefghijk!');
  },

  async 'product-slug'() {
    await check('Slug correcto', async () => {
      const problems = [];
      for (const file of tsFiles(join(workdir, 'src'))) {
        if (!/slug/i.test(readFileSync(file, 'utf8'))) continue;
        let mod;
        try {
          mod = await import(pathToFileURL(file).href);
        } catch (err) {
          problems.push(`${relative(workdir, file)} no carga: ${err.message}`);
          continue;
        }
        for (const [name, fn] of Object.entries(mod)) {
          if (typeof fn !== 'function' || !/slug/i.test(name)) continue;
          const got = [fn('Café Molido Premium'), fn('Té verde & limón')];
          if (got[0] === 'cafe-molido-premium' && got[1] === 'te-verde-limon') return true;
          problems.push(`${name} → ${JSON.stringify(got)}`);
        }
      }
      return problems.join('; ') || 'no hay ninguna función exportada con "slug" en el nombre';
    });
  },
};

await cases[caseId]?.();
console.log(JSON.stringify(results));
