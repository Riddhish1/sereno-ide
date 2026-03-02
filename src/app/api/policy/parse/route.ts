import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const PolicySchema = z.object({
  sourceDocument: z.string().describe("The name or title of the source document"),
  summary: z.string().describe("A 1-2 sentence summary of what this policy covers"),
  constraints: z.array(
    z.object({
      id: z.string().describe("A short unique kebab-case identifier"),
      title: z.string().describe("A short title for the constraint"),
      description: z.string().describe("A clear description of what the constraint requires"),
      confidence: z
        .number()
        .min(0)
        .max(100)
        .describe("Confidence that this is a real actionable constraint (0-100)"),
      enforcement: z
        .enum(["IaC", "Runtime", "API", "Policy"])
        .describe("Where this constraint is best enforced"),
      severity: z
        .enum(["critical", "high", "medium", "low"])
        .describe("Severity if this constraint is violated"),
    })
  ),
});

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json(
      { error: "Only PDF files are supported" },
      { status: 400 }
    );
  }

  // 10 MB limit
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File too large. Maximum size is 10 MB." },
      { status: 400 }
    );
  }

  try {
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const { object } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: PolicySchema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "file",
              data: base64,
              mediaType: "application/pdf",
            },
            {
              type: "text",
              text: `You are a security policy analyzer. Analyze this networking/security policy document and extract all constraints, rules, and requirements.

For each constraint:
- Provide a short kebab-case id (e.g. "no-public-egress")
- Write a concise title
- Describe clearly what the constraint requires or prohibits
- Estimate confidence that this is a real actionable technical constraint (0-100)
- Categorize enforcement location:
    IaC = best enforced in Infrastructure as Code (Terraform, CloudFormation, etc.)
    Runtime = best enforced at runtime (Kubernetes policies, firewalls, etc.)
    API = best enforced at the API/gateway level
    Policy = organizational policy, enforced via governance
- Assign severity: critical / high / medium / low (based on security impact if violated)

Also provide the document name/title and a short summary (1-2 sentences).

Extract as many real constraints as you can find. Ignore generic/boilerplate text.`,
            },
          ],
        },
      ],
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("[policy/parse]", err);
    return NextResponse.json(
      { error: "Failed to analyze document. Make sure it is a readable PDF." },
      { status: 500 }
    );
  }
}
