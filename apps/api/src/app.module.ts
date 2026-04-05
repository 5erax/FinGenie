import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthModule } from "./health/health.module";
import { PrismaModule } from "./prisma";
import { FirebaseAdminModule } from "./firebase";
import { AuthModule } from "./auth";
import { UserModule } from "./user";
import { CategoryModule } from "./category";
import { WalletModule } from "./wallet";
import { TransactionModule } from "./transaction";
import { SavingPlanModule } from "./saving-plan";
import { AlertModule } from "./alert";
import { AiChatModule } from "./ai-chat";
import { PaymentModule } from "./payment";
import { GamificationModule } from "./gamification";
import { AdminModule } from "./admin";

@Module({
  imports: [
    /**
     * ConfigModule loads environment variables globally so any module can
     * inject ConfigService without re-importing ConfigModule.
     */
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    PrismaModule,
    FirebaseAdminModule,
    AuthModule,
    UserModule,
    CategoryModule,
    WalletModule,
    TransactionModule,
    AlertModule,
    SavingPlanModule,
    AiChatModule,
    PaymentModule,
    GamificationModule,
    AdminModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
