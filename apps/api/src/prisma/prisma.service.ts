import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log:
        process.env.NODE_ENV === "production"
          ? [{ emit: "event", level: "error" }]
          : [
              { emit: "event", level: "warn" },
              { emit: "event", level: "error" },
            ],
    });
  }

  async onModuleInit() {
    // Log slow queries and errors
    (this as any).$on("error", (e: any) => {
      this.logger.error(`Prisma error: ${e.message}`);
    });

    (this as any).$on("warn", (e: any) => {
      this.logger.warn(`Prisma warning: ${e.message}`);
    });

    await this.$connect();
    this.logger.log("Database connected");
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }
}
