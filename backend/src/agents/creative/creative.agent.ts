import { BaseAgent } from '../base.agent';
import { AgentName, ContentBlueprint, ResearchDossier, Project } from '@ready2upload/shared';
import { blueprintRepository, costRepository } from '../../db/blueprint.repository';
import { storageService } from '../../storage/storage.service';
import { ProviderFactory } from '../../providers/provider.factory';

export class CreativeAgent extends BaseAgent {
  public readonly name: AgentName = 'CreativeAgent';

  public async run(project: Project, research: ResearchDossier): Promise<ContentBlueprint> {
    return this.executeTask(
      project.id,
      'DEVELOP_CONTENT_BLUEPRINT',
      `Writing script and creative blueprint for: ${project.title}`,
      async (_task, reportProgress) => {
        reportProgress(10, 'Analyzing research findings and defining audience hook...');

        const llm = ProviderFactory.getLLMProvider();

        const wordsNeeded = Math.round((project.targetDurationSec / 60) * 135); // standard speaking cadence

        const prompt = `You are an elite YouTube and social media creative director and master scriptwriter.
Transform the following verified research into a compelling, high-retention video script.

Topic: "${project.topic}"
Project Title: "${project.title}"
Format: ${project.contentType}
Target Duration: ${project.targetDurationSec} seconds (approximately ${wordsNeeded} words)
Visual Style: ${project.visualStyle}
Tone: ${project.tone}
Language: ${project.language}

Research Summary:
"${research.summary}"

Key Evidence / Claims:
${research.keyClaims.map((c) => `- ${c.claim} (Source: ${c.source})`).join('\n')}

Generate:
1. Irresistible 5-second Opening Hook
2. Target Audience Profile
3. Pacing and Tone Directives
4. Complete spoken word narrative script formatted with emotional beats
5. 2-3 High-CTR Thumbnail Concepts with visual prompt and bold text overlay`;

        const schema = `{
  "title": "string",
  "hook": "string",
  "targetAudience": "string",
  "tone": "string",
  "language": "string",
  "estimatedDurationSec": 60,
  "scriptBody": "string spoken script",
  "spokenWordCount": 85,
  "thumbnailConcepts": [
    {
      "concept": "string",
      "visualPrompt": "string visual prompt for AI image generator",
      "textOverlay": "SHORT 2-4 WORDS ALL CAPS"
    }
  ]
}`;

        reportProgress(50, 'Drafting high-retention script with storytelling arc...');

        const { data: blueprint, tokensUsed, costUsd } = await llm.generateJSON<ContentBlueprint>(
          prompt,
          `ContentBlueprint: ${schema}`
        );

        blueprint.projectId = project.id;
        blueprint.language = project.language;
        blueprint.estimatedDurationSec = project.targetDurationSec;

        const actualWordCount = blueprint.scriptBody.trim().split(/\s+/).filter(Boolean).length;
        blueprint.spokenWordCount = actualWordCount;

        costRepository.recordCost({
          projectId: project.id,
          provider: llm.name,
          model: 'llm',
          operation: 'SCRIPT_AND_BLUEPRINT_CREATION',
          tokensUsed,
          costUsd
        });

        reportProgress(85, 'Saving ContentBlueprint and script.md...');

        // Persist to database
        blueprintRepository.saveBlueprint(blueprint);

        // Persist to storage directory
        const scriptMarkdown = `# ${blueprint.title}\n\n**Format:** ${project.contentType} | **Duration:** ~${blueprint.estimatedDurationSec}s | **Tone:** ${blueprint.tone}\n\n## Hook\n> ${blueprint.hook}\n\n## Full Narration Script\n\n${blueprint.scriptBody}\n\n---\n*Spoken Word Count: ${blueprint.spokenWordCount} words*`;
        storageService.writeProjectFile(project.id, 'content/script.md', scriptMarkdown);
        storageService.writeProjectFile(
          project.id,
          'content/ContentBlueprint.json',
          JSON.stringify(blueprint, null, 2)
        );

        reportProgress(100, `Script complete (${blueprint.spokenWordCount} words). Hook created.`);

        return blueprint;
      }
    );
  }
}

export const creativeAgent = new CreativeAgent();
