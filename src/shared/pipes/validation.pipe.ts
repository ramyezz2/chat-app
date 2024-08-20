import {
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  HttpStatus,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('No data submitted');
    }

    const { metatype } = metadata;

    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors: this.buildError(errors),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return value;
  }

  private buildError(errors, result?, propertyPrefix?: string) {
    result = result || {};
    propertyPrefix = propertyPrefix || '';
    errors.forEach(({ property, constraints, children }) => {
      if (constraints) {
        Object.entries(constraints).forEach((constraint) => {
          result[propertyPrefix + property] = `${constraint[1]}`;
        });
      }

      if (children.length) {
        this.buildError(
          children,
          result,
          `${propertyPrefix ? propertyPrefix + property : property}.`,
        );
      }
    });

    return result;
  }

  private toValidate(metatype): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.find((type) => metatype === type);
  }
}
