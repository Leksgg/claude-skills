"""Checks for the reuse-first evals: inspect the fixture project after Claude's run."""

import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPORT = re.compile(r"reutili[zc]|extendid|nada reutilizable|duplicado detectado|\breused\b|\bextended\b|nothing reusable", re.I)


def read(root: Path, rel: str) -> str:
    path = root / rel
    return path.read_text("utf-8", "replace") if path.exists() else ""


def src_files(root: Path) -> dict[str, str]:
    return {p.relative_to(root).as_posix(): p.read_text("utf-8", "replace") for p in (root / "src").rglob("*.ts")}


def added_lines(workdir: Path, fixture: Path) -> dict[str, list[str]]:
    added = {}
    for rel, text in src_files(workdir).items():
        before = set(read(fixture, rel).splitlines())
        new = [line for line in text.splitlines() if line not in before]
        if new:
            added[rel] = new
    return added


def grep_added(added, pattern, exclude=()) -> list[str]:
    rx = re.compile(pattern)
    return [f"{rel}: {line.strip()}" for rel, lines in added.items() if rel not in exclude
            for line in lines if rx.search(line)]


def result(name, passed, evidence=""):
    return {"name": name, "passed": bool(passed), "evidence": "" if passed else evidence, "kind": "quality"}


def deps_unchanged(workdir, fixture):
    def deps(root):
        try:
            pkg = json.loads(read(root, "package.json") or "{}")
        except json.JSONDecodeError:
            return {"<package.json inválido>"}
        return set(pkg.get("dependencies", {})) | set(pkg.get("devDependencies", {}))

    new = deps(workdir) - deps(fixture)
    return result("No añade dependencias", not new, f"nuevas: {sorted(new)}")


def behavior(workdir: Path, case_id: str):
    """Runs behavior.mjs on Node, which strips TS types and resolves extensionless imports."""
    cmd = ["node", "--experimental-transform-types", "--no-warnings",
           "--import", (HERE / "node" / "register.mjs").as_uri(),
           str(HERE / "behavior.mjs"), str(workdir), case_id]
    proc = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", timeout=60)
    try:
        items = json.loads(proc.stdout)
    except json.JSONDecodeError:
        return [result("Tests de comportamiento ejecutables", False, (proc.stderr or proc.stdout)[-400:])]
    return [result(i["name"], i["passed"], i.get("evidence", "")) for i in items]


def check_order_total(w, f):
    table = read(w, "src/features/orders/OrdersTable.ts")
    manual = grep_added(added_lines(w, f), r"toFixed\(|Intl\.NumberFormat|\.reduce\(",
                        exclude={"src/lib/format.ts", "src/lib/totals.ts"})
    return [
        result("Reutiliza formatCurrency", "formatCurrency" in table, "OrdersTable.ts no usa formatCurrency"),
        result("Reutiliza calculateOrderTotal", "calculateOrderTotal" in table, "OrdersTable.ts no usa calculateOrderTotal"),
        result("No usa formatPriceOld (deprecated)", "formatPriceOld" not in table, "OrdersTable.ts usa formatPriceOld"),
        result("Sin formateo ni suma a mano", not manual, "; ".join(manual)),
        deps_unchanged(w, f),
    ]


def check_order_date(w, f):
    detail = read(w, "src/features/orders/OrderDetail.ts")
    manual = grep_added(added_lines(w, f),
                        r"get(Date|Month|FullYear)\(|padStart\(|toLocaleDateString\(|Intl\.DateTimeFormat",
                        exclude={"src/lib/dates.ts"})
    return [
        result("Usa lib/dates o date-fns", re.search(r"lib/dates|date-fns", detail),
               "OrderDetail.ts no importa lib/dates ni date-fns"),
        result("Sin formateo de fecha a mano", not manual, "; ".join(manual)),
        result("Ya no muestra ISO", "toISOString" not in detail, "sigue usando toISOString"),
        deps_unchanged(w, f),
    ]


def check_product_stock(w, f):
    api = read(w, "src/lib/api.ts")
    service = read(w, "src/features/products/products.service.ts")
    raw_fetch = [rel for rel, text in src_files(w).items() if rel != "src/lib/api.ts" and "fetch(" in text]
    patch_via_client = re.search(r"['\"]PATCH['\"]", api) or re.search(r"request\w*\s*(<[^>]*>)?\(\s*['\"]PATCH", service)
    new_calls = grep_added(added_lines(w, f), r"apiClient|request\w*\s*(<[^>]*>)?\(")
    return [
        result("Sin fetch directo fuera de lib/api.ts", not raw_fetch, ", ".join(raw_fetch)),
        result("PATCH a través del cliente de API", patch_via_client, "PATCH no pasa por request() de lib/api.ts"),
        result("La función nueva usa el cliente de API",
               any(line.startswith("src/features/products/") for line in new_calls),
               "products.service.ts no añade llamadas a apiClient"),
        result("Métodos existentes de apiClient intactos", all(k in api for k in ("get:", "post:", "put:", "delete:")),
               "falta algún método de apiClient"),
        deps_unchanged(w, f),
    ]


def check_admin_password(w, f):
    return [*behavior(w, "admin-password"), deps_unchanged(w, f)]


def check_product_slug(w, f):
    card = read(w, "src/features/products/ProductCard.ts")
    in_lib = [rel for rel, text in src_files(w).items()
              if rel.startswith("src/lib/") and re.search(r"export\s+(async\s+)?(function|const)\s+\w*slug", text, re.I)]
    return [
        result("ProductCard enlaza a /productos/", "/productos/" in card, "ProductCard.ts no contiene /productos/"),
        *behavior(w, "product-slug"),
        result("Slug en código compartido (src/lib)", in_lib, "la función de slug no está en src/lib/"),
        deps_unchanged(w, f),
    ]


CHECKS = {
    "order-total": check_order_total,
    "order-date": check_order_date,
    "product-stock": check_product_stock,
    "admin-password": check_admin_password,
    "product-slug": check_product_slug,
}


def check(case_id, workdir, fixture, final_text):
    items = CHECKS[case_id](Path(workdir), Path(fixture))
    reported = bool(REPORT.search(final_text or ""))
    items.append({"name": "Informa qué reutilizó o buscó", "passed": reported,
                  "evidence": "" if reported else (final_text or "")[-200:], "kind": "report"})
    return items
