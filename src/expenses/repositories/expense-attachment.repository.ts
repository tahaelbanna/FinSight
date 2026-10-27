import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../../common/data-access';
import { ExpenseAttachment } from '../schemas/expense-attachment.schema';

@Injectable()
export class ExpenseAttachmentRepository extends BaseRepository<ExpenseAttachment> {
    constructor(
        @InjectRepository(ExpenseAttachment)
        private readonly attachmentRepository: Repository<ExpenseAttachment>,
    ) {
        super(attachmentRepository);
    }
}