import bytes from 'bytes';
import {
    FileTypeValidator,
    HttpStatus,
    MaxFileSizeValidator,
    ParseFilePipe,
} from '@nestjs/common';
import { FileSignatureValidator } from './validators/file-signature.validator';
import { FileValidator } from '@nestjs/common/pipes/file/file-validator.interface';
import { FileSizeType, FileType } from './types/file.types';
import { createFileTypeRegex } from './utils/file.util';
import { NonEmptyArray } from './utils/array.util';
import { UnprocessableEntityException } from '../error-handling/custom-exceptions/un-proccessable-entity.exception';

const createFileValidators = (
    maxSize: FileSizeType,
    fileTypes: NonEmptyArray<FileType>,
): FileValidator[] => {
    const fileTypeRegex = createFileTypeRegex(fileTypes);
    return [
        new MaxFileSizeValidator({
            maxSize: bytes(maxSize) || 5 * 1024 * 1024,
            errorMessage: (ctx) => {
                return `File is too big. Max file size is ${maxSize}, but the actual size is ${bytes(ctx.file?.size)}`;
            },
        }),
        new FileTypeValidator({
            fileType: fileTypeRegex,
        }),
        new FileSignatureValidator(),
    ];
};

export const createParseFilePipe = (
    maxSize: FileSizeType,
    fileTypes: NonEmptyArray<FileType>,
): ParseFilePipe =>
    new ParseFilePipe({
        validators: createFileValidators(maxSize, fileTypes),
        errorHttpStatusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
        exceptionFactory: (error: string) => {
            throw new UnprocessableEntityException(error);
        },
        fileIsRequired: true,
    });
