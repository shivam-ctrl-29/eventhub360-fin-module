import { Controller, Get } from '@nestjs/common';

// Intentionally has zero dependencies (no DB, no services) — a pure liveness
// check. Render/uptime monitors should hit this, not a data endpoint, so a
// transient DB hiccup doesn't get misreported as "the service is down".
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
