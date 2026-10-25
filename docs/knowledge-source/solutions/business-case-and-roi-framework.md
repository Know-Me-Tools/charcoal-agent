---
type: Concept
title: "Business case and ROI framework for KnowMe and Prometheus products"
description: "How to structure cost, benefit and return on investment with your own inputs, with formulas rather than numbers, and what the sources say about cost. KnowMe pricing has not been announced."
status: draft
generated:
  by: km-content-creator/opus
  at: "2026-10-25T00:00:00+00:00"
tags:
  - solutions
  - roi
  - business-case
  - cost
sources:
  - id: pf
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 2"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-site
    resource: https://the-boss.know-me.tools
    title: "The Boss download page"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: boss-readme
    resource: https://github.com/Prometheus-AGS/the-boss/blob/main/README.md
    title: "The Boss README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: uar-readme
    resource: https://github.com/Prometheus-AGS/universal-agent-runtime/blob/main/README.md
    title: "Universal Agent Runtime README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: gate-readme
    resource: https://github.com/Know-Me-Tools/flint-gate/blob/main/README.md
    title: "Flint Gate README"
    last_modified: "2026-10-25T00:00:00+00:00"
  - id: pf3
    resource: https://ipfs.prometheusags.ai/ipfs/bafybeidmp2shm6zpf7bj25iugtbylnzl5ms564lr3vsozuszbp23d63pie/
    title: "KnowMe and Prometheus portfolio, Edition 3, entries dated 25 October 2026 (address of Edition 3 not yet confirmed)"
    last_modified: "2026-10-25T00:00:00+00:00"
---

# Business case and ROI framework for KnowMe and Prometheus products

A visitor asks: "How do I make the case for this, and what will it cost?" This page gives a structure and formulas. It gives no numbers, because the sources give none. KnowMe pricing has not been announced.[^pf] Any figure you put into the formulas is your estimate, and the result is your estimate too.

## Business case framework: what the sources say about cost

- The Boss is free and open source, with no account required to download it. You supply your own model provider credentials.[^boss-site][^boss-readme]
- The Universal Agent Runtime is MIT licensed, and its README says there is no commercial license to buy.[^uar-readme]
- The portfolio lists the Operator Service as "Service and economics design; commercial launch not established."[^pf]
- No source states a price, a tier or a support plan for any product.

Free software still has costs: hosting, model usage billed by your provider, setup time and the time of the people who run and review it.

## Business case framework: the formulas

Use one task as the unit, such as answering a customer question.

- Annual benefit = tasks per year x hours saved per task x loaded hourly cost x share of tasks the tool is actually used for.
- Avoided rework = errors per year before x cost to fix one x fraction removed.
- Annual cost = model usage + hosting + maintenance hours x hourly cost + review hours x hourly cost + one-time setup spread over the years you expect to use it.
- Net benefit = annual benefit + avoided rework - annual cost.
- Return on investment = net benefit / annual cost.
- Payback in months = one-time setup cost / (monthly net benefit).
- Break-even tasks per year = annual cost / (hours saved per task x loaded hourly cost).

## Business case framework: inputs you must supply

1. The task, and how long it takes now. Time ten real examples.
2. Volume: tasks per week.
3. Loaded hourly cost of the people doing it.
4. Model usage: tokens per task x your provider's price per token x volume. Flint Gate counts tokens mid-stream, which can help you measure usage once it is in your stack.[^gate-readme]
5. Review time per output. An agent's draft still needs a person to check it.
6. Hosting and setup hours.

## Business case framework: test the estimate

- Run a pilot of one task for a few weeks and replace each estimate with a measured value.
- Vary adoption and hours saved by plus and minus half. If the sign of net benefit flips, the case is fragile.
- Count the cost of a wrong output, not just a slow one.
- Do not use a speed or cost improvement for any product unless a source shows it. The portfolio found no production-scale benchmark for the Candle-VLLM fork, and the Rust performance skill's edition says no production performance improvement is established.[^pf][^pf3]

## Business case framework: what is not stated

- No source gives time saved, cost saved or return for any product.
- No source states when KnowMe will ship or what it will cost. See [KnowMe platforms and status](/knowme/knowme-platforms-and-status.md).
- A product's status matters to the case. Source without a release carries more delivery risk than a released product, and the product pages state which is which.

## Business case framework: start here

Pick one task and fill in the inputs above. Then ask the KnowMe agent which products fit the task, and what each one's status is.
