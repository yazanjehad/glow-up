import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CustomerService } from 'src/modules/customer/customer.service';
 
@Injectable()
export class HasCustomerProfileGuard implements CanActivate {
  constructor(
    private readonly customerService: CustomerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userId = req.user?.sub;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    const customerProfile =
      await this.customerService.findByUserId(userId);

    if (!customerProfile) {
      throw new ForbiddenException(
        'Customer profile is required',
      );
    }

    // Optional: attach profile to request
    req.customerProfile = customerProfile;

    return true;
  }
}
