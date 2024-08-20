import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    // const request = ctx.getRequest();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    console.log(exception);
    if (status === HttpStatus.UNAUTHORIZED) {
      response.status(status).json({
        message: exception['message'],
        statusCode: status,
      });
    } else {
      if (
        exception['response'] &&
        Array.isArray(exception['response']['message'])
      ) {
        const messageArr = exception['response']['message'];
        const errorsObj = {};
        messageArr.forEach((element) => {
          const probArr = element.split(' ');
          const prob = probArr[0];
          probArr.shift();
          const message = probArr.join(' ');
          !errorsObj[prob]
            ? (errorsObj[prob] = message)
            : (errorsObj[prob] = errorsObj[prob] + ' , ' + message);
        });
        response.status(status).json({
          message: exception['response']['error'],
          errors: errorsObj,
        });
      } else {
        response.status(status).json({
          // statusCode: status,
          message: exception['response']['message'],
          errors: exception['response']['errors'],
        });
      }
    }
  }
}
