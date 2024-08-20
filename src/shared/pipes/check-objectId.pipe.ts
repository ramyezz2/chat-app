import {
  PipeTransform,
  Injectable,
  HttpException,
  HttpStatus,
  ArgumentMetadata,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class checkObjectIdPipe implements PipeTransform<any, Types.ObjectId> {
  transform(value: any, metadata: ArgumentMetadata): Types.ObjectId {
    const validObjectId = Types.ObjectId.isValid(value);

    if (!validObjectId) {
      //   throw new BadRequestException('Invalid ObjectId');
      throw new HttpException(
        {
          message: 'Input data validation failed',
          errors: [`Invalid ${metadata?.data}.`],
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return new Types.ObjectId(value);
  }
}
