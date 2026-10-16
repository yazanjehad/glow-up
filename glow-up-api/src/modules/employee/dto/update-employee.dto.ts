import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';
// import { EmployeeStatus } from '../schemas/employee.schema';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateEmployeeDto extends PartialType(
  CreateEmployeeDto,
) {
    // @ApiPropertyOptional({
    //   enum: EmployeeStatus,
    //   example: EmployeeStatus.ACTIVE,
    // })
    // @IsOptional()
    // @IsEnum(EmployeeStatus)
    // status?: EmployeeStatus;


}
