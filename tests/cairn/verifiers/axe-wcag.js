if (!globalThis.axe) {
  return {
    ok: false,
    evidence: {
      error: "axe-core was not loaded by AGENT_BROWSER_INIT_SCRIPTS",
    },
  };
}

return globalThis.axe
  .run(document, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
    },
  })
  .then((results) => {
    const blocking = results.violations.filter(
      ({ impact }) => impact === "serious" || impact === "critical",
    );

    return {
      ok: blocking.length === 0,
      evidence: {
        checkedNodes: results.passes.reduce(
          (count, result) => count + result.nodes.length,
          0,
        ),
        violations: blocking.map(({ id, impact, help, nodes }) => ({
          id,
          impact,
          help,
          targets: nodes.map(({ target }) => target),
        })),
      },
    };
  });
