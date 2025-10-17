import { AIService, getAIService, initializeAI } from './ai.service';
import { EnhancedAIService, getEnhancedAIService } from './enhanced-ai.service';
import { mcpClient } from '../mcp/client';
import { 
  mcpServer,
  manageChatContextTool,
  moderateContentTool,
  evaluateQuizTool
} from '../mcp/server';
import { logger } from '../utils/logger';

/**
 * A container for managing singleton service instances.
 */
export const services = {
  ai: getAIService,
  enhancedAI: getEnhancedAIService,
  mcpClient: () => mcpClient,
};

/**
 * Initializes all core application services in the correct order.
 * This function ensures that dependencies are ready before dependent services are started.
 */
export const initializeServices = async (): Promise<void> => {
  try {
    // 1. Initialize the base AI service.
    await initializeAI();
    logger.info('✅ Core services initialized.');

    // 2. Start the MCP server, which can now safely use the AI service.
    await mcpServer.start({
      transportType: 'httpStream',
      httpStream: { port: 3002 },
    });
    logger.info('✅ MCP Server started on port 3002.');

    // 3. Pass the server instance and tool handlers to the client and then connect.
    const client = services.mcpClient();
    client.setServerInstance(mcpServer, {
      manageChatContext: manageChatContextTool,
      moderateContent: moderateContentTool,
      evaluateQuiz: evaluateQuizTool
    });
    await client.connect();
    logger.info('✅ MCP Client connected.');

  } catch (error) {
    logger.error('❌ Failed to initialize application services:', error);
    process.exit(1);
  }
};
