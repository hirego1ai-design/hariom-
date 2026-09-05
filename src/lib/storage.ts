import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireStorageEnv } from "@/lib/env";

const DEV_STORAGE_ROOT = path.resolve(process.cwd(), ".data", "private-uploads");

export class StorageUnavailableError extends Error {
  constructor(message = "Private file storage is unavailable") {
    super(message);
    this.name = "StorageUnavailableError";
  }
}

type CreateStoredFileInput = {
  ownerId: string;
  companyId?: string;
  category: string;
  originalName: string;
  mimeType: string;
  data: Buffer;
  extension: string;
};

function isProduction() {
  return process.env.NODE_ENV === "production";
}

function privateObjectKey(category: string, extension: string) {
  return `${category}/${crypto.randomUUID()}.${extension}`;
}

function devObjectPath(objectKey: string) {
  const destination = path.resolve(DEV_STORAGE_ROOT, objectKey);
  const relative = path.relative(DEV_STORAGE_ROOT, destination);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new StorageUnavailableError("Invalid private storage object key");
  }
  return destination;
}

function s3Client() {
  try {
    const config = requireStorageEnv();
    return {
      client: new S3Client({
        region: config.region,
        endpoint: config.endpoint,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      }),
      bucket: config.bucket,
    };
  } catch (error) {
    throw new StorageUnavailableError(error instanceof Error ? error.message : undefined);
  }
}

export async function createStoredFile(input: CreateStoredFileInput) {
  const objectKey = privateObjectKey(input.category, input.extension);

  if (isProduction()) {
    const { client, bucket } = s3Client();
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: input.data,
      ContentType: input.mimeType,
    }));
  } else {
    const target = devObjectPath(objectKey);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, input.data, { flag: "wx" });
  }

  try {
    return await prisma.storedFile.create({
      data: {
        ownerId: input.ownerId,
        companyId: input.companyId,
        objectKey,
        category: input.category,
        originalName: input.originalName.slice(0, 255),
        mimeType: input.mimeType,
        sizeBytes: input.data.byteLength,
      },
    });
  } catch (error) {
    await deleteObject(objectKey).catch(() => undefined);
    throw error;
  }
}

export async function getPrivateObject(objectKey: string): Promise<Buffer> {
  if (isProduction()) {
    throw new StorageUnavailableError("Production objects must be delivered by a signed URL");
  }
  return readFile(devObjectPath(objectKey));
}

export async function getPrivateDownloadUrl(objectKey: string, fileName: string) {
  if (!isProduction()) return null;
  const { client, bucket } = s3Client();
  return getSignedUrl(client, new GetObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    ResponseContentDisposition: `attachment; filename="${fileName.replace(/[\\\r\n\"]/g, "_")}"`,
  }), {
    expiresIn: Number(process.env.S3_SIGNED_URL_TTL_SECONDS || 300),
  });
}

export async function getWorkerDownloadUrl(objectKey: string): Promise<string | null> {
  if (isProduction() || process.env.S3_BUCKET_NAME) {
    try {
      const { client, bucket } = s3Client();
      return await getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: bucket,
          Key: objectKey,
        }),
        { expiresIn: 900 }
      );
    } catch {
      return null;
    }
  }
  return null;
}

export async function deleteObject(objectKey: string) {
  if (isProduction()) {
    const { client, bucket } = s3Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: objectKey }));
    return;
  }
  await unlink(devObjectPath(objectKey));
}
