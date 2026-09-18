#!/usr/bin/env python3
"""Runs skill evals against a fixture project with headless Claude Code (claude -p).

Usage:
  python evals/run.py reuse-first                     # effect: every case x configs
  python evals/run.py reuse-first --mode trigger      # does the skill load before code is written?
  python evals/run.py security-audit --runs 3         # repeat each case/config to see variance
  python evals/run.py reuse-first --cases order-total --configs natural forced

Each skill under evals/<skill>/ provides:
  fixture/     project copied to a fresh temp dir for every run
  cases.json   {"cases": [{"id", "prompt", "forced_prompt"?}],
                "trigger_queries": [{"query", "should_trigger"}],
                "tools"?: "Read,Grep,Glob", "configs"?: ["baseline", "forced"]}
  checks.py    check(case_id, workdir, fixture, final_text) -> [{"name", "passed", "evidence", "kind"}]
               kind: quality | report | recall | bait

Configs:
  baseline  skills disabled
  natural   skill available; Claude decides whether to load it (what you get day to day)
  forced    prompt starts with /<skill> (or the case's forced_prompt), so the skill is always loaded

Runs happen in temp dirs outside this repo so its CLAUDE.md does not leak into them.
No shell, network or MCP servers: only the tools listed in cases.json (default: read/search/edit).
Results go to evals/<skill>/results/<timestamp>-<mode>/ (ignored by git).
"""

import argparse
import difflib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path

EVALS_DIR = Path(__file__).resolve().parent
BASE_TOOLS = "Read,Grep,Glob,Edit,Write"
WRITE_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
SEARCH_TOOLS = {"Grep", "Glob"}
CONFIGS = ("baseline", "natural", "forced")
KIND_LABELS = {"quality": "Checks OK", "recall": "Vulns detectadas", "bait": "Cebos evitados", "report": "Informó"}


def claude_executable() -> str:
    exe = shutil.which("claude")
    if not exe:
        sys.exit("claude CLI not found in PATH")
    # On Windows npm installs a .cmd shim; call the native binary behind it directly.
    native = Path(exe).parent / "node_modules" / "@anthropic-ai" / "claude-code" / "bin" / "claude.exe"
    return str(native) if native.exists() else exe


def claude_env() -> dict:
    return {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}


def claude_command(config: str, args, tools: str = BASE_TOOLS) -> list[str]:
    cmd = [
        claude_executable(), "-p",
        "--output-format", "stream-json", "--verbose",
        "--permission-mode", "acceptEdits",
        "--strict-mcp-config",
        "--no-session-persistence",
        "--max-budget-usd", str(args.budget),
    ]
    if config == "baseline":
        cmd += ["--tools", tools, "--disable-slash-commands"]
    else:
        cmd += ["--tools", tools + ",Skill"]
    if args.model:
        cmd += ["--model", args.model]
    return cmd


def run_claude(cmd, prompt, cwd, timeout, stderr_path, stop_on=None):
    """Streams claude -p events. stop_on(event) returning True ends the run early."""
    with open(stderr_path, "wb") as stderr:
        proc = subprocess.Popen(cmd, cwd=cwd, env=claude_env(), stdin=subprocess.PIPE,
                                stdout=subprocess.PIPE, stderr=stderr)
        # The prompt goes through stdin so no shell ever parses it.
        proc.stdin.write(prompt.encode("utf-8"))
        proc.stdin.close()
        timer = threading.Timer(timeout, proc.kill)
        timer.start()
        events, stopped = [], False
        try:
            for raw in proc.stdout:
                try:
                    event = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                events.append(event)
                if stop_on and stop_on(event):
                    stopped = True
                    break
        finally:
            timer.cancel()
            if proc.poll() is None:
                proc.kill()
            proc.wait()
    finished = any(e.get("type") == "result" for e in events)
    return events, stopped, not (finished or stopped)


def tool_uses(event):
    if event.get("type") != "assistant":
        return []
    content = event.get("message", {}).get("content") or []
    return [c for c in content if isinstance(c, dict) and c.get("type") == "tool_use"]


def loads_skill(tool_use, skill) -> bool:
    name, inp = tool_use.get("name"), tool_use.get("input") or {}
    if name == "Skill":
        return str(inp.get("skill", "")).split(":")[-1] == skill
    if name == "Read":
        path = str(inp.get("file_path", "")).replace("\\", "/")
        return f"/{skill}/SKILL.md" in path
    return False


