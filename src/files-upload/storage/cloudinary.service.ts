import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentInterface } from '../../common/configuration/environment.interface';
import { MulterFile } from '../../files-upload/types/file-type.types';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';
import { BadRequestException } from '../../common/error-handling/custom-exceptions/bad-request.exception';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';

@Injectable()
export class CloudinaryFileStorageService {
    private cloudName: string;
    private apiKey: string;
    private apiSecret: string;
    private readonly folderName = 'esqoun';

    constructor(
        private readonly configService: ConfigService<EnvironmentInterface>,
        private readonly i18NService: I18nService,
    ) {
        this.cloudName = this.configService.get<string>(
            'cloudinary.cloudinaryCloudName',
            { infer: true },
        );
        this.apiKey = this.configService.get<string>(
            'cloudinary.cloudinaryApiKey',
            { infer: true },
        );
        this.apiSecret = this.configService.get<string>(
            'cloudinary.cloudinaryApiSecret',
            { infer: true },
        );

        cloudinary.config({
            cloud_name: this.cloudName,
            api_key: this.apiKey,
            api_secret: this.apiSecret,
        });
    }

    async uploadSingleFile(file: MulterFile): Promise<string> {
        const uniqueFileName = this.generateUniqueFileName(file);

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: this.folderName,
                    public_id: uniqueFileName,
                    resource_type: 'auto',
                },
                (error, result: UploadApiResponse | undefined) => {
                    if (error || !result) {
                        reject(
                            new BadRequestException(
                                this.i18NService.translate(
                                    'files.FILE_UPLOAD_FAILED',
                                ),
                            ),
                        );
                    } else {
                        resolve(result.secure_url);
                    }
                },
            );

            Readable.from(file.buffer).pipe(uploadStream);
        });
    }

    async deleteFiles(url: string | string[]): Promise<void> {
        const urls = Array.isArray(url) ? url : [url];
        if (urls.length === 0) return;

        try {
            const deletePromises = urls.map((fileUrl) => {
                const publicId = this.extractPublicIdFromUrl(fileUrl);
                if (!publicId) return Promise.resolve();

                return new Promise<void>((resolve, reject) => {
                    cloudinary.uploader.destroy(
                        publicId,
                        { invalidate: true },
                        (error) => {
                            if (error) {
                                reject(error);
                            } else {
                                resolve();
                            }
                        },
                    );
                });
            });

            await Promise.all(deletePromises);
        } catch {
            throw new BadRequestException(
                this.i18NService.translate('files.FILE_DELETE_FAILED'),
            );
        }
    }

    private generateUniqueFileName(file: MulterFile): string {
        const originalName = file.originalname ?? file.filename;
        const originalNameWithoutExt = originalName
            ? originalName.substring(0, originalName.lastIndexOf('.')) || originalName
            : 'file';
        const fileName = `${Date.now()}-${originalNameWithoutExt}`;
        return fileName;
    }

    private extractPublicIdFromUrl(url: string): string | null {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const parts = pathname.split('/');
            const uploadIndex = parts.findIndex((part) => part === 'upload');

            if (uploadIndex === -1) return null;

            let startIndex = uploadIndex + 1;
            if (parts[startIndex] && /^v\d+$/.test(parts[startIndex])) {
                startIndex++;
            }

            const publicIdWithExtension = parts.slice(startIndex).join('/');

            const lastDotIndex = publicIdWithExtension.lastIndexOf('.');
            if (lastDotIndex !== -1) {
                return publicIdWithExtension.substring(0, lastDotIndex);
            }

            return publicIdWithExtension;
        } catch {
            return null;
        }
    }
}
