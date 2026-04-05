import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { DecimalInterceptor } from "./common/decimal.interceptor";
import { GlobalExceptionFilter } from "./common/http-exception.filter";

async function bootstrap(): Promise<void> {
  const logger = new Logger("NestApplication");

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  // Security middleware
  app.use(helmet());

  // CORS configuration
  const isProduction = process.env.NODE_ENV === "production";
  app.enableCors({
    origin: isProduction
      ? process.env.CORS_ORIGINS
        ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
        : ["http://localhost:3000"]
      : true, // Allow all origins in development (Expo web, LAN devices, etc.)
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Global prefix for all routes
  app.setGlobalPrefix("api/v1");

  // Global interceptor – convert Prisma Decimal → number before JSON serialization
  app.useGlobalInterceptors(new DecimalInterceptor());

  // Global validation pipe – strips unknown props and auto-transforms payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter – normalises all errors to a consistent JSON shape
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger / OpenAPI setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle("FinGenie API")
    .setDescription(
      "REST API powering the FinGenie web admin dashboard and mobile application",
    )
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  // Redirect root to Swagger docs (root is outside /api/v1 prefix)
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get(
    "/",
    (
      _req: unknown,
      res: { redirect: (status: number, url: string) => void },
    ) => {
      res.redirect(302, "/docs");
    },
  );

  const port = process.env.PORT ?? 4000;
  // Listen on all interfaces so LAN devices (Expo on physical phone) can reach the API
  await app.listen(port, "0.0.0.0");

  logger.log(`🚀 Application running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap().catch((err: unknown) => {
  // Fallback logger in case NestJS logger is not yet initialised
  console.error("Fatal error during bootstrap", err);
  process.exit(1);
});