def summarize(events, skill) -> dict:
    info = {"skill_loaded": False, "skill_before_write": False, "searches_before_write": 0,
            "reads_before_write": 0, "wrote": False}
    for event in events:
        for tu in tool_uses(event):
            if loads_skill(tu, skill):
                info["skill_loaded"] = True
                info["skill_before_write"] |= not info["wrote"]
            elif not info["wrote"] and tu.get("name") in SEARCH_TOOLS:
                info["searches_before_write"] += 1
            elif not info["wrote"] and tu.get("name") == "Read":
                info["reads_before_write"] += 1
            if tu.get("name") in WRITE_TOOLS:
                info["wrote"] = True
    result = next((e for e in reversed(events) if e.get("type") == "result"), {})
    info.update({
        "final_text": result.get("result") or "",
        "result_subtype": result.get("subtype"),
        "cost_usd": result.get("total_cost_usd"),
        "turns": result.get("num_turns"),
        "duration_s": round((result.get("duration_ms") or 0) / 1000, 1),
    })
    return info


def project_files(root: Path) -> set[Path]:
    return {p.relative_to(root) for p in root.rglob("*")
            if p.is_file() and ".claude" not in p.relative_to(root).parts}


def tree_diff(fixture: Path, workdir: Path) -> str:
    out = []
    for rel in sorted(project_files(fixture) | project_files(workdir)):
        before = (fixture / rel).read_text("utf-8", "replace").splitlines(True) if (fixture / rel).exists() else []
        after = (workdir / rel).read_text("utf-8", "replace").splitlines(True) if (workdir / rel).exists() else []
        if before != after:
            out.extend(difflib.unified_diff(before, after, f"a/{rel.as_posix()}", f"b/{rel.as_posix()}"))
    return "".join(out)


def fresh_workdir(skill: str, fixture: Path) -> Path:
    workdir = Path(tempfile.mkdtemp(prefix=f"{skill}-eval-"))
    shutil.copytree(fixture, workdir, dirs_exist_ok=True)
    return workdir


def save_transcript(run_dir: Path, events) -> None:
    (run_dir / "transcript.jsonl").write_text(
        "\n".join(json.dumps(e, ensure_ascii=False) for e in events), "utf-8")


def effect_job(skill, case, config, run_no, args, tools, out_dir, fixture, checks):
    run_dir = out_dir / case["id"] / config / f"run{run_no}"
    run_dir.mkdir(parents=True)
    workdir = fresh_workdir(skill, fixture)
    try:
        if config == "forced":
            prompt = case.get("forced_prompt") or f"/{skill} {case['prompt']}"
        else:
            prompt = case["prompt"]
        events, _, timed_out = run_claude(claude_command(config, args, tools), prompt, workdir,
                                          args.timeout, run_dir / "stderr.txt")
        save_transcript(run_dir, events)
        info = summarize(events, skill)
        if config == "forced":
            info["skill_loaded"] = info["skill_before_write"] = True
        (run_dir / "diff.patch").write_text(tree_diff(fixture, workdir), "utf-8")
        record = {"case": case["id"], "config": config, "run": run_no, "timed_out": timed_out, **info,
                  "checks": checks.check(case["id"], workdir, fixture, info["final_text"])}
        (run_dir / "result.json").write_text(json.dumps(record, indent=2, ensure_ascii=False), "utf-8")
        return record
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def trigger_job(skill, item, run_no, args, tools, out_dir, fixture):
    run_dir = out_dir / f"q{item['index']:02d}-run{run_no}"
    run_dir.mkdir(parents=True)
    workdir = fresh_workdir(skill, fixture)

    def stop_on(event):
        # Decided as soon as the skill loads or code starts being written.
        return any(loads_skill(tu, skill) or tu.get("name") in WRITE_TOOLS for tu in tool_uses(event))

    try:
        events, _, timed_out = run_claude(claude_command("natural", args, tools), item["query"], workdir,
                                          args.timeout, run_dir / "stderr.txt", stop_on)
        save_transcript(run_dir, events)
        triggered = summarize(events, skill)["skill_before_write"]
        return {"query": item["query"], "should_trigger": item["should_trigger"],
                "triggered": triggered, "timed_out": timed_out}
    finally:
        shutil.rmtree(workdir, ignore_errors=True)


def mean(values):
    values = [v for v in values if v is not None]
    return sum(values) / len(values) if values else 0


def ratio(checks) -> str:
    return f"{sum(c['passed'] for c in checks)}/{len(checks)}"


