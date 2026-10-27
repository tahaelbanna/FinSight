import { Injectable } from '@nestjs/common';
import { CloudinaryFileStorageService } from '../storage/cloudinary.service';
import { MulterFile } from '../types/file-type.types';

@Injectable()
export class UploadSingleFileUseCase {
    constructor(private readonly cloudinaryFileStorageService: CloudinaryFileStorageService) { }
    async execute(file: MulterFile): Promise<string> {
        return this.cloudinaryFileStorageService.uploadSingleFile(file);
    }
}
