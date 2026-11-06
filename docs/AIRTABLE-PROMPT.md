# Prompt: Pull the team from Airtable with Claude in Chrome

## How to use it

1. Open Chrome and sign in to Airtable.
2. Open the Pillar 5 base that has the staff list (the same base used for the intern absenteeism system, if that is where staff are kept).
3. Open the Claude in Chrome extension.
4. Copy the prompt below, paste it into Claude in Chrome, and send it.
5. Claude gives back a JSON block. Copy the whole block.
6. In the demo, go to **Manager > Team and settings > Load the team from Airtable**, paste it, and click **Import team**.

---

## The prompt (copy everything in the box)

```
I am building a client hours tracker for Pillar 5 Group. Please read our Airtable base in the open tab and collect the staff list. Only read, do not change anything in Airtable.

1. Look at the tables in this base and find the one that lists staff or employees. Tell me which table you used.
2. For each person, get:
   - Full name
   - Job title or role
   - Department
3. Only keep people in these departments: ICT, Acquisitions, Marketing, Management. If a department has a slightly different name (for example "IT" or "Information Technology"), map it to the closest one of these four and tell me what you mapped.
4. If the base has a table of client projects, also list the project names. If not, leave the projects list empty.
5. Skip anyone marked as inactive, resigned or no longer working here.
6. Do not include phone numbers, ID numbers, emails or any other personal details. Only name, role and department.

Give me the result as one JSON block in exactly this shape, with nothing else inside the block:

{
  "departments": [
    {"name": "ICT"},
    {"name": "Acquisitions"},
    {"name": "Marketing"},
    {"name": "Management"}
  ],
  "staff": [
    {"name": "Full Name", "role": "Job Title", "department": "ICT"}
  ],
  "projects": [
    {"name": "Project name"}
  ]
}

After the JSON block, give me a short list of:
- which table you used
- any people you skipped and why
- any department names you mapped
- any people with a missing role or department
```

---

## Notes

- The import replaces the sample team and clears the sample entries.
- If the JSON has no "Management" department, the demo adds one so approvals still work. Put Mrs Candice and the project manager under Management.
- If there are no projects in Airtable, the demo adds one called "General work". You can ask Mrs Candice for the real project names.
