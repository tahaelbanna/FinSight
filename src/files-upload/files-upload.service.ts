import { Injectable } from '@nestjs/common';
import { UploadSingleFileUseCase } from './use-cases/upload-single-file.usecase';
import { UploadMultipleFilesUseCase } from './use-cases/upload-multiple-files.usecase';
import { DeleteFileByUrlUseCase } from './use-cases/delete-file-by-url.usecase';
import { MulterFile } from '../files-upload/types/file-type.types';

@Injectable()
export class FilesUploadService {
    constructor(
        private readonly uploadSingleFileUseCase: UploadSingleFileUseCase,
        private readonly uploadMultipleFilesUseCase: UploadMultipleFilesUseCase,
        private readonly deleteFileByUrlUseCase: DeleteFileByUrlUseCase,
    ) {}

    async uploadSingleFile(file: MulterFile): Promise<string> {
        return this.uploadSingleFileUseCase.execute(file);
    }

    async uploadMultipleFiles(files: MulterFile[]): Promise<string[]> {
        return this.uploadMultipleFilesUseCase.execute(files);
    }

    async deleteFileByUrl(url: string | string[]): Promise<void> {
        return this.deleteFileByUrlUseCase.execute(url);
    }
}
