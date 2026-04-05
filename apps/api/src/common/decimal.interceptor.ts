import {
  Injectable,
  type NestInterceptor,
  type ExecutionContext,
  type CallHandler,
} from "@nestjs/common";
import { type Observable, map } from "rxjs";
import { Prisma } from "@prisma/client";

/**
 * Recursively converts Prisma Decimal instances to plain numbers
 * so JSON serialization produces `1000` instead of `"1000.00"`.
 */
function convertDecimals(value: unknown): unknown {
  if (value instanceof Prisma.Decimal) {
    return value.toNumber();
  }

  if (value instanceof Date) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(convertDecimals);
  }

  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = convertDecimals(val);
    }
    return result;
  }

  return value;
}

@Injectable()
export class DecimalInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(map((data) => convertDecimals(data)));
  }
}
