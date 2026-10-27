import { Injectable } from '@nestjs/common';
import { CloudinaryFileStorageService } from '../storage/cloudinary.service';
import { MulterFile } from '../types/file-type.types';

@Injectable()
export class UploadMultipleFilesUseCase {
    constructor(private readonly cloudinaryFileStorageService: CloudinaryFileStorageService) { }
    async execute(files: MulterFile[]): Promise<string[]> {
        const uploadPromises: Promise<string>[] = files.map(
            (file): Promise<string> =>
                this.cloudinaryFileStorageService.uploadSingleFile(file),
        );
        return Promise.all(uploadPromises);
    }
}
