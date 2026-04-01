import { NestFactory, HttpAdapterHost } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const logger = new Logger("NestApplication");

  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log", "debug", "verbose"],
  });

  // Security middleware
  app.use(helmet());

  // TODO: configure CORS origins
  app.enableCors();

  // Global prefix for all routes
  app.setGlobalPrefix("api/v1");

  // Global validation pipe – strips unknown props and auto-transforms payloads
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

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
  await app.listen(port);

  logger.log(`🚀 Application running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs available at http://localhost:${port}/docs`);
}

bootstrap().catch((err: unknown) => {
  // Fallback logger in case NestJS logger is not yet initialised
  console.error("Fatal error during bootstrap", err);
  process.exit(1);
});
