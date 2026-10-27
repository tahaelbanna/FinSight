import { Injectable } from '@nestjs/common';
import { CloudinaryFileStorageService } from '../storage/cloudinary.service';

@Injectable()
export class DeleteFileByUrlUseCase {
    constructor(private readonly cloudinaryFileStorageService: CloudinaryFileStorageService) { }
    async execute(url: string | string[]): Promise<void> {
        return this.cloudinaryFileStorageService.deleteFiles(url);
    }
}
