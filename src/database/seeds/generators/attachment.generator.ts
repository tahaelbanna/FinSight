export interface SeedAttachmentRaw {
    expense_id: string;
    file_name: string;
    file_path: string;
    content_type: string;
    file_size_bytes: number;
    uploaded_at: Date;
}

export function generateSeedAttachments(expenseIds: string[]): SeedAttachmentRaw[] {
    const attachments: SeedAttachmentRaw[] = [];
    const mimeTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    const extensions = ['pdf', 'jpg', 'png'];

    // Generate ~1,600 attachments (for approx 57% of expenses)
    const TARGET_COUNT = 1600;
    const step = expenseIds.length / TARGET_COUNT;

    for (let i = 0; i < TARGET_COUNT && i * step < expenseIds.length; i++) {
        const expIndex = Math.floor(i * step);
        const expId = expenseIds[expIndex];
        const mimeIndex = i % 3;
        const ext = extensions[mimeIndex];
        const mime = mimeTypes[mimeIndex];

        const fileName = `receipt_exp_${expId}_${i + 1}.${ext}`;
        // Deterministic path with seed marker
        const filePath = `https://res.cloudinary.com/finsight/image/upload/v1/seed_receipt_${expId}_${i + 1}.${ext}`;
        const fileSizeBytes = 120000 + ((i * 1337) % 1800000); // 120 KB to ~1.9 MB

        attachments.push({
            expense_id: expId,
            file_name: fileName,
            file_path: filePath,
            content_type: mime,
            file_size_bytes: fileSizeBytes,
            uploaded_at: new Date('2024-01-15T10:00:00Z'),
        });
    }

    return attachments;
}
