import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { ProviderService } from 'src/modules/provider/provider.service';
 
@Injectable()
export class HasProviderProfileGuard implements CanActivate {
  constructor(
    private readonly providerService: ProviderService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.sub;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const providerProfile =
      await this.providerService.findByUserId(userId);

    if (!providerProfile) {
      throw new ForbiddenException(
        'Provider profile is required',
      );
    }

    if (providerProfile.status !== 'APPROVED') {
      throw new ForbiddenException(
        'Provider profile is not approved yet',
      );
    }

    // Optional: attach profile to request
    req.providerProfile = providerProfile;

    return true;
  }
}
