
import { GoogleGenAI } from "@google/genai";
import type { AppFile } from '../types';
import {_fetchRemoteHandshake} from '../data/appConfig';
const model = "gemini-3-pro-preview";

function buildPrompt(prompt: string, files: AppFile[], systemInstruction: string): string {
    const fileContents = files.map(file => `
--- START OF FILE ${file.name} ---
${file.content}
--- END OF FILE ${file.name} ---
`).join('\n');

    // Regex to detect QC-related keywords
    const isQcRequest = /\b(quality control|qc check|perform qc|check on)\b/i.test(prompt);
    
    // Regex to detect explanation requests that mention a filename
    const fileNamesInPrompt = files.map(f => f.name.split('/').pop()!).filter(Boolean);
    const isExplainRequest = /\b(explain|describe|break down|walk through)\b/i.test(prompt) && fileNamesInPrompt.some(name => prompt.includes(name));

    const qcInstructions = `
SPECIAL INSTRUCTIONS FOR QUALITY CONTROL (QC) REQUESTS:
The user is asking for a quality control check. You must follow this specific workflow:
1.  Do NOT modify the original file mentioned in the user's request.
2.  Instead, you must create a NEW file. This new file will be a copy of the original but with your QC comments added.
3.  You must name the new file by taking the original filename and adding "_qc" before the file extension. For example, if the original is "run01.mod", the new file must be named "run01_qc.mod". If the original is "script.R", the new file must be "script_qc.R".
4.  In this new "_qc" file, add your quality control findings, suggestions, and summaries as comments appropriate for the file's language.
5.  Crucially, every comment you add for the QC review MUST be prefixed with " Dr. Liam QC:". For example:
    - In a NONMEM file: ; Dr. Liam QC: This is a finding.
    - In an R file: # Dr. Liam QC: This is a finding.
    - In a MATLAB file: % Dr. Liam QC: This is a finding.
6.  Place these comments in relevant sections of the code to provide context.
7.  Your entire response must be within the <changes> XML format, containing a single <change> block with the full content of the new "_qc" file.
`;

    const explanationInstructions = `
SPECIAL INSTRUCTIONS FOR EXPLANATION REQUESTS:
The user is asking for an explanation of a file. You must follow this specific workflow:
1.  Do NOT modify the original file mentioned in the user's request.
2.  You must create a NEW file. This new file will contain your detailed explanation.
3.  The new file must be a Markdown file (.md).
4.  You must name the new file by taking the original filename, removing its extension, and adding "_explain.md". For example, if the original is "run01.mod", the new file must be named "run01_explain.md". If the original is "models/script.R", the new file must be "models/script_explain.md".
5.  In this new "_explain.md" file, provide a comprehensive, well-structured explanation of the original file's content. Use Markdown formatting (headings, lists, code blocks) for clarity.
6.  Your entire response must be within the <changes> XML format, containing a single <change> block with the full content of the new "_explain.md" file.
`;

    let specialInstructions = '';
    if (isQcRequest) {
        specialInstructions = qcInstructions;
    } else if (isExplainRequest) {
        specialInstructions = explanationInstructions;
    }

    return `
${systemInstruction} You are helpful, precise, and follow instructions carefully.
The user wants to make changes to their project.
Here is the user's request: "${prompt}"

${specialInstructions || 'Based on the user request, determine which files to create, modify, or delete.'}

**MANDATORY FILE ORGANIZATION**:
- Model files (.mod, .ctl) MUST be placed in "Models/" folder.
- Script files (.R, .py, .jl, .m) MUST be placed in "Scripts/" folder.
- Data files (.csv, .xpt, .xls) MUST be placed in "Data/" folder.
- Result files (.txt output, .pdf plots) MUST be placed in "Results/" folder.
- Data Analysis Plan documents MUST be placed in "Initial Plan/" or "Final Plan/".
- Reports MUST be placed in "Initial Reports/" or "Final Reports/".
- Presentations MUST be placed in "Abstracts/", "Posters/", or "Talks/".

**CRITICAL RULES**:
1. You are **STRICTLY FORBIDDEN** from renaming or deleting the following top-level project folders: "Data", "Models", "Scripts", "Results", "Initial Plan", "Final Plan", "Initial Reports", "Final Reports", "Abstracts", "Posters", "Talks", "My Workflows".
2. You MAY create, rename, or delete *files* within these folders.
3. You MAY create, rename, or delete *subfolders* within these folders (e.g., "Models/Base_Model/", "Scripts/Exploratory/").
4. If the user asks to "delete the models folder", you should delete the *contents* of the Models folder or ask for clarification, but NEVER delete the folder itself.

Here are the current files in the project. File names include the full path from the root.
${fileContents}

Please provide the necessary changes to fulfill the user's request.
To update files, you must output the following XML format. Do not add any other text or explanation before or after the XML.

<changes>
  <change>
    <file>[full_path_of_file_1]</file>
    <description>[description of change]</description>
    <content><![CDATA[Full content of file_1]]></content>
  </change>
  <change delete="true">
    <file>[full_path_of_file_to_delete]</file>
    <description>[description of why it is being deleted]</description>
  </change>
</changes>

- To create a new folder, provide its path ending with a forward slash (e.g., "Models/Base_Model/") and leave the content empty.
- To delete a file or an empty folder (that is NOT a root folder), add a \`delete="true"\` attribute to the \`<change>\` tag. You do not need a \`<content>\` tag for deletions.
- Parent directories will be created automatically if they don't exist.
- If creating both folders and files, list all <change> blocks for folders before the <change> blocks for files.
- Only include files or folders that need to be created, modified, or deleted.
- If you are creating a file, provide its full path including the new filename.
- **IMPORTANT RULE**: All file paths for any file operation (create, edit, delete, update) MUST be within one of the existing project subfolders. You cannot create, edit, or delete files or folders at the root level. All file paths in the <file> tag must start with one of the main project folders (e.g., "Data/", "Models/", "Scripts/", "Results/", "Initial Plan/", "Final Plan/", "Initial Reports/", "Final Reports/", "Abstracts/", "Posters/", "Talks/").
- If no files need to be changed, or if you have a clarifying question, respond with a message inside a <message> tag instead.
For example: <message>I'm not sure which file you want me to modify. Could you please clarify?</message>
`;
}


export async function generateCode(prompt: string, files: AppFile[], systemInstruction: string): Promise<string> {
  const fullPrompt = buildPrompt(prompt, files, systemInstruction);

  try {
    const apiKey = await _fetchRemoteHandshake();
    if (!apiKey) {
       console.warn("API Key is missing in process.env");
    }
    const aiInstance = new GoogleGenAI({ apiKey });
    const response = await aiInstance.models.generateContent({
      model: model,
      contents: fullPrompt,
    });

    return response.text;

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    if (error instanceof Error) {
        if (error.message.includes('API key not valid') || error.message.includes('API Key must be set')) {
            return `<message>The provided API key is missing or not valid. Please ensure 'process.env.API_KEY' is correctly set in your environment.</message>`;
        }
        return `<message>Error from API: ${error.message}. It is possible that your organization has banned connection to Gemini model API. Sorry.</message>`;
    }
    return `<message>An unknown error occurred while contacting the API.</message>`;
  }
}
