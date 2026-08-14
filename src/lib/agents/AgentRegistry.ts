import { BaseAgent } from './BaseAgent';
import {
  ResumeEvaluatorAgent,
  MockInterviewCopilotAgent,
  SecurityJudgeAgent,
  CommunicationCoachAgent,
  JdGeneratorAgent,
  CandidateMatchmakerAgent,
} from './OperationalAgents';

export class AgentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AgentNotFoundError';
  }
}

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, BaseAgent> = new Map();

  private constructor() {
    // Register the 6 operational agents
    this.register(new ResumeEvaluatorAgent());
    this.register(new MockInterviewCopilotAgent());
    this.register(new SecurityJudgeAgent());
    this.register(new CommunicationCoachAgent());
    this.register(new JdGeneratorAgent());
    this.register(new CandidateMatchmakerAgent());
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public register(agent: BaseAgent): void {
    this.agents.set(agent.agentId, agent);
  }

  public get(agentId: string): BaseAgent {
    const agent = this.agents.get(agentId);
    if (!agent) {
      throw new AgentNotFoundError(`Agent with ID '${agentId}' is not registered.`);
    }
    return agent;
  }

  public getRegisteredAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }
}
