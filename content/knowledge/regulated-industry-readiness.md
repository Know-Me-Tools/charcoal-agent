# Regulated industries: what KnowMe does and does not claim (Solutions)

A visitor from a regulated industry asks whether this meets their health-privacy rules. KnowMe AI, LLC makes no claim that any product is HIPAA compliant, and no product repository claims it. No repository claims handling of protected health information, encryption of stored data or any certification either. Whether your use meets your rules is a decision for your own counsel and advisers, and these pages do not answer it. The KnowMe Concierge cannot answer it, and a chat reply is not legal advice.

## Regulated industries: the design (Solutions)

The products are designed to run on the customer's own hardware rather than in a shared service. The Universal Agent Runtime binds to 127.0.0.1 by default, and an opt-in mode, UAR_LOCAL_ONLY=1, refuses model providers that are not on the local machine. That is a design that keeps text on your machine when you turn it on and run a local model. It is not a statement that any rule is met. See [Private deployment checklist](/solutions/private-deployment-checklist.md).

Source: Universal Agent Runtime v1.3.0 source: server configuration, retrieved 2026-10-26.
Source: Universal Agent Runtime v1.3.0 source: local-only inference mode, retrieved 2026-10-26.

## Regulated industries: the Google GKE option (Solutions)

This section is the company's own statement, supplied by the company. No product repository supports it, and this page has not verified it. The company says it can run these products for a customer in its Google GKE environment instead of on the customer's hardware, and, although no product repository supports this, it describes that environment as HIPAA compliant. That statement is not a certification, a business associate agreement, an audit result or legal advice. A buyer should ask the company for the documents behind it before relying on it. The Concierge will repeat only this attributed statement and will not add to it.

## Regulated industries: what to ask for (Solutions)

1. Which environment runs the product: your hardware, or the company's Google GKE environment?
2. What written agreement covers your data in that environment, and who signs it?
3. What audit or assessment documents exist, who produced them and what date do they carry?
4. Which data leaves the environment, including to a model provider, and where is it stored?
5. What does the product record about each answer, and for how long is it kept? See [Audit and provenance](/solutions/audit-and-provenance.md).

## Regulated industries: what is not claimed (Solutions)

- No product has an independent audit stated in a source.
- No source states how long this site keeps server-side conversation state; the KnowMe privacy page says that has not been published.
- No source says any product here is suitable for patient or client records. See [Discuss AI for a clinic or small team](/solutions/discuss-ai-for-a-clinic-or-small-team.md).

## Regulated industries: start here (Solutions)

Write down which rules apply to your data and ask your counsel what the product must show. Then ask the KnowMe Concierge which pieces could meet your needs and what each one's status is, or contact the team through the site.
