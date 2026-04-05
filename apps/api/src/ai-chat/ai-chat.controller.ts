import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import type { Response } from "express";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import type { User } from "@prisma/client";
import { AiChatService } from "./ai-chat.service";
import { CreateSessionDto, QuerySessionsDto, SendMessageDto } from "./dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";

@ApiTags("AI Coach")
@ApiBearerAuth()
@Controller("ai-chat")
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  /**
   * NOTE: GET /ai-chat/status must be declared BEFORE any route containing a
   * dynamic `:sessionId` segment so NestJS does not treat the literal string
   * "status" as a session identifier.
   */
  @Get("status")
  @ApiOperation({ summary: "Get AI availability and today's message count" })
  @ApiOkResponse({
    description:
      "Returns AI availability flag, messages used today, daily limit, and premium status",
    schema: {
      properties: {
        available: { type: "boolean" },
        todayMessages: { type: "number" },
        dailyLimit: { type: "number", nullable: true },
        isPremium: { type: "boolean" },
      },
    },
  })
  async getStatus(@CurrentUser() user: User) {
    return this.aiChatService.getStatus(user);
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────

  @Get("sessions")
  @ApiOperation({ summary: "List all chat sessions for the current user" })
  @ApiOkResponse({ description: "Paginated list of AI chat sessions" })
  async findAllSessions(
    @CurrentUser() user: User,
    @Query() query: QuerySessionsDto,
  ) {
    return this.aiChatService.findAllSessions(user.id, query);
  }

  @Post("sessions")
  @ApiOperation({ summary: "Create a new chat session" })
  @ApiCreatedResponse({ description: "Chat session created successfully" })
  async createSession(
    @CurrentUser() user: User,
    @Body() dto: CreateSessionDto,
  ) {
    return this.aiChatService.createSession(user.id, dto);
  }

  @Get("sessions/:sessionId")
  @ApiOperation({ summary: "Get a chat session with all its messages" })
  @ApiOkResponse({ description: "Chat session with ordered message history" })
  @ApiNotFoundResponse({ description: "Session not found" })
  async findSessionById(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string,
  ) {
    return this.aiChatService.findSessionById(user.id, sessionId);
  }

  @Delete("sessions/:sessionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a chat session and all its messages" })
  @ApiNoContentResponse({ description: "Session deleted successfully" })
  @ApiNotFoundResponse({ description: "Session not found" })
  async deleteSession(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string,
  ) {
    await this.aiChatService.deleteSession(user.id, sessionId);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  @Post("sessions/:sessionId/messages/stream")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Send a message and stream the AI response via SSE",
  })
  @ApiNotFoundResponse({ description: "Session not found" })
  @ApiForbiddenResponse({ description: "Daily free message limit reached" })
  async sendMessageStream(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
  ) {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    try {
      for await (const event of this.aiChatService.sendMessageStream(
        user,
        sessionId,
        dto,
      )) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const statusCode = (error as { status?: number }).status ?? 500;
      res.write(
        `data: ${JSON.stringify({ type: "error", message, statusCode })}\n\n`,
      );
    }

    res.end();
  }

  @Post("sessions/:sessionId/messages")
  @ApiOperation({ summary: "Send a message and receive an AI response" })
  @ApiCreatedResponse({
    description: "Returns the saved user message and AI assistant reply",
    schema: {
      properties: {
        userMessage: { type: "object" },
        assistantMessage: { type: "object" },
      },
    },
  })
  @ApiNotFoundResponse({ description: "Session not found" })
  @ApiForbiddenResponse({
    description:
      "Daily free message limit reached — upgrade to Premium for unlimited chat",
  })
  async sendMessage(
    @CurrentUser() user: User,
    @Param("sessionId") sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.aiChatService.sendMessage(user, sessionId, dto);
  }
}
