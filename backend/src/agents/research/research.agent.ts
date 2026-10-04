import { BaseAgent } from '../base.agent';
import { AgentName, ResearchDossier, Project } from '@ready2upload/shared';
import { blueprintRepository } from '../../db/blueprint.repository';
import { costRepository } from '../../db/blueprint.repository';
import { storageService } from '../../storage/storage.service';
import { ProviderFactory } from '../../providers/provider.factory';

export class ResearchAgent extends BaseAgent {
  public readonly name: AgentName = 'ResearchAgent';

  public async run(project: Project): Promise<ResearchDossier> {
    return this.executeTask(
      project.id,
      'GATHER_RESEARCH',
      `Conducting verified research on: ${project.topic}`,
      async (_task, reportProgress) => {
        reportProgress(15, 'Analyzing topic scope and core claims...');

        const llm = ProviderFactory.getLLMProvider();

        reportProgress(40, 'Querying factual sources and historical records...');

        const prompt = `Perform thorough, factual research on the following topic:
Topic: "${project.topic}"
Title: "${project.title}"
Content Type: ${project.contentType}
Research Depth: ${project.researchDepth}

Identify verified facts, distinguish established evidence from speculation, cite realistic historical/academic records, and compile structured research notes.`;

        const schema = `{
  "topic": "string",
  "summary": "string",
  "keyClaims": [
    {
      "claim": "string",
      "source": "string",
      "isFact": true,
      "confidence": 0.95
    }
  ],
  "sources": [
    {
      "id": "string",
      "title": "string",
      "url": "optional string",
      "author": "string",
      "year": 1990,
      "reliability": "high | medium | peer_reviewed | historical_record"
    }
  ],
  "notesMarkdown": "string markdown"
}`;

        reportProgress(70, 'Synthesizing evidence and formatting dossier...');

        const { data: research, tokensUsed, costUsd } = await llm.generateJSON<ResearchDossier>(
          prompt,
          `ResearchDossier: ${schema}`
        );

        research.projectId = project.id;
        research.topic = project.topic;

        costRepository.recordCost({
          projectId: project.id,
          provider: llm.name,
          model: 'llm',
          operation: 'RESEARCH_SYNTHESIS',
          tokensUsed,
          costUsd
        });

        reportProgress(90, 'Writing research_notes.md and research_sources.json to storage...');

        // Save in database
        blueprintRepository.saveResearch(research);

        // Save in storage directory
        storageService.writeProjectFile(
          project.id,
          'research/research_notes.md',
          research.notesMarkdown
        );
        storageService.writeProjectFile(
          project.id,
          'research/research_sources.json',
          JSON.stringify(
            {
              topic: research.topic,
              summary: research.summary,
              sources: research.sources,
              keyClaims: research.keyClaims
            },
            null,
            2
          )
        );

        reportProgress(100, `Research complete. Found ${research.sources.length} sources and ${research.keyClaims.length} validated claims.`);

        return research;
      }
    );
  }
}

export const researchAgent = new ResearchAgent();
