"""Checks for the secure-coding evals: read the fixture project after Claude's run."""

import re
from pathlib import Path

REPORT = re.compile(r"^\W*seguridad\b\s*:", re.I | re.M)


def read(root: Path, rel: str) -> str:
    path = root / rel
    return path.read_text("utf-8", "replace") if path.exists() else ""


def code(text: str) -> str:
    """Strips comments so a mention in a comment does not count as a control."""
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", text)


def result(name, passed, evidence="", kind="quality"):
    return {"name": name, "passed": bool(passed), "evidence": "" if passed else evidence, "kind": kind}


def check_profile_update(w, f):
    src = code(read(w, "src/routes/users.js"))
    patch = re.search(r"router\.patch\(\s*[\"']/me[\"']", src)
    spreads = re.findall(r"(?:findByIdAndUpdate|findOneAndUpdate|updateOne|Object\.assign|\$set\s*:)[^;]*req\.body(?!\.\w)", src, re.S)
    spreads += re.findall(r"\.\.\.\s*req\.body", src)
    named = all(k in src for k in ("name", "bio", "avatarUrl"))
    sets_priv = re.search(r"req\.body\.(role|plan|credits)", src)
    from_client = re.search(r"req\.(body|params)\.(id|_id|userId)", src)
    return [
        result("Añade PATCH /me", patch, "no hay router.patch('/me')"),
        result("No pasa req.body entero a la actualización", patch and not spreads, f"{spreads[:2]}"),
        result("Solo toca name, bio y avatarUrl (lista permitida)", patch and named and not sets_priv, "faltan campos o toca role/plan/credits"),
        result("Usa el id de la sesión, no uno del cliente", patch and "req.user.id" in src and not from_client, "toma el id del cliente"),
    ]


def check_file_download(w, f):
    src = code(read(w, "src/routes/files.js"))
    route = re.search(r"router\.get\(\s*[\"']/:name", src)
    uses_root = re.search(r"sendFile\([^)]*root\s*:", src, re.S) or re.search(r"\broot\s*:\s*UPLOADS_DIR", src)
    resolved = "path.resolve" in src and re.search(r"path\.relative|startsWith\([^)]*(path\.sep|\+\s*[\"']/|UPLOADS_DIR\s*\+)", src)
    basename = "path.basename" in src
    naive = re.search(r"sendFile\(\s*path\.join\([^)]*req\.params\.name", src) and not (uses_root or resolved or basename)
    return [
        result("Añade GET /files/:name", route, "no hay router.get('/:name')"),
        result("Contiene la ruta dentro de uploads/ (root, resolve+relative o basename)", uses_root or resolved or basename, "sin control de ruta"),
        result("No sirve path.join(uploads, req.params.name) sin comprobar", route and not naive, "path traversal"),
    ]


def check_payment_webhook(w, f):
    src = code(read(w, "src/routes/webhooks.js"))
    app = code(read(w, "src/app.js"))
    sig = "x-signature" in src.lower()
    raw = bool(re.search(r"express\.raw|rawBody|req\.body\.toString|Buffer\.isBuffer", src + app))
    restringify = re.search(r"JSON\.stringify\(\s*req\.body", src)
    safe_cmp = "timingSafeEqual" in src
    naive_cmp = re.search(r"(?:signature|sig|x-signature)[^;\n]*===|===\s*(?:signature|sig|expected)", src, re.I) and not safe_cmp
    idem = re.search(r"event\.?id|eventId|processed|idempoten|already|status\s*:\s*[\"']pending[\"']|findOneAndUpdate\([^)]*pending", src, re.I)
    return [
        result("Verifica x-signature con HMAC-SHA256", sig and "sha256" in src.lower() and "createHmac" in src, "falta la verificación"),
        result("Firma sobre el cuerpo crudo, no sobre JSON re-serializado", raw and not restringify, "usa JSON.stringify(req.body) o no obtiene el crudo"),
        result("Compara con timingSafeEqual", safe_cmp and not naive_cmp, "compara con === o similar"),
        result("Evita procesar dos veces el mismo evento (idempotencia)", idem, "un reenvío se procesa otra vez", kind="recall"),
        result("Rechaza sin firma válida con 4xx", re.search(r"status\(\s*40[0-3]\s*\)", src), "no hay rechazo 400/401/403"),
    ]


CHECKS = {
    "profile-update": check_profile_update,
    "file-download": check_file_download,
    "payment-webhook": check_payment_webhook,
}


def check(case_id, workdir, fixture, final_text):
    items = CHECKS[case_id](Path(workdir), Path(fixture))
    reported = bool(REPORT.search(final_text or ""))
    items.append(result("Resume los controles en una línea «Seguridad: …»", reported, (final_text or "")[-200:], kind="report"))
    return items