def effect_summary(records, configs) -> str:
    kinds = list(dict.fromkeys(c["kind"] for r in records for c in r["checks"]))
    lines = ["| Config | Runs | " + " | ".join(KIND_LABELS.get(k, k) for k in kinds)
             + " | Skill antes de escribir | Búsquedas antes de escribir | Coste medio | Duración media |",
             "|" + " --- |" * (len(kinds) + 6)]
    for config in configs:
        rs = [r for r in records if r["config"] == config]
        if not rs:
            continue
        cells = [ratio([c for r in rs for c in r["checks"] if c["kind"] == k]) for k in kinds]
        lines.append(
            f"| {config} | {len(rs)} | " + " | ".join(cells)
            + f" | {sum(r['skill_before_write'] for r in rs)}/{len(rs)}"
            f" | {mean(r['searches_before_write'] for r in rs):.1f}"
            f" | ${mean(r['cost_usd'] for r in rs):.2f} | {mean(r['duration_s'] for r in rs):.0f}s |")

    lines += ["", "| Caso | Check | " + " | ".join(configs) + " |", "|" + " --- |" * (len(configs) + 2)]
    for case_id in dict.fromkeys(r["case"] for r in records):
        case_records = [r for r in records if r["case"] == case_id]
        for name in dict.fromkeys(c["name"] for r in case_records for c in r["checks"]):
            cells = []
            for config in configs:
                hits = [c for r in case_records if r["config"] == config for c in r["checks"] if c["name"] == name]
                cells.append(ratio(hits) if hits else "-")
            lines.append(f"| {case_id} | {name} | " + " | ".join(cells) + " |")

    timeouts = [f"{r['case']}/{r['config']}#{r['run']}" for r in records if r["timed_out"]]
    if timeouts:
        lines += ["", "Timeouts: " + ", ".join(timeouts)]
    return "\n".join(lines)


def trigger_summary(records) -> str:
    by_query: dict[str, list] = {}
    for r in records:
        by_query.setdefault(r["query"], []).append(r)
    lines = ["| Petición | Debe activarse | Activada | OK |", "| --- | --- | --- | --- |"]
    passed = 0
    for query, rs in by_query.items():
        rate = sum(r["triggered"] for r in rs) / len(rs)
        should = rs[0]["should_trigger"]
        ok = rate >= 0.5 if should else rate < 0.5
        passed += ok
        lines.append(f"| {query} | {'sí' if should else 'no'} | {sum(r['triggered'] for r in rs)}/{len(rs)} | {'✓' if ok else '✗'} |")
    lines.insert(0, f"Acierto: {passed}/{len(by_query)}\n")
    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("skill")
    parser.add_argument("--mode", choices=("effect", "trigger"), default="effect")
    parser.add_argument("--cases", nargs="*", help="case ids (effect mode); default: all")
    parser.add_argument("--configs", nargs="*", choices=CONFIGS, help="default: cases.json configs, else all")
    parser.add_argument("--runs", type=int, default=1, help="runs per case/config or per trigger query")
    parser.add_argument("--parallel", type=int, default=4)
    parser.add_argument("--timeout", type=int, default=900, help="seconds per run")
    parser.add_argument("--budget", type=float, default=3.0, help="max USD per run")
    parser.add_argument("--model", help="default: the model configured in Claude Code")
    args = parser.parse_args()

    skill_dir = EVALS_DIR / args.skill
    fixture = skill_dir / "fixture"
    spec = json.loads((skill_dir / "cases.json").read_text("utf-8"))
    tools = spec.get("tools", BASE_TOOLS)
    configs = args.configs or spec.get("configs") or list(CONFIGS)
    out_dir = skill_dir / "results" / f"{datetime.now():%Y%m%d-%H%M%S}-{args.mode}"
    out_dir.mkdir(parents=True)

    with ThreadPoolExecutor(max_workers=args.parallel) as pool:
        if args.mode == "effect":
            checks_spec = importlib.util.spec_from_file_location("checks", skill_dir / "checks.py")
            checks = importlib.util.module_from_spec(checks_spec)
            checks_spec.loader.exec_module(checks)
            cases = [c for c in spec["cases"] if not args.cases or c["id"] in args.cases]
            futures = [pool.submit(effect_job, args.skill, case, config, n, args, tools, out_dir, fixture, checks)
                       for n in range(1, args.runs + 1) for case in cases for config in configs]
        else:
            queries = [{**q, "index": i} for i, q in enumerate(spec["trigger_queries"])]
            futures = [pool.submit(trigger_job, args.skill, q, n, args, tools, out_dir, fixture)
                       for n in range(1, args.runs + 1) for q in queries]

        records = []
        for future in as_completed(futures):
            record = future.result()
            records.append(record)
            if args.mode == "effect":
                scored = [c for c in record["checks"] if c["kind"] != "report"]
                label = f"{record['case']}/{record['config']}#{record['run']}: {ratio(scored)}"
            else:
                label = f"{'✓' if record['triggered'] == record['should_trigger'] else '✗'} {record['query'][:60]}"
            print(f"[{len(records)}/{len(futures)}] {label}", file=sys.stderr, flush=True)

    summary = effect_summary(records, configs) if args.mode == "effect" else trigger_summary(records)
    (out_dir / "summary.json").write_text(json.dumps(records, indent=2, ensure_ascii=False), "utf-8")
    (out_dir / "summary.md").write_text(summary + "\n", "utf-8")
    print(summary)
    print(f"\nResultados: {out_dir}")


if __name__ == "__main__":
    main()
