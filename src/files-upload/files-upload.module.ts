import { Module } from '@nestjs/common';
import { FilesUploadService } from './files-upload.service';
import { UploadMultipleFilesUseCase } from './use-cases/upload-multiple-files.usecase';
import { UploadSingleFileUseCase } from './use-cases/upload-single-file.usecase';
import { DeleteFileByUrlUseCase } from './use-cases/delete-file-by-url.usecase';
import { CloudinaryFileStorageService } from './storage/cloudinary.service';

@Module({
    providers: [
        FilesUploadService,
        DeleteFileByUrlUseCase,
        UploadSingleFileUseCase,
        UploadMultipleFilesUseCase,
        CloudinaryFileStorageService
    ],
    exports: [FilesUploadService],
})
export class FilesUploadModule { }
