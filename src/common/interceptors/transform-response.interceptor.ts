import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';
import { PaginatedResult } from '../data-access';

@Injectable()
export class TransformResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((response: unknown) => {
                if (!response) {
                    return { data: [] };
                }

                if (response instanceof PaginatedResult) {
                    return {
                        data: response.data,
                        meta: response.meta,
                    };
                }

                return { data: response };
            }),
        );
    }
}