2.
Tenant Badge (Private / Customer Mode Toggle)
Top-left badge:
Sereno Private Tenant
or
Customer Private Tenant
Switchable toggle.
3. .
Policy Inbox (Drag & Parse)
A visible drop zone:
“Drop Networking / Security PDFs. Constraints auto-applied.”
After upload → show:
Extracted constraints list
Source document reference
Confidence %
Enforcement location (IaC / runtime / API)
4. .
Visible Policy Compliance Status (Always On)
A persistent green / yellow / red “Policy Status” pill in the top bar.
Green: “Compliant with uploaded network & security policies”
Click → opens compliance report
Shows which rules were enforced
5. .
Approval Gate UI (Named Approvers + SLA)
When generating infra or PR:
Shows:
Required approvers (Security, Infra, Data Owner)
SLA timer
“Request Approval” button
6. .
Immutable Audit Log (Exportable PDF)
Tab: Audit
Who generated what
When
Policy check result
Signed export button
7. .
Cost & Blast Radius Estimator
Before deploy:
“Estimated monthly cost: ₹X”
“External endpoints: 0”
“Privileged roles required: 2”
8. .
Model Disclosure + Control
Visible model chip:
Opus 4.6 · Private Tenant
9. .
Pre-Merge Policy Check (Blocking)
Every PR shows:
✔ Lint
✔ Security Scan
✔ Policy Compliance
✖ Egress Violation (example)